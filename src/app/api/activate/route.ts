import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { code } = await request.json();

  if (!code || typeof code !== "string") {
    return NextResponse.json({ error: "Code invalide" }, { status: 400 });
  }

  const expected = process.env.ACTIVATION_CODE;
  if (!expected) {
    console.error("[/api/activate] ACTIVATION_CODE env variable is not set");
    return NextResponse.json({ error: "Configuration manquante" }, { status: 500 });
  }

  if (code.trim() !== expected.trim()) {
    return NextResponse.json({ error: "Code incorrect" }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
