import Link from "next/link";
import { redirect } from "next/navigation";

import AdminSidebar from "@/components/AdminSidebar";
import CategoryForm from "@/components/CategoryForm";
import DeleteCategoryButton from "@/components/DeleteCategoryButton";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/* ========================================================= */
/* CATEGORY NAMES */
/* ========================================================= */

function getCategoryName(slug: string, fallbackName: string) {
  switch (slug) {
    case "phones":
      return "Телефоны";

    case "tablets":
      return "Планшеты";

    case "accessories":
      return "Аксессуары";

    case "charging":
      return "Зарядка";

    default:
      return fallbackName;
  }
}

function getCategoryIcon(slug: string) {
  switch (slug) {
    case "phones":
      return "📱";

    case "tablets":
      return "📲";

    case "accessories":
      return "🎧";

    case "charging":
      return "🔌";

    default:
      return "📂";
  }
}

/* ========================================================= */
/* DATABASE */
/* ========================================================= */

async function getCategories() {
  return prisma.category.findMany({
    include: {
      _count: {
        select: {
          products: true,
        },
      },
    },
    orderBy: {
      id: "asc",
    },
  });
}

/* ========================================================= */
/* PAGE */
/* ========================================================= */

export default async function CategoriesPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/admin/login");
  }

  if (currentUser.role !== "ADMIN") {
    redirect("/");
  }

  const categories = await getCategories();

  const totalCategories = categories.length;

  const categoriesWithProducts = categories.filter(
    (category) => category._count.products > 0
  ).length;

  const emptyCategories = categories.filter(
    (category) => category._count.products === 0
  ).length;

  const totalProducts = categories.reduce(
    (sum, category) => sum + category._count.products,
    0
  );

  return (
    <div className="flex min-h-screen bg-[#f5f6f7] text-gray-900">
      <AdminSidebar />

      <main className="min-w-0 flex-1">
        {/* HEADER */}
        <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/90 backdrop-blur">
          <div className="flex items-center justify-between gap-4 px-6 py-4 lg:px-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-green-600">
                TECHSTORE ADMIN
              </p>

              <h1 className="mt-1 text-xl font-black">
                Категории
              </h1>
            </div>

            <Link
              href="/admin"
              className="
                rounded-xl
                border
                border-gray-200
                bg-white
                px-4
                py-2.5
                text-sm
                font-bold
                text-gray-700
                transition
                hover:border-green-300
                hover:text-green-700
              "
            >
              ← Dashboard
            </Link>
          </div>
        </header>

        <div className="p-6 lg:p-8">
          {/* TITLE */}
          <section className="mb-7">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
              <div>
                <h2 className="text-3xl font-black tracking-tight">
                  Категории каталога
                </h2>

                <p className="mt-2 text-sm text-gray-500">
                  Управление категориями товаров и структурой каталога
                </p>
              </div>

              <div className="rounded-xl bg-green-50 px-4 py-2.5 text-sm font-bold text-green-700">
                {totalCategories}{" "}
                {getCategoryWord(totalCategories)}
              </div>
            </div>
          </section>

          {/* STATS */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <CategoryStat
              icon="📂"
              title="Всего категорий"
              value={totalCategories}
              description="Категорий в каталоге"
            />

            <CategoryStat
              icon="📦"
              title="Товаров"
              value={totalProducts}
              description="Всего товаров"
            />

            <CategoryStat
              icon="✅"
              title="Заполненные"
              value={categoriesWithProducts}
              description="Есть товары"
            />

            <CategoryStat
              icon="○"
              title="Пустые"
              value={emptyCategories}
              description="Без товаров"
            />
          </section>

          {/* MAIN CATEGORIES */}
          <section className="mt-7 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 bg-white px-6 py-5">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-50 text-lg">
                  📁
                </div>

                <div>
                  <h3 className="font-black text-gray-900">
                    Категории магазина
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    Основные категории каталога TECHSTORE
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-4">
              {categories.map((category) => {
                const categoryName = getCategoryName(
                  category.slug,
                  category.name
                );

                const categoryIcon = getCategoryIcon(
                  category.slug
                );

                return (
                  <Link
                    key={category.id}
                    href={`/admin/categories/${category.id}`}
                    className="
                      group
                      rounded-2xl
                      border
                      border-gray-200
                      bg-white
                      p-5
                      transition
                      duration-200
                      hover:-translate-y-0.5
                      hover:border-green-300
                      hover:shadow-md
                    "
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div
                        className="
                          flex
                          h-12
                          w-12
                          items-center
                          justify-center
                          rounded-xl
                          bg-gray-100
                          text-xl
                          transition
                          group-hover:bg-green-50
                        "
                      >
                        {categoryIcon}
                      </div>

                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-black uppercase text-gray-500">
                        {category.slug}
                      </span>
                    </div>

                    <div className="mt-5">
                      <h3 className="text-lg font-black text-gray-900">
                        {categoryName}
                      </h3>

                      <p className="mt-1 text-xs text-gray-400">
                        {category._count.products}{" "}
                        {getProductWord(category._count.products)}
                      </p>
                    </div>

                    <div className="mt-5 flex items-center justify-between">
                      <span
                        className={`
                          rounded-full
                          border
                          px-3
                          py-1.5
                          text-[11px]
                          font-black
                          ${
                            category._count.products > 0
                              ? "border-green-200 bg-green-50 text-green-700"
                              : "border-gray-200 bg-gray-100 text-gray-500"
                          }
                        `}
                      >
                        {category._count.products > 0
                          ? "Используется"
                          : "Пустая"}
                      </span>

                      <span className="text-sm font-black text-gray-400 transition group-hover:text-green-600">
                        →
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* ADD CATEGORY */}
          <section className="mt-7 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 bg-white px-6 py-5">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-black text-lg text-green-400">
                  +
                </div>

                <div>
                  <h3 className="font-black text-gray-900">
                    Добавить категорию
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    Создай новую категорию для товаров магазина
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <CategoryForm />
            </div>
          </section>

          {/* CATEGORIES TABLE */}
          <section className="mt-7 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-col justify-between gap-3 border-b border-gray-100 px-6 py-5 md:flex-row md:items-center">
              <div>
                <h3 className="font-black text-gray-900">
                  Все категории
                </h3>

                <p className="mt-1 text-xs text-gray-400">
                  Управление существующими категориями
                </p>
              </div>

              <div className="rounded-full bg-gray-100 px-4 py-2 text-xs font-black text-gray-600">
                {totalProducts} товаров
              </div>
            </div>

            {categories.length === 0 ? (
              <div className="px-6 py-20 text-center">
                <div className="text-5xl">
                  📂
                </div>

                <h3 className="mt-5 text-xl font-black text-gray-900">
                  Категорий пока нет
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
                  Создай первую категорию, чтобы организовать каталог
                  товаров.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead className="bg-gray-50">
                    <tr className="text-left text-xs font-black uppercase tracking-wider text-gray-400">
                      <th className="px-6 py-4">
                        Категория
                      </th>

                      <th className="px-6 py-4">
                        Slug
                      </th>

                      <th className="px-6 py-4">
                        Товары
                      </th>

                      <th className="px-6 py-4">
                        Состояние
                      </th>

                      <th className="px-6 py-4 text-right">
                        Действия
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {categories.map((category) => {
                      const productCount =
                        category._count.products;

                      const hasProducts =
                        productCount > 0;

                      const categoryName =
                        getCategoryName(
                          category.slug,
                          category.name
                        );

                      const categoryIcon =
                        getCategoryIcon(
                          category.slug
                        );

                      return (
                        <tr
                          key={category.id}
                          className="group transition hover:bg-gray-50"
                        >
                          {/* CATEGORY */}
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div
                                className="
                                  flex
                                  h-11
                                  w-11
                                  shrink-0
                                  items-center
                                  justify-center
                                  rounded-xl
                                  bg-gray-100
                                  text-lg
                                  transition
                                  group-hover:bg-green-100
                                "
                              >
                                {categoryIcon}
                              </div>

                              <div>
                                <div className="font-black text-gray-900">
                                  {categoryName}
                                </div>

                                <div className="mt-1 text-xs text-gray-400">
                                  ID: {category.id}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* SLUG */}
                          <td className="px-6 py-5">
                            <code
                              className="
                                rounded-lg
                                bg-gray-100
                                px-3
                                py-1.5
                                text-xs
                                font-bold
                                text-gray-600
                              "
                            >
                              {category.slug}
                            </code>
                          </td>

                          {/* PRODUCTS */}
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2">
                              <span
                                className="
                                  inline-flex
                                  min-w-9
                                  items-center
                                  justify-center
                                  rounded-lg
                                  bg-gray-100
                                  px-2.5
                                  py-1.5
                                  text-sm
                                  font-black
                                  text-gray-900
                                "
                              >
                                {productCount}
                              </span>

                              <span className="text-xs font-medium text-gray-400">
                                {getProductWord(productCount)}
                              </span>
                            </div>
                          </td>

                          {/* STATUS */}
                          <td className="px-6 py-5">
                            {hasProducts ? (
                              <span
                                className="
                                  inline-flex
                                  items-center
                                  gap-2
                                  rounded-full
                                  border
                                  border-green-200
                                  bg-green-50
                                  px-3
                                  py-1.5
                                  text-xs
                                  font-black
                                  text-green-700
                                "
                              >
                                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                                Используется
                              </span>
                            ) : (
                              <span
                                className="
                                  inline-flex
                                  items-center
                                  gap-2
                                  rounded-full
                                  border
                                  border-gray-200
                                  bg-gray-100
                                  px-3
                                  py-1.5
                                  text-xs
                                  font-black
                                  text-gray-500
                                "
                              >
                                <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                                Пустая
                              </span>
                            )}
                          </td>

                          {/* ACTIONS */}
                          <td className="px-6 py-5">
                            <div className="flex justify-end gap-2">
                              <Link
                                href={`/admin/categories/${category.id}`}
                                className="
                                  inline-flex
                                  items-center
                                  rounded-xl
                                  border
                                  border-gray-200
                                  bg-white
                                  px-4
                                  py-2.5
                                  text-xs
                                  font-black
                                  text-gray-700
                                  transition
                                  hover:border-green-300
                                  hover:text-green-700
                                "
                              >
                                Открыть
                              </Link>

                              <DeleteCategoryButton
                                id={category.id}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

/* ========================================================= */
/* STAT */
/* ========================================================= */

function CategoryStat({
  icon,
  title,
  value,
  description,
}: {
  icon: string;
  title: string;
  value: number;
  description: string;
}) {
  return (
    <div
      className="
        rounded-3xl
        border
        border-gray-200
        bg-white
        p-5
        shadow-sm
      "
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className="
            flex
            h-12
            w-12
            items-center
            justify-center
            rounded-2xl
            bg-gray-100
            text-xl
          "
        >
          {icon}
        </div>

        <span
          className="
            text-xs
            font-black
            uppercase
            tracking-wider
            text-gray-400
          "
        >
          {title}
        </span>
      </div>

      <div className="mt-5 text-3xl font-black text-gray-900">
        {value.toLocaleString("ru-RU")}
      </div>

      <div className="mt-1 text-sm font-medium text-gray-500">
        {description}
      </div>
    </div>
  );
}

/* ========================================================= */
/* WORDS */
/* ========================================================= */

function getCategoryWord(count: number) {
  const lastTwo = count % 100;
  const last = count % 10;

  if (lastTwo >= 11 && lastTwo <= 14) {
    return "категорий";
  }

  if (last === 1) {
    return "категория";
  }

  if (last >= 2 && last <= 4) {
    return "категории";
  }

  return "категорий";
}

function getProductWord(count: number) {
  const lastTwo = count % 100;
  const last = count % 10;

  if (lastTwo >= 11 && lastTwo <= 14) {
    return "товаров";
  }

  if (last === 1) {
    return "товар";
  }

  if (last >= 2 && last <= 4) {
    return "товара";
  }

  return "товаров";
}