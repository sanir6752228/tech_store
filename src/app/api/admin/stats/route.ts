import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Количество товаров
    const products = await prisma.product.count();

    // Количество всех заказов
    const orders = await prisma.order.count();

    // Количество выполненных ремонтов
    // Пока считаем все записи Repair, если такая модель есть
    const repairs = await prisma.repair.count();

    // Доход считаем ТОЛЬКО по выполненным заказам
    // со статусом "Выдан"
    const incomeResult = await prisma.order.aggregate({
      _sum: {
        total: true,
      },
      where: {
        status: "Выдан",
      },
    });

    const income = incomeResult._sum.total ?? 0;

    return NextResponse.json({
      products,
      orders,
      repairs,
      income,
    });
  } catch (error) {
    console.error(
      "Ошибка загрузки статистики:",
      error
    );

    return NextResponse.json(
      {
        error: "Ошибка загрузки статистики",
      },
      {
        status: 500,
      }
    );
  }
}