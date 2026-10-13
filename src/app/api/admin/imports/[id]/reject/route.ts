import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(
  request: Request,
  context: RouteContext
) {
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

    const { id } = await context.params;
    const draftId = Number(id);

    if (!Number.isInteger(draftId)) {
      return NextResponse.json(
        { error: "Некорректный ID черновика" },
        { status: 400 }
      );
    }

    const draft = await prisma.productDraft.findUnique({
      where: {
        id: draftId,
      },
    });

    if (!draft) {
      return NextResponse.json(
        { error: "Черновик не найден" },
        { status: 404 }
      );
    }

    if (draft.status !== "PENDING") {
      return NextResponse.json(
        {
          error: `Черновик уже обработан. Текущий статус: ${draft.status}`,
        },
        { status: 400 }
      );
    }

    const updatedDraft = await prisma.productDraft.update({
      where: {
        id: draftId,
      },
      data: {
        status: "REJECTED",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Импорт отклонён",
      draft: updatedDraft,
    });
  } catch (error) {
    console.error("POST /reject error:", error);

    return NextResponse.json(
      {
        error: "Не удалось отклонить импорт",
      },
      { status: 500 }
    );
  }
}