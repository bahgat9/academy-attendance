import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { descriptorToVectorLiteral } from "@/lib/face/vector";

type EnrollmentSample = {
  imageDataUrl: string;
  descriptor: number[];
};

function dataUrlToBuffer(dataUrl: string) {
  const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);

  if (!matches) {
    throw new Error("Invalid image data");
  }

  const mimeType = matches[1];
  const base64Data = matches[2];
  const buffer = Buffer.from(base64Data, "base64");

  return { mimeType, buffer };
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const admin = createAdminClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: playerId } = await context.params;
    const body = await request.json();
    const samples = (body.samples ?? []) as EnrollmentSample[];

    if (!Array.isArray(samples) || samples.length < 5) {
      return NextResponse.json(
        { error: "At least 5 samples are required" },
        { status: 400 }
      );
    }

    const { data: player, error: playerError } = await supabase
      .from("players")
      .select("id, owner_id, full_name")
      .eq("id", playerId)
      .eq("owner_id", user.id)
      .single();

    if (playerError || !player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    const { error: deleteExistingError } = await admin
      .from("face_profiles")
      .delete()
      .eq("player_id", playerId)
      .eq("owner_id", user.id);

    if (deleteExistingError) {
      return NextResponse.json(
        { error: deleteExistingError.message },
        { status: 500 }
      );
    }

    const rows = [];

    for (let i = 0; i < samples.length; i++) {
      const sample = samples[i];

      if (!sample.imageDataUrl || !Array.isArray(sample.descriptor)) {
        return NextResponse.json(
          { error: "Invalid sample payload" },
          { status: 400 }
        );
      }

      if (sample.descriptor.length !== 128) {
        return NextResponse.json(
          { error: "Descriptor must contain 128 values" },
          { status: 400 }
        );
      }

      const { mimeType, buffer } = dataUrlToBuffer(sample.imageDataUrl);
      const extension = mimeType.includes("png") ? "png" : "jpg";
      const filePath = `${user.id}/${playerId}/sample-${i + 1}.${extension}`;

      const { error: uploadError } = await admin.storage
        .from("face-enrollments")
        .upload(filePath, buffer, {
          contentType: mimeType,
          upsert: true,
        });

      if (uploadError) {
        return NextResponse.json({ error: uploadError.message }, { status: 500 });
      }

      rows.push({
        player_id: playerId,
        owner_id: user.id,
        embedding: descriptorToVectorLiteral(sample.descriptor),
        reference_image_path: filePath,
        sample_index: i + 1,
        quality_score: 100,
      });
    }

    const { error: insertError } = await admin
      .from("face_profiles")
      .insert(rows);

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      saved: rows.length,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to save enrollment" },
      { status: 500 }
    );
  }
}