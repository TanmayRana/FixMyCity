import { NextRequest, NextResponse } from "next/server";
import { clearRefreshCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(_request: NextRequest) {
  clearRefreshCookie();
  return NextResponse.json({ success: true });
}
