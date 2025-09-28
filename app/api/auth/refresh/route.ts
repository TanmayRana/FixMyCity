import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { signAccessToken, verifyRefreshToken } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(_request: NextRequest) {
  try {
    const cookieStore = cookies();
    const refreshToken = cookieStore.get("refresh_token")?.value;
    if (!refreshToken) {
      return NextResponse.json({ error: "No refresh token" }, { status: 401 });
    }

    const payload = verifyRefreshToken(refreshToken);
    const accessToken = signAccessToken({
      userId: String(payload.userId),
      email: String(payload.email),
      role: String(payload.role),
      department: (payload as any).department || null,
    });

    return NextResponse.json({ success: true, token: accessToken });
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
