import { NextRequest, NextResponse } from "next/server";
import { appendShiftToSheet, updateShiftInSheet } from "@/lib/googleSheets";
import type { SyncQueueItem, Shift } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const item: SyncQueueItem = await request.json();

    if (!item.table || !item.action || !item.payload) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    if (item.table === "shifts") {
      const shift = item.payload as Shift;

      // Timestamp từ client có thể bị giả mạo nếu chỉnh giờ máy.
      // Server ghi đè updated_at bằng giờ server — đây là giá trị tin cậy.
      // start_time / end_time vẫn giữ nguyên từ client vì đó là thời điểm
      // nhân viên thực sự bấm — server không biết được mốc đó.
      const trustedShift: Shift = {
        ...shift,
        updated_at: new Date().toISOString(),
      };

      if (item.action === "CREATE") {
        await appendShiftToSheet(trustedShift);
      } else if (item.action === "UPDATE") {
        await updateShiftInSheet(trustedShift);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[/api/sync] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
