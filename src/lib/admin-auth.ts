import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";

const ADMIN_TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 7;

type AdminPayload = {
  sid: string;
  exp: number;
};

const toBase64Url = (value: string) => Buffer.from(value, "utf8").toString("base64url");
const fromBase64Url = (value: string) => Buffer.from(value, "base64url").toString("utf8");

const getRequiredEnv = (name: "ADMIN_CODE" | "ADMIN_TOKEN_SECRET") => {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const signPayload = (payloadB64: string) =>
  createHmac("sha256", getRequiredEnv("ADMIN_TOKEN_SECRET"))
    .update(payloadB64)
    .digest("base64url");

const safeEquals = (a: string, b: string) => {
  const aBuf = Buffer.from(a, "utf8");
  const bBuf = Buffer.from(b, "utf8");
  if (aBuf.length !== bBuf.length) {
    return false;
  }
  return timingSafeEqual(aBuf, bBuf);
};

export const forbiddenAdminResponse = () =>
  NextResponse.json({ error: "Acesso negado." }, { status: 403 });

export const isAdminCodeValid = (code: string) =>
  safeEquals(code, getRequiredEnv("ADMIN_CODE"));

export const createAdminToken = (sessionId: string) => {
  const payload: AdminPayload = {
    sid: sessionId,
    exp: Date.now() + ADMIN_TOKEN_TTL_MS,
  };

  const payloadB64 = toBase64Url(JSON.stringify(payload));
  const signature = signPayload(payloadB64);
  return `${payloadB64}.${signature}`;
};

export const verifyAdminToken = (token: string, sessionId: string) => {
  const parts = token.split(".");
  if (parts.length !== 2) {
    return false;
  }

  const [payloadB64, signature] = parts;
  const expected = signPayload(payloadB64);

  if (!safeEquals(signature, expected)) {
    return false;
  }

  let payload: AdminPayload;
  try {
    payload = JSON.parse(fromBase64Url(payloadB64)) as AdminPayload;
  } catch {
    return false;
  }

  if (typeof payload.sid !== "string" || typeof payload.exp !== "number") {
    return false;
  }

  if (payload.exp <= Date.now()) {
    return false;
  }

  return payload.sid === sessionId;
};

export const isAdminAuthorized = (request: NextRequest) => {
  const sessionId = request.headers.get("x-session-id")?.trim() ?? "";
  const token = request.headers.get("x-admin-token")?.trim() ?? "";

  if (!sessionId || !token) {
    return false;
  }

  return verifyAdminToken(token, sessionId);
};
