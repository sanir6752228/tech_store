import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const ALLOWED_STATUSES = [
  "Новый",
  "В обработке",
  "Отправлен",
  "Завершён",
  "Отменён",
];

export async function PATCH(
  request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    // ========================================================
    // ПРОВЕРКА TELEGRAM SECRET
    // ========================================================

    const secret = request.headers.get("x-telegram-secret");
    const expectedSecret = process.env.TELEGRAM_BOT_SECRET;

    if (!expectedSecret || !secret || secret !== expectedSecret) {
      return NextResponse.json(
        {
          error: "Доступ запрещён",
        },
        {
          status: 403,
        }
      );
    }

    // ========================================================
    // ID ЗАКАЗА
    // ========================================================

    const { id } = await context.params;
    const orderId = Number(id);

    if (!Number.isInteger(orderId) || orderId <= 0) {
      return NextResponse.json(
        {
          error: "Некорректный ID заказа",
        },
        {
          status: 400,
        }
      );
    }

    // ========================================================
    // BODY
    // ========================================================

    const body = await request.json();

    const status = String(body.status || "").trim();

    if (!ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json(
        {
          error: "Недопустимый статус",
          allowedStatuses: ALLOWED_STATUSES,
        },
        {
          status: 400,
        }
      );
    }

    // ========================================================
    // ПРОВЕРЯЕМ ЗАКАЗ
    // ========================================================

    const existingOrder = await prisma.order.findUnique({
      where: {
        id: orderId,
      },
    });

    if (!existingOrder) {
      return NextResponse.json(
        {
          error: "Заказ не найден",
        },
        {
          status: 404,
        }
      );
    }

    // ========================================================
    // ОБНОВЛЯЕМ ЗАКАЗ
    // ========================================================

    const order = await prisma.order.update({
      where: {
        id: orderId,
      },

      data: {
        status,
      },

      include: {
        items: true,
      },
    });

    console.log(
      `Telegram: заказ #${order.id}: ${existingOrder.status} → ${order.status}`
    );

    // ========================================================
    // ОТВЕТ
    // ========================================================

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (error: any) {
    console.error(
      "Ошибка изменения статуса заказа:",
      error
    );

    if (error?.code === "P2025") {
      return NextResponse.json(
        {
          error: "Заказ не найден",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(
      {
        error: "Ошибка изменения статуса",
      },
      {
        status: 500,
      }
    );
  }
}