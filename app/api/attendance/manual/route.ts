import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

        const { data: settings } = await admin
            .from("app_settings")
            .select("duplicate_window_minutes")
            .eq("owner_id", user.id)
            .maybeSingle();

        const duplicateWindowMinutes = settings?.duplicate_window_minutes ?? 60;

        const body = await request.json();
        const playerId = body.playerId as string;

        if (!playerId) {
            return NextResponse.json({ error: "Player ID is required" }, { status: 400 });
        }

        const { data: player, error: playerError } = await admin
            .from("players")
            .select("id, full_name, is_active")
            .eq("id", playerId)
            .eq("owner_id", user.id)
            .single();

        if (playerError || !player) {
            return NextResponse.json({ error: "Player not found" }, { status: 404 });
        }

        if (!player.is_active) {
            return NextResponse.json({ error: "Player is inactive" }, { status: 400 });
        }

        const duplicateSince = new Date(
            Date.now() - duplicateWindowMinutes * 60 * 1000
        ).toISOString();

        const { data: existingDuplicate, error: duplicateError } = await admin
            .from("attendance_records")
            .select("id")
            .eq("owner_id", user.id)
            .eq("player_id", player.id)
            .gte("scan_time", duplicateSince)
            .limit(1)
            .maybeSingle();

        if (duplicateError) {
            return NextResponse.json({ error: duplicateError.message }, { status: 500 });
        }

        if (existingDuplicate) {
            await admin.from("attendance_records").insert({
                owner_id: user.id,
                player_id: player.id,
                player_name: player.full_name,
                recognition_status: "duplicate_blocked",
                confidence: null,
            });

            return NextResponse.json({
                success: false,
                status: "duplicate_blocked",
                message: "Attendance already marked recently",
                player: {
                    id: player.id,
                    fullName: player.full_name,
                },
            });
        }

        const { error: insertError } = await admin.from("attendance_records").insert({
            owner_id: user.id,
            player_id: player.id,
            player_name: player.full_name,
            recognition_status: "manual",
            confidence: null,
        });

        if (insertError) {
            return NextResponse.json({ error: insertError.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            status: "manual",
            message: "Attendance marked manually",
            player: {
                id: player.id,
                fullName: player.full_name,
            },
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Failed to mark manual attendance" },
            { status: 500 }
        );
    }
}