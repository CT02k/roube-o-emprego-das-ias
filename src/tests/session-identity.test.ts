import { describe, expect, it } from "vitest";
import { extractPublicIpFromRequest, hashIp } from "@/lib/session-identity";
import { NextRequest } from "next/server";

const makeRequest = (headers: Record<string, string>) =>
  new NextRequest("https://example.com/api/prompts", {
    headers,
  });

describe("session identity", () => {
  it("usa o primeiro IP publico valido do forwarded chain", () => {
    const request = makeRequest({
      "x-forwarded-for": "127.0.0.1, 10.0.0.2, 203.0.113.9, 8.8.8.8",
      "cf-connecting-ip": "8.8.4.4",
    });

    const result = extractPublicIpFromRequest(request);
    expect(result).toEqual({
      ip: "8.8.4.4",
      source: "cf-connecting-ip",
    });
  });

  it("ignora IPs locais, quebrados e nao publicos", () => {
    const request = makeRequest({
      "x-forwarded-for": "unknown, 0.0.0.0, 127.0.0.1, 192.168.0.10, 172.16.0.1",
      "x-real-ip": "::1",
      forwarded: "for=bad-ip;proto=https, for=\"[fd00::1]\"",
    });

    expect(extractPublicIpFromRequest(request)).toBeNull();
  });

  it("gera hash deterministico para o mesmo IP", () => {
    expect(hashIp("8.8.8.8")).toBe(hashIp("8.8.8.8"));
  });
});
