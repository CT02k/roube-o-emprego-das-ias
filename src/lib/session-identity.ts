import { createHash, createHmac } from "crypto";
import { isIP } from "net";
import { prisma } from "@/lib/prisma";
import type { NextRequest } from "next/server";

type IpCandidate = {
  ip: string;
  source: string;
};

const singleValueHeaders = [
  "cf-connecting-ip",
  "fly-client-ip",
  "fastly-client-ip",
  "true-client-ip",
  "x-real-ip",
  "x-client-ip",
  "x-cluster-client-ip",
  "x-forwarded-for",
  "x-vercel-forwarded-for",
] as const;

const stripWrapping = (value: string) => {
  let result = value.trim().replace(/^"+|"+$/g, "");
  if (result.startsWith("for=")) {
    result = result.slice(4);
  }
  if (result.startsWith("[") && result.includes("]")) {
    result = result.slice(1, result.indexOf("]"));
  }
  return result;
};

const normalizeIp = (raw: string) => {
  const trimmed = stripWrapping(raw);
  if (!trimmed || trimmed === "unknown" || trimmed === "null") {
    return null;
  }

  const withoutZone = trimmed.replace(/%.+$/, "");
  const mappedIpv4 = withoutZone.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (mappedIpv4) {
    return mappedIpv4[1];
  }

  if (isIP(withoutZone)) {
    return withoutZone;
  }

  const ipv4WithPort = withoutZone.match(/^(\d+\.\d+\.\d+\.\d+):\d+$/);
  if (ipv4WithPort && isIP(ipv4WithPort[1]) === 4) {
    return ipv4WithPort[1];
  }

  return null;
};

const isReservedIpv4 = (ip: string) => {
  const parts = ip.split(".").map((part) => Number.parseInt(part, 10));
  const [a, b] = parts;

  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0) ||
    (a === 192 && b === 0 && parts[2] === 2) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51 && parts[2] === 100) ||
    (a === 203 && b === 0 && parts[2] === 113) ||
    a >= 224
  );
};

const isReservedIpv6 = (ip: string) => {
  const value = ip.toLowerCase();
  if (value === "::" || value === "::1") {
    return true;
  }

  if (value.startsWith("ff")) {
    return true;
  }

  if (value.startsWith("fc") || value.startsWith("fd")) {
    return true;
  }

  if (/^fe[89ab]/.test(value)) {
    return true;
  }

  if (value.startsWith("2001:db8")) {
    return true;
  }

  const mappedIpv4 = value.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  return mappedIpv4 ? isReservedIpv4(mappedIpv4[1]) : false;
};

const isPublicIp = (ip: string) => {
  const version = isIP(ip);
  if (version === 4) {
    return !isReservedIpv4(ip);
  }
  if (version === 6) {
    return !isReservedIpv6(ip);
  }
  return false;
};

const parseForwardedHeader = (value: string): string[] =>
  value
    .split(",")
    .flatMap((entry) => entry.split(";"))
    .map((entry) => entry.trim())
    .filter((entry) => entry.toLowerCase().startsWith("for="))
    .map((entry) => entry.slice(4));

export const extractPublicIpFromRequest = (request: NextRequest): IpCandidate | null => {
  const candidates: IpCandidate[] = [];
  const requestIp = (request as NextRequest & { ip?: string | null }).ip;
  if (typeof requestIp === "string" && requestIp.trim().length > 0) {
    candidates.push({ ip: requestIp, source: "request.ip" });
  }

  for (const header of singleValueHeaders) {
    const value = request.headers.get(header);
    if (!value) {
      continue;
    }

    const parts =
      header === "x-forwarded-for" || header === "x-vercel-forwarded-for"
        ? value.split(",")
        : [value];

    for (const part of parts) {
      candidates.push({ ip: part, source: header });
    }
  }

  const forwarded = request.headers.get("forwarded");
  if (forwarded) {
    for (const part of parseForwardedHeader(forwarded)) {
      candidates.push({ ip: part, source: "forwarded" });
    }
  }

  for (const candidate of candidates) {
    const normalized = normalizeIp(candidate.ip);
    if (!normalized || !isPublicIp(normalized)) {
      continue;
    }

    return {
      ip: normalized,
      source: candidate.source,
    };
  }

  return null;
};

const getIpHashSecret = () =>
  process.env.IP_HASH_SECRET?.trim() || process.env.ADMIN_TOKEN_SECRET?.trim() || "";

export const hashIp = (ip: string) => {
  const secret = getIpHashSecret();
  if (secret) {
    return createHmac("sha256", secret).update(ip).digest("hex");
  }

  return createHash("sha256").update(ip).digest("hex");
};

export const touchSessionIdentity = async (sessionId: string, request: NextRequest) => {
  const now = new Date();
  const ipCandidate = extractPublicIpFromRequest(request);

  await prisma.sessionIdentity.upsert({
    where: {
      sessionId,
    },
    create: {
      sessionId,
      ipHash: ipCandidate ? hashIp(ipCandidate.ip) : null,
      ipSource: ipCandidate?.source,
      lastSeenAt: now,
      lastIpAt: ipCandidate ? now : null,
    },
    update: ipCandidate
      ? {
          ipHash: hashIp(ipCandidate.ip),
          ipSource: ipCandidate.source,
          lastSeenAt: now,
          lastIpAt: now,
        }
      : {
          lastSeenAt: now,
        },
  });
};
