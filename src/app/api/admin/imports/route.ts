import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Необходимо войти в аккаунт" },
        { status: 401 }
      );
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Доступ запрещён" },
        { status: 403 }
      );
    }

    const drafts = await prisma.productDraft.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      drafts,
    });
  } catch (error) {
    console.error("GET /api/admin/imports error:", error);

    return NextResponse.json(
      { error: "Не удалось загрузить импорты" },
      { status: 500 }
    );
  }
}