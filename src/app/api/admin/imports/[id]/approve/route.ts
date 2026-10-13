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
    // Проверяем авторизацию
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Необходимо войти в аккаунт" },
        { status: 401 }
      );
    }

    // Только администратор может публиковать товары
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Доступ запрещён" },
        { status: 403 }
      );
    }

    // Получаем ID черновика
    const { id } = await context.params;
    const draftId = Number(id);

    if (!Number.isInteger(draftId)) {
      return NextResponse.json(
        { error: "Некорректный ID черновика" },
        { status: 400 }
      );
    }

    // Получаем черновик
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

    // Нельзя повторно публиковать уже обработанный черновик
    if (draft.status !== "PENDING") {
      return NextResponse.json(
        {
          error: `Черновик уже обработан. Текущий статус: ${draft.status}`,
        },
        { status: 400 }
      );
    }

    // Проверяем обязательные данные
    if (!draft.name?.trim()) {
      return NextResponse.json(
        { error: "У товара отсутствует название" },
        { status: 400 }
      );
    }

    if (draft.price === null || draft.price <= 0) {
      return NextResponse.json(
        { error: "У товара отсутствует корректная цена" },
        { status: 400 }
      );
    }

    if (!draft.category?.trim()) {
      return NextResponse.json(
        { error: "У товара отсутствует категория" },
        { status: 400 }
      );
    }

    /*
     * После этой проверки TypeScript уже знает,
     * что price — обычный number, а не number | null.
     */
    const price = draft.price;

    const categorySlug = draft.category;

    // Создаём настоящий Product и одновременно
    // помечаем ProductDraft как APPROVED.
    const result = await prisma.$transaction(async (tx) => {
      // Ищем категорию по slug
      const category = await tx.category.findUnique({
        where: {
          slug: categorySlug,
        },
      });

      if (!category) {
        throw new Error(
          `Категория "${categorySlug}" не найдена в базе данных`
        );
      }

      // Создаём настоящий товар
      const product = await tx.product.create({
        data: {
          name: draft.name.trim(),

          brand:
            draft.brand?.trim() || "Не указан",

          model:
            draft.model?.trim() || draft.name.trim(),

          categoryId: category.id,

          condition:
            draft.condition?.trim() || "Б/У",

          status: "В наличии",

          memory: draft.memory,
          color: draft.color,
          battery: draft.battery,

          // Здесь теперь гарантированно number
          price,

          oldPrice: draft.oldPrice,

          description: draft.description,

          images: draft.images ?? [],

          telegramVideo: draft.telegramVideo,

          quantity: 1,

          rating: 0,
          reviews: 0,
          sales: 0,

          year: draft.year,

          display: draft.display,
          processor: draft.processor,
          camera: draft.camera,
          sim: draft.sim,

          isNew:
            draft.condition === "Новый",

          isHit: false,
        },
      });

      // Обновляем исходный черновик
      const updatedDraft =
        await tx.productDraft.update({
          where: {
            id: draft.id,
          },

          data: {
            status: "APPROVED",
          },
        });

      return {
        product,
        draft: updatedDraft,
      };
    });

    // Успешный ответ
    return NextResponse.json({
      success: true,

      message:
        "Товар успешно опубликован в каталоге",

      product: result.product,

      draft: result.draft,
    });
  } catch (error) {
    console.error(
      "POST /api/admin/imports/[id]/approve error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Не удалось опубликовать товар";

    return NextResponse.json(
      {
        error: message,
      },
      {
        status: 500,
      }
    );
  }
}