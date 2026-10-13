import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// ========================================================
// GET — ПОЛУЧИТЬ ВСЕ ЗАКАЗЫ
// ========================================================

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      include: {
        items: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Ошибка загрузки заказов:", error);

    return NextResponse.json(
      {
        error: "Ошибка загрузки заказов",
      },
      {
        status: 500,
      }
    );
  }
}

// ========================================================
// PATCH — ИЗМЕНИТЬ СТАТУС ЗАКАЗА ИЗ АДМИНКИ
// ========================================================

export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    const orderId = Number(body.orderId);
    const status = String(body.status || "").trim();

    // ----------------------------------------------------
    // ПРОВЕРКА ID
    // ----------------------------------------------------

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

    // ----------------------------------------------------
    // ДОПУСТИМЫЕ СТАТУСЫ
    // ----------------------------------------------------

    const allowedStatuses = [
      "Новый",
      "Подтверждён",
      "В обработке",
      "Готов",
      "Выдан",
      "Отправлен",
      "Завершён",
      "Отменён",
    ];

    if (!allowedStatuses.includes(status)) {
      return NextResponse.json(
        {
          error: "Некорректный статус",
          allowedStatuses,
        },
        {
          status: 400,
        }
      );
    }

    // ----------------------------------------------------
    // ПРОВЕРЯЕМ СУЩЕСТВОВАНИЕ ЗАКАЗА
    // ----------------------------------------------------

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

    // ----------------------------------------------------
    // ОБНОВЛЯЕМ СТАТУС
    // ----------------------------------------------------

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
      `Статус заказа #${order.id}: ${existingOrder.status} → ${order.status}`
    );

    // ----------------------------------------------------
    // ОТВЕТ
    // ----------------------------------------------------

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Ошибка изменения статуса:", error);

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

// ========================================================
// DELETE — УДАЛИТЬ ВЫДАННЫЙ ЗАКАЗ
// ========================================================

export async function DELETE(request: Request) {
  try {
    const body = await request.json();

    const orderId = Number(body.orderId);

    // ----------------------------------------------------
    // ПРОВЕРКА ID
    // ----------------------------------------------------

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

    // ----------------------------------------------------
    // ИЩЕМ ЗАКАЗ
    // ----------------------------------------------------

    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
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

    // ----------------------------------------------------
    // УДАЛЯТЬ МОЖНО ТОЛЬКО ВЫПОЛНЕННЫЙ ЗАКАЗ
    // ----------------------------------------------------

    if (order.status !== "Выдан" && order.status !== "Завершён") {
      return NextResponse.json(
        {
          error:
            "Можно удалить только выполненный заказ со статусом «Выдан» или «Завершён»",
        },
        {
          status: 400,
        }
      );
    }

    // ----------------------------------------------------
    // УДАЛЯЕМ ЗАКАЗ И ЕГО ПОЗИЦИИ
    // ----------------------------------------------------

    await prisma.$transaction(async (tx) => {
      await tx.orderItem.deleteMany({
        where: {
          orderId,
        },
      });

      await tx.order.delete({
        where: {
          id: orderId,
        },
      });
    });

    // ----------------------------------------------------
    // ОТВЕТ
    // ----------------------------------------------------

    return NextResponse.json({
      success: true,
      orderId,
    });
  } catch (error) {
    console.error("Ошибка удаления заказа:", error);

    return NextResponse.json(
      {
        error: "Ошибка удаления заказа",
      },
      {
        status: 500,
      }
    );
  }
}