import { forbiddenAdminResponse, isAdminAuthorized } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return forbiddenAdminResponse();
  }

  const now = new Date();
  const startOfDayUtc = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0)
  );

  const [pending, inProgress, responded, todayTotal] = await Promise.all([
    prisma.prompt.count({ where: { status: "pending" } }),
    prisma.prompt.count({ where: { status: "in_progress" } }),
    prisma.prompt.count({ where: { status: "responded" } }),
    prisma.prompt.count({ where: { createdAt: { gte: startOfDayUtc } } }),
  ]);

  return NextResponse.json({
    pending,
    inProgress,
    responded,
    todayTotal,
  });
}
