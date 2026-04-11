import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const admin = createAdminClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const search = searchParams.get("search");

    let query = admin
      .from("attendance_records")
      .select("*")
      .eq("owner_id", user.id)
      .order("scan_time", { ascending: false });

    if (date) {
      const start = new Date(`${date}T00:00:00`);
      const end = new Date(`${date}T23:59:59`);

      query = query
        .gte("scan_time", start.toISOString())
        .lte("scan_time", end.toISOString());
    }

    if (search) {
      query = query.ilike("player_name", `%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      return new NextResponse(error.message, { status: 500 });
    }

    const rows = [
      ["Player Name", "Status", "Distance", "Scan Time"],
      ...(data ?? []).map((row) => [
        row.player_name,
        row.recognition_status,
        row.confidence ?? "",
        new Date(row.scan_time).toLocaleString(),
      ]),
    ];

    const csv = rows
      .map((row) =>
        row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="attendance-export.csv"`,
      },
    });
  } catch (error) {
    console.error(error);
    return new NextResponse("Failed to export attendance", { status: 500 });
  }
}