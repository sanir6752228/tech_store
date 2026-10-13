import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categories = [
  {
    name: "Телефоны",
    slug: "phones",
  },
  {
    name: "Планшеты",
    slug: "tablets",
  },
  {
    name: "Ноутбуки",
    slug: "laptops",
  },
  {
    name: "Зарядки",
    slug: "chargers",
  },
  {
    name: "Кабели",
    slug: "cables",
  },
  {
    name: "Наушники",
    slug: "headphones",
  },
  {
    name: "Аксессуары",
    slug: "accessories",
  },
  {
    name: "Ремонт",
    slug: "repair",
  },
];

async function main() {
  console.log("");
  console.log("=".repeat(70));
  console.log("TECHSTORE CATEGORY CLEANUP");
  console.log("=".repeat(70));
  console.log("");

  await prisma.$transaction(async (tx) => {
    // ============================================================
    // 1. Создаём правильные категории
    // ============================================================

    console.log("Создаём правильные категории...");

    for (const category of categories) {
      await tx.category.upsert({
        where: {
          slug: category.slug,
        },
        update: {
          name: category.name,
        },
        create: {
          name: category.name,
          slug: category.slug,
        },
      });

      console.log(`✓ ${category.name} (${category.slug})`);
    }

    // ============================================================
    // 2. Переносим товары из старых категорий в правильные
    // ============================================================

    console.log("");
    console.log("Переносим товары из старых категорий...");

    const categoryAliases: Record<string, string> = {
      "телефоны": "phones",
      "телефон": "phones",

      "планшеты": "tablets",
      "планшет": "tablets",

      "ноутбуки": "laptops",
      "ноутбук": "laptops",

      "зарядки": "chargers",
      "зарядка": "chargers",

      "кабели": "cables",
      "кабель": "cables",

      "наушники": "headphones",
      "наушник": "headphones",

      "аксессуары": "accessories",
      "аксессуар": "accessories",

      "ремонт": "repair",
    };

    for (const [oldSlug, newSlug] of Object.entries(categoryAliases)) {
      if (oldSlug === newSlug) {
        continue;
      }

      const oldCategory = await tx.category.findUnique({
        where: {
          slug: oldSlug,
        },
      });

      if (!oldCategory) {
        continue;
      }

      const newCategory = await tx.category.findUnique({
        where: {
          slug: newSlug,
        },
      });

      if (!newCategory) {
        throw new Error(
          `Не найдена правильная категория: ${newSlug}`
        );
      }

      const result = await tx.product.updateMany({
        where: {
          categoryId: oldCategory.id,
        },
        data: {
          categoryId: newCategory.id,
        },
      });

      console.log(
        `✓ ${oldSlug} → ${newSlug}: перенесено товаров ${result.count}`
      );

      // После переноса товаров старую категорию можно удалить
      await tx.category.delete({
        where: {
          id: oldCategory.id,
        },
      });

      console.log(`  Удалена старая категория: ${oldSlug}`);
    }

    // ============================================================
    // 3. Удаляем любые другие лишние категории
    // ============================================================

    console.log("");
    console.log("Удаляем остальные лишние категории...");

    const allowedSlugs = categories.map((category) => category.slug);

    const extraCategories = await tx.category.findMany({
      where: {
        slug: {
          notIn: allowedSlugs,
        },
      },
    });

    for (const category of extraCategories) {
      const productsCount = await tx.product.count({
        where: {
          categoryId: category.id,
        },
      });

      if (productsCount > 0) {
        throw new Error(
          `Нельзя удалить категорию "${category.name}" (${category.slug}), потому что в ней находятся ${productsCount} товар(ов).`
        );
      }

      await tx.category.delete({
        where: {
          id: category.id,
        },
      });

      console.log(
        `✓ Удалена лишняя категория: ${category.name} (${category.slug})`
      );
    }
  });

  // ============================================================
  // 4. Показываем итог
  // ============================================================

  const result = await prisma.category.findMany({
    orderBy: {
      id: "asc",
    },
    include: {
      _count: {
        select: {
          products: true,
        },
      },
    },
  });

  console.log("");
  console.log("=".repeat(70));
  console.log("ИТОГОВЫЕ КАТЕГОРИИ");
  console.log("=".repeat(70));
  console.log("");

  for (const category of result) {
    console.log(
      `${category.id}. ${category.name} | ${category.slug} | товаров: ${category._count.products}`
    );
  }

  console.log("");
  console.log("=".repeat(70));
  console.log("ГОТОВО");
  console.log("=".repeat(70));
  console.log("");
}

main()
  .catch((error) => {
    console.error("");
    console.error("ОШИБКА:");
    console.error(error);

    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });