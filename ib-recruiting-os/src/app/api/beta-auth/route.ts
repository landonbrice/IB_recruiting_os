import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const BETA_PASSWORD = process.env.BETA_PASSWORD;

  // If no password is configured, gate is disabled — always succeed
  if (!BETA_PASSWORD) {
    return NextResponse.json({ ok: true });
  }

  const body = await req.json().catch(() => ({})) as { password?: string };
  const ok = body.password === BETA_PASSWORD;
  return NextResponse.json({ ok });
}
