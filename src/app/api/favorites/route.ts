
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const idsParam = searchParams.get("ids") || "";

    if (!idsParam) {
      return NextResponse.json([]);
    }

    const ids = idsParam
      .split(",")
      .map((id) => Number(id))
      .filter(
        (id) =>
          Number.isInteger(id) &&
          id > 0
      );

    if (ids.length === 0) {
      return NextResponse.json([]);
    }

    const products =
      await prisma.product.findMany({
        where: {
          id: {
            in: ids,
          },
        },
        include: {
          category: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

    return NextResponse.json(products);
  } catch (error) {
    console.error(
      "Ошибка загрузки избранного:",
      error
    );

    return NextResponse.json(
      {
        error: "Ошибка загрузки избранного",
      },
      {
        status: 500,
      }
    );
  }
}

