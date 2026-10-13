import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_FILES = 8;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const STATUSES = [
  "Новая",
  "Диагностика",
  "Ремонт",
  "Готов",
  "Выдан",
  "Отменена",
];

/*
|--------------------------------------------------------------------------
| GET — получить заявки
|--------------------------------------------------------------------------
*/

export async function GET() {
  try {
    const repairs = await prisma.repair.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(repairs);
  } catch (error) {
    console.error("GET /api/repairs error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Не удалось загрузить заявки",
      },
      {
        status: 500,
      }
    );
  }
}

/*
|--------------------------------------------------------------------------
| POST — создать заявку
|--------------------------------------------------------------------------
*/

export async function POST(request: Request) {
  try {
    /*
    |--------------------------------------------------------------------------
    | Получаем текущего пользователя
    |--------------------------------------------------------------------------
    */

    const currentUser = await getCurrentUser();

    const formData = await request.formData();

    const customerName = String(
      formData.get("customerName") || ""
    ).trim();

    const phone = String(
      formData.get("phone") || ""
    ).trim();

    const contactMethod = String(
      formData.get("contactMethod") || "Телефон"
    ).trim();

    const city = String(
      formData.get("city") || ""
    ).trim();

    const address = String(
      formData.get("address") || ""
    ).trim();

    const deviceType = String(
      formData.get("deviceType") || ""
    ).trim();

    const brand = String(
      formData.get("brand") || ""
    ).trim();

    const model = String(
      formData.get("model") || ""
    ).trim();

    const problem = String(
      formData.get("problem") || ""
    ).trim();

    const description = String(
      formData.get("description") || ""
    ).trim();

    console.log("Получена заявка:", {
      customerName,
      phone,
      deviceType,
      problem,
      userId: currentUser?.id ?? null,
    });

    /*
    |--------------------------------------------------------------------------
    | Проверка обязательных полей
    |--------------------------------------------------------------------------
    */

    if (
      !customerName ||
      !phone ||
      !deviceType ||
      !problem
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Заполните имя, телефон, устройство и проблему",
        },
        {
          status: 400,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Получаем фотографии
    |--------------------------------------------------------------------------
    */

    const files = formData
      .getAll("photos")
      .filter(
        (item): item is File =>
          item instanceof File &&
          item.size > 0
      );

    if (files.length > MAX_FILES) {
      return NextResponse.json(
        {
          success: false,
          error: `Можно загрузить максимум ${MAX_FILES} фотографий`,
        },
        {
          status: 400,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Папка для фотографий
    |--------------------------------------------------------------------------
    */

    const uploadDirectory = path.join(
      process.cwd(),
      "public",
      "uploads",
      "repairs"
    );

    await mkdir(uploadDirectory, {
      recursive: true,
    });

    const photoUrls: string[] = [];

    /*
    |--------------------------------------------------------------------------
    | Сохраняем фотографии
    |--------------------------------------------------------------------------
    */

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Можно загружать только JPG, PNG или WEBP",
          },
          {
            status: 400,
          }
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Размер одной фотографии не должен превышать 10 МБ",
          },
          {
            status: 400,
          }
        );
      }

      let extension = ".jpg";

      if (file.type === "image/png") {
        extension = ".png";
      }

      if (file.type === "image/webp") {
        extension = ".webp";
      }

      const fileName =
        `${Date.now()}-` +
        `${Math.random()
          .toString(36)
          .substring(2, 10)}` +
        extension;

      const filePath = path.join(
        uploadDirectory,
        fileName
      );

      const buffer = Buffer.from(
        await file.arrayBuffer()
      );

      await writeFile(filePath, buffer);

      photoUrls.push(
        `/uploads/repairs/${fileName}`
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Создаём заявку
    |--------------------------------------------------------------------------
    |
    | Если пользователь авторизован:
    |
    | userId = его ID
    |
    | Если пользователь не авторизован:
    |
    | userId = null
    |
    */

    const repair = await prisma.repair.create({
      data: {
        userId: currentUser?.id ?? null,

        customerName,
        phone,
        contactMethod:
          contactMethod || "Телефон",

        city: city || null,
        address: address || null,

        deviceType,

        brand: brand || null,
        model: model || null,

        problem,
        description: description || null,

        photos: photoUrls,

        status: "Новая",
      },
    });

    console.log(
      "Заявка создана:",
      repair.id,
      "userId:",
      repair.userId
    );

    /*
    |--------------------------------------------------------------------------
    | Ответ
    |--------------------------------------------------------------------------
    */

    return NextResponse.json(
      {
        success: true,
        message:
          "Заявка успешно отправлена",

        repair: {
          id: repair.id,
          status: repair.status,
          userId: repair.userId,
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "POST /api/repairs error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Не удалось создать заявку",
      },
      {
        status: 500,
      }
    );
  }
}

/*
|--------------------------------------------------------------------------
| PATCH — изменение статуса заявки
|--------------------------------------------------------------------------
*/

export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    const id = Number(body.id);
    const status = String(
      body.status || ""
    ).trim();

    if (!id || !status) {
      return NextResponse.json(
        {
          success: false,
          error: "Не указан ID или статус",
        },
        {
          status: 400,
        }
      );
    }

    if (!STATUSES.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: "Недопустимый статус",
        },
        {
          status: 400,
        }
      );
    }

    const repair = await prisma.repair.update({
      where: {
        id,
      },
      data: {
        status,
      },
    });

    return NextResponse.json({
      success: true,
      repair,
    });
  } catch (error) {
    console.error(
      "PATCH /api/repairs error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Не удалось изменить статус заявки",
      },
      {
        status: 500,
      }
    );
  }
}