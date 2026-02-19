import { NextRequest, NextResponse } from "next/server";
import { getMediaUrl } from "@/lib/r2";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  const { key: rawKey = "" } = await params;
  const key = decodeURIComponent(rawKey);
  if (!key) {
    return NextResponse.json({ error: "Missing key" }, { status: 400 });
  }

  return NextResponse.redirect(getMediaUrl(key), { status: 302 });
}
