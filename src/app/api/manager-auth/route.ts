import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { pin } = await request.json();

  if (!pin || typeof pin !== "string") {
    return NextResponse.json({ error: "PIN invalide" }, { status: 400 });
  }

  const expected = process.env.MANAGER_PIN;
  if (!expected) {
    console.error("[/api/manager-auth] MANAGER_PIN env variable is not set");
    return NextResponse.json({ error: "Configuration manquante" }, { status: 500 });
  }

  if (pin.trim() !== expected.trim()) {
    return NextResponse.json({ error: "PIN manager incorrect." }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
