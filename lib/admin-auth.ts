import { NextRequest, NextResponse } from "next/server";

export const ADMIN_KEY =
  "010a381a5b837f16ee15a1f261a65f3e07cc5838367ffae6f3b9b14cbae48081";

export const isAdminAuthorized = (request: NextRequest) => {
  const key = request.headers.get("x-admin-key");
  return key === ADMIN_KEY;
};

export const forbiddenAdminResponse = () =>
  NextResponse.json({ error: "Acesso negado." }, { status: 403 });
