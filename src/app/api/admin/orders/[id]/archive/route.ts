import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const secret = request.headers.get(
      "x-telegram-secret"
    );

    const expectedSecret =
      process.env.TELEGRAM_BOT_SECRET;

    if (
      !expectedSecret ||
      !secret ||
      secret !== expectedSecret
    ) {
      return NextResponse.json(
        {
          error: "Доступ запрещён",
        },
        {
          status: 403,
        }
      );
    }

    const { id } = await context.params;

    const orderId = Number(id);

    if (
      !Number.isInteger(orderId) ||
      orderId <= 0
    ) {
      return NextResponse.json(
        {
          error: "Некорректный ID заказа",
        },
        {
          status: 400,
        }
      );
    }

    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
      },
      include: {
        items: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        {
          error: "Заказ не найден",
        },
        {
          status: 404,
        }
      );
    }

    const completedStatuses = [
      "Завершён",
      "Выдан",
    ];

    if (
      !completedStatuses.includes(
        order.status
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Убрать из бота можно только выполненный заказ",
        },
        {
          status: 400,
        }
      );
    }

    const updatedOrder =
      await prisma.order.update({
        where: {
          id: orderId,
        },
        data: {
          botArchived: true,
        },
        include: {
          items: true,
        },
      });

    return NextResponse.json({
      success: true,
      order: updatedOrder,
    });
  } catch (error: any) {
    console.error(
      "Ошибка архивации заказа в Telegram:",
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
        error:
          "Ошибка архивации заказа",
      },
      {
        status: 500,
      }
    );
  }
}