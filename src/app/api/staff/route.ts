import { NextResponse } from "next/server";
import { getStaffFromSheet } from "@/lib/googleSheets";

export async function GET() {
  try {
    const staff = await getStaffFromSheet();
    return NextResponse.json({ staff });
  } catch (error) {
    console.error("[/api/staff] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
