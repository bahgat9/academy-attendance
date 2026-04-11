import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { averageDistance } from "@/lib/face/match";

type FaceProfileRow = {
    id: string;
    player_id: string;
    embedding: string | number[];
};

type PlayerRow = {
    id: string;
    full_name: string;
    age_group: string | null;
    is_active: boolean;
};

function parseEmbedding(embedding: string | number[]) {
    if (Array.isArray(embedding)) {
        return embedding.map(Number);
    }

    const cleaned = embedding.replace(/^\[/, "").replace(/\]$/, "");
    return cleaned
        .split(",")
        .map((v) => Number(v.trim()))
        .filter((v) => !Number.isNaN(v));
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const admin = createAdminClient();

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const descriptor = body.descriptor as number[];

        if (!Array.isArray(descriptor) || descriptor.length !== 128) {
            return NextResponse.json(
                { error: "Descriptor must contain 128 values" },
                { status: 400 }
            );
        }

        // Get enrolled face profiles
        const { data: profiles, error: profilesError } = await admin
            .from("face_profiles")
            .select("id, player_id, embedding")
            .eq("owner_id", user.id);

        if (profilesError) {
            return NextResponse.json({ error: profilesError.message }, { status: 500 });
        }

        // Get players separately to avoid join issues
        const { data: players, error: playersError } = await admin
            .from("players")
            .select("id, full_name, age_group, is_active")
            .eq("owner_id", user.id);

        if (playersError) {
            return NextResponse.json({ error: playersError.message }, { status: 500 });
        }

        const playerMap = new Map<string, PlayerRow>(
            ((players ?? []) as PlayerRow[]).map((player) => [player.id, player])
        );

        const grouped = new Map<
            string,
            {
                playerId: string;
                fullName: string;
                ageGroup: string | null;
                isActive: boolean;
                descriptors: number[][];
            }
        >();

        for (const row of (profiles ?? []) as FaceProfileRow[]) {
            const player = playerMap.get(row.player_id);

            if (!player || !player.is_active) continue;

            const parsed = parseEmbedding(row.embedding);

            if (parsed.length !== 128) continue;

            if (!grouped.has(row.player_id)) {
                grouped.set(row.player_id, {
                    playerId: row.player_id,
                    fullName: player.full_name,
                    ageGroup: player.age_group,
                    isActive: player.is_active,
                    descriptors: [],
                });
            }

            grouped.get(row.player_id)!.descriptors.push(parsed);
        }

        let bestMatch:
            | {
                playerId: string;
                fullName: string;
                ageGroup: string | null;
                distance: number;
            }
            | undefined;

        for (const player of grouped.values()) {
            const distance = averageDistance(descriptor, player.descriptors);

            if (!bestMatch || distance < bestMatch.distance) {
                bestMatch = {
                    playerId: player.playerId,
                    fullName: player.fullName,
                    ageGroup: player.ageGroup,
                    distance,
                };
            }
        }

        if (!bestMatch) {
            return NextResponse.json({
                status: "unknown",
                matched: false,
                message: "No enrolled players found",
            });
        }

        const { data: settings } = await admin
            .from("app_settings")
            .select("duplicate_window_minutes, recognized_threshold, possible_threshold")
            .eq("owner_id", user.id)
            .maybeSingle();

        const recognizedThreshold = Number(settings?.recognized_threshold ?? 0.5);
        const possibleThreshold = Number(settings?.possible_threshold ?? 0.58);
        const duplicateWindowMinutes = settings?.duplicate_window_minutes ?? 60;

        if (bestMatch.distance > possibleThreshold) {
            await admin.from("attendance_records").insert({
                owner_id: user.id,
                player_id: null,
                player_name: "Unknown",
                recognition_status: "unknown",
                confidence: bestMatch.distance,
            });

            return NextResponse.json({
                status: "unknown",
                matched: false,
                distance: bestMatch.distance,
                message: "Unregistered person",
            });
        }

        const duplicateSince = new Date(
            Date.now() - duplicateWindowMinutes * 60 * 1000
        ).toISOString();

        const { data: existingDuplicate, error: duplicateError } = await admin
            .from("attendance_records")
            .select("id")
            .eq("owner_id", user.id)
            .eq("player_id", bestMatch.playerId)
            .gte("scan_time", duplicateSince)
            .limit(1)
            .maybeSingle();

        if (duplicateError) {
            return NextResponse.json({ error: duplicateError.message }, { status: 500 });
        }

        if (existingDuplicate) {
            await admin.from("attendance_records").insert({
                owner_id: user.id,
                player_id: bestMatch.playerId,
                player_name: bestMatch.fullName,
                recognition_status: "duplicate_blocked",
                confidence: bestMatch.distance,
            });

            return NextResponse.json({
                status: "duplicate_blocked",
                matched: true,
                player: {
                    id: bestMatch.playerId,
                    fullName: bestMatch.fullName,
                    ageGroup: bestMatch.ageGroup,
                },
                distance: bestMatch.distance,
                message: "Attendance already marked recently",
            });
        }

        const recognitionStatus =
            bestMatch.distance <= recognizedThreshold
                ? "recognized_auto"
                : "recognized_confirm";

        await admin.from("attendance_records").insert({
            owner_id: user.id,
            player_id: bestMatch.playerId,
            player_name: bestMatch.fullName,
            recognition_status: recognitionStatus,
            confidence: bestMatch.distance,
        });

        return NextResponse.json({
            status: recognitionStatus,
            matched: true,
            player: {
                id: bestMatch.playerId,
                fullName: bestMatch.fullName,
                ageGroup: bestMatch.ageGroup,
            },
            distance: bestMatch.distance,
            message:
                recognitionStatus === "recognized_auto"
                    ? "Attendance confirmed"
                    : "Possible match detected",
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Failed to process attendance scan" },
            { status: 500 }
        );
    }
}