import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      customerName,
      phone,
      city,
      address,
      contactMethod,
      comment,
      items,
    } = body;

    // ============================================
    // ПРОВЕРКА ДАННЫХ КЛИЕНТА
    // ============================================

    if (
      !customerName ||
      !phone ||
      !city ||
      !address ||
      !contactMethod
    ) {
      return NextResponse.json(
        {
          error: "Заполните все обязательные поля",
        },
        {
          status: 400,
        }
      );
    }

    // ============================================
    // ПРОВЕРКА КОРЗИНЫ
    // ============================================

    if (
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return NextResponse.json(
        {
          error: "Корзина пуста",
        },
        {
          status: 400,
        }
      );
    }

    // ============================================
    // ПОЛУЧАЕМ ID ТОВАРОВ
    // ============================================

    const productIds = items
      .map((item: any) => Number(item.id))
      .filter(
        (id: number) =>
          Number.isInteger(id) && id > 0
      );

    if (productIds.length === 0) {
      return NextResponse.json(
        {
          error: "Некорректные товары",
        },
        {
          status: 400,
        }
      );
    }

    // ============================================
    // ПОЛУЧАЕМ ТОВАРЫ ИЗ БАЗЫ
    // ============================================

    const products =
      await prisma.product.findMany({
        where: {
          id: {
            in: productIds,
          },
        },
      });

    if (products.length !== productIds.length) {
      return NextResponse.json(
        {
          error:
            "Некоторые товары больше не существуют",
        },
        {
          status: 400,
        }
      );
    }

    // ============================================
    // СОЗДАЁМ ORDER ITEM
    // ============================================

    const orderItems = [];

    let total = 0;

    for (const item of items) {
      const product = products.find(
        (product) =>
          product.id === Number(item.id)
      );

      if (!product) {
        return NextResponse.json(
          {
            error: "Товар не найден",
          },
          {
            status: 400,
          }
        );
      }

      // Б/У товар — максимум 1 штука
      let quantity = Number(item.quantity);

      if (!Number.isInteger(quantity) || quantity < 1) {
        quantity = 1;
      }

      if (product.condition === "Б/У") {
        quantity = 1;
      }

      // Проверяем наличие
      if (product.status === "Продан") {
        return NextResponse.json(
          {
            error: `Товар "${product.name}" уже продан`,
          },
          {
            status: 400,
          }
        );
      }

      const itemTotal =
        product.price * quantity;

      total += itemTotal;

      orderItems.push({
        productId: product.id,
        productName: product.name,
        price: product.price,
        quantity,
      });
    }

    // ============================================
    // СОЗДАЁМ ЗАКАЗ
    // ============================================

    const order = await prisma.order.create({
      data: {
        customerName: String(customerName).trim(),
        phone: String(phone).trim(),
        city: String(city).trim(),
        address: String(address).trim(),
        contactMethod: String(contactMethod).trim(),
        comment: comment
          ? String(comment).trim()
          : null,

        total,

        status: "Новый",

        items: {
          create: orderItems,
        },
      },

      include: {
        items: true,
      },
    });

    // ============================================
    // ОТВЕТ
    // ============================================

    return NextResponse.json(
      {
        success: true,
        order,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Ошибка создания заказа:",
      error
    );

    return NextResponse.json(
      {
        error: "Ошибка оформления заказа",
      },
      {
        status: 500,
      }
    );
  }
}