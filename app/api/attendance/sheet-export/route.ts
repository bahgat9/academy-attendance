import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function getDateRange(selectedDate?: string) {
  const base = selectedDate
    ? new Date(`${selectedDate}T12:00:00`)
    : new Date();

  const start = new Date(base);
  start.setHours(0, 0, 0, 0);

  const end = new Date(base);
  end.setHours(23, 59, 59, 999);

  const inputValue = `${base.getFullYear()}-${`${base.getMonth() + 1}`.padStart(
    2,
    "0"
  )}-${`${base.getDate()}`.padStart(2, "0")}`;

  const label = base.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return {
    start: start.toISOString(),
    end: end.toISOString(),
    inputValue,
    label,
  };
}

function formatTime(dateString: string | null) {
  if (!dateString) return "";

  return new Date(dateString).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

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
    const selectedDate = searchParams.get("date") ?? undefined;

    const { start, end, inputValue, label } = getDateRange(selectedDate);

    const [playersResult, attendanceResult] = await Promise.all([
      admin
        .from("players")
        .select("id, full_name, age_group, is_active")
        .eq("owner_id", user.id)
        .eq("is_active", true)
        .order("full_name", { ascending: true }),

      admin
        .from("attendance_records")
        .select("id, player_id, player_name, recognition_status, scan_time")
        .eq("owner_id", user.id)
        .in("recognition_status", ["recognized_auto", "manual"])
        .gte("scan_time", start)
        .lte("scan_time", end)
        .order("scan_time", { ascending: true }),
    ]);

    if (playersResult.error) {
      return new NextResponse(playersResult.error.message, { status: 500 });
    }

    if (attendanceResult.error) {
      return new NextResponse(attendanceResult.error.message, { status: 500 });
    }

    const players = playersResult.data ?? [];
    const attendanceRows = attendanceResult.data ?? [];

    const firstCleanAttendanceByPlayer = new Map<
      string,
      {
        scan_time: string;
        recognition_status: string;
      }
    >();

    for (const row of attendanceRows) {
      if (!row.player_id) continue;

      if (!firstCleanAttendanceByPlayer.has(row.player_id)) {
        firstCleanAttendanceByPlayer.set(row.player_id, {
          scan_time: row.scan_time,
          recognition_status: row.recognition_status,
        });
      }
    }

    const sheetRows = players.map((player, index) => {
      const attendance = firstCleanAttendanceByPlayer.get(player.id);

      return {
        no: index + 1,
        player: player.full_name,
        ageGroup: player.age_group ?? "",
        status: attendance ? "Present" : "Absent",
        time: attendance ? formatTime(attendance.scan_time) : "",
        method:
          attendance?.recognition_status === "manual"
            ? "Manual"
            : attendance?.recognition_status === "recognized_auto"
            ? "Face Scan"
            : "",
      };
    });

    const presentCount = sheetRows.filter((row) => row.status === "Present").length;
    const absentCount = sheetRows.length - presentCount;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Academy Attendance";
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet("Daily Sheet", {
      views: [{ state: "frozen", ySplit: 6 }],
    });

    worksheet.columns = [
      { header: "No", key: "no", width: 8 },
      { header: "Player", key: "player", width: 28 },
      { header: "Age Group", key: "ageGroup", width: 16 },
      { header: "Status", key: "status", width: 14 },
      { header: "Time", key: "time", width: 14 },
      { header: "Method", key: "method", width: 16 },
    ];

    worksheet.mergeCells("A1:F1");
    worksheet.getCell("A1").value = "ACADEMY ATTENDANCE - DAILY SHEET";
    worksheet.getCell("A1").font = {
      bold: true,
      size: 16,
    };
    worksheet.getCell("A1").alignment = {
      horizontal: "center",
      vertical: "middle",
    };

    worksheet.mergeCells("A2:F2");
    worksheet.getCell("A2").value = label;
    worksheet.getCell("A2").font = {
      italic: true,
      size: 11,
    };
    worksheet.getCell("A2").alignment = {
      horizontal: "center",
      vertical: "middle",
    };

    worksheet.getCell("A4").value = "Present";
    worksheet.getCell("B4").value = presentCount;
    worksheet.getCell("D4").value = "Absent";
    worksheet.getCell("E4").value = absentCount;

    worksheet.getCell("A4").font = { bold: true };
    worksheet.getCell("D4").font = { bold: true };

    const headerRowIndex = 6;
    const headerRow = worksheet.getRow(headerRowIndex);
    headerRow.values = ["No", "Player", "Age Group", "Status", "Time", "Method"];
    headerRow.font = { bold: true };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };
    headerRow.height = 22;

    headerRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF1F2937" },
      };
      cell.font = {
        bold: true,
        color: { argb: "FFFFFFFF" },
      };
      cell.border = {
        top: { style: "thin", color: { argb: "FF374151" } },
        left: { style: "thin", color: { argb: "FF374151" } },
        bottom: { style: "thin", color: { argb: "FF374151" } },
        right: { style: "thin", color: { argb: "FF374151" } },
      };
    });

    let currentRowIndex = headerRowIndex + 1;

    for (const row of sheetRows) {
      const rowRef = worksheet.getRow(currentRowIndex);

      rowRef.getCell(1).value = row.no;
      rowRef.getCell(2).value = row.player;
      rowRef.getCell(3).value = row.ageGroup;
      rowRef.getCell(4).value = row.status;
      rowRef.getCell(5).value = row.time;
      rowRef.getCell(6).value = row.method;

      rowRef.alignment = { vertical: "middle", horizontal: "center" };
      rowRef.getCell(2).alignment = { vertical: "middle", horizontal: "left" };

      rowRef.eachCell((cell) => {
        cell.border = {
          top: { style: "thin", color: { argb: "FFD1D5DB" } },
          left: { style: "thin", color: { argb: "FFD1D5DB" } },
          bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
          right: { style: "thin", color: { argb: "FFD1D5DB" } },
        };
      });

      if (row.status === "Present") {
        rowRef.getCell(4).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFD1FAE5" },
        };
        rowRef.getCell(4).font = {
          bold: true,
          color: { argb: "FF065F46" },
        };
      } else {
        rowRef.getCell(4).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF3F4F6" },
        };
        rowRef.getCell(4).font = {
          color: { argb: "FF4B5563" },
        };
      }

      currentRowIndex += 1;
    }

    worksheet.pageSetup = {
      orientation: "portrait",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: {
        left: 0.3,
        right: 0.3,
        top: 0.5,
        bottom: 0.5,
        header: 0.3,
        footer: 0.3,
      },
    };

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer as ArrayBuffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="daily-attendance-sheet-${inputValue}.xlsx"`,
      },
    });
  } catch (error) {
    console.error(error);
    return new NextResponse("Failed to export daily sheet", { status: 500 });
  }
}