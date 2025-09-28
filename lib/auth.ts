import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

type JwtPayload = {
  userId: string;
  email: string;
  role: string;
  department?: string | null;
};

const getEnv = (key: string, fallback?: string) => {
  const value = process.env[key];
  if (!value && !fallback) throw new Error(`Missing env var: ${key}`);
  return value || fallback || "";
};

// Unified token verification for API routes
export function verifyTokenFromRequest(request: NextRequest): JwtPayload | null {
  // Try Authorization header first
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    try {
      return verifyAccessToken(token) as JwtPayload;
    } catch (error) {
      console.warn("Access token verification failed:", error);
    }
  }

  // Fallback to refresh token from cookies
  try {
    const cookieStore = cookies();
    const refreshToken = cookieStore.get("refresh_token")?.value;
    if (!refreshToken) return null;
    return verifyRefreshToken(refreshToken) as JwtPayload;
  } catch (error) {
    console.warn("Refresh token verification failed:", error);
    return null;
  }
}

export function signAccessToken(payload: JwtPayload) {
  const secret = getEnv("JWT_SECRET", "fallback-secret");
  return jwt.sign(payload, secret, { expiresIn: "15m" });
}

export function verifyAccessToken(token: string) {
  const secret = getEnv("JWT_SECRET", "fallback-secret");
  return jwt.verify(token, secret) as jwt.JwtPayload & JwtPayload;
}

export function signRefreshToken(
  payload: Pick<JwtPayload, "userId" | "email" | "role">
) {
  const secret = getEnv("JWT_REFRESH_SECRET", "fallback-refresh-secret");
  return jwt.sign(payload, secret, { expiresIn: "7d" });
}

export function verifyRefreshToken(token: string) {
  const secret = getEnv("JWT_REFRESH_SECRET", "fallback-refresh-secret");
  return jwt.verify(token, secret) as jwt.JwtPayload & JwtPayload;
}

export function setRefreshCookie(token: string) {
  const cookieStore = cookies();
  cookieStore.set("refresh_token", token, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearRefreshCookie() {
  const cookieStore = cookies();
  cookieStore.set("refresh_token", "", {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    expires: new Date(0),
  });
}
