import { toPromptDetail } from "@/lib/prompt-helpers";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type Context = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, context: Context) {
  const { id } = await context.params;

  const prompt = await prisma.prompt.findUnique({
    where: { id },
    include: { response: true },
  });

  if (!prompt) {
    return NextResponse.json({ error: "Prompt nao encontrado." }, { status: 404 });
  }

  return NextResponse.json(toPromptDetail(prompt));
}
