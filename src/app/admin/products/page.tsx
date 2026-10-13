import Link from "next/link";
import { redirect } from "next/navigation";

import AdminSidebar from "@/components/AdminSidebar";
import ProductTable from "@/components/ProductTable";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function getProducts() {
  return prisma.product.findMany({
    include: {
      category: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export default async function ProductsPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/admin/login");
  }

  if (currentUser.role !== "ADMIN") {
    redirect("/");
  }

  const products = await getProducts();

  const totalProducts = products.length;

  const availableProducts = products.filter(
    (product) =>
      product.quantity > 0 &&
      product.status !== "Продан"
  ).length;

  const soldProducts = products.filter(
    (product) =>
      product.status === "Продан" ||
      product.quantity <= 0
  ).length;

  const totalStock = products.reduce(
    (sum, product) => sum + product.quantity,
    0
  );

  const categories = new Set(
    products.map((product) => product.category.name)
  ).size;

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
                Товары
              </h1>
            </div>

            <Link
              href="/admin/products/create"
              className="inline-flex items-center gap-2 rounded-xl bg-green-500 px-5 py-3 text-sm font-black text-black shadow-lg shadow-green-500/10 transition hover:bg-green-400"
            >
              <span className="text-lg">+</span>
              Добавить товар
            </Link>
          </div>
        </header>

        <div className="p-6 lg:p-8">
          {/* TITLE */}
          <section className="mb-7">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
              <div>
                <h2 className="text-3xl font-black tracking-tight">
                  Каталог товаров
                </h2>

                <p className="mt-2 text-sm text-gray-500">
                  Управление товарами, остатками и категориями
                </p>
              </div>

              <Link
                href="/admin"
                className="w-fit rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-600 transition hover:border-green-300 hover:text-green-700"
              >
                ← Dashboard
              </Link>
            </div>
          </section>

          {/* STATS */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <ProductStat
              icon="📦"
              title="Всего товаров"
              value={totalProducts}
              description="Позиций в каталоге"
            />

            <ProductStat
              icon="✅"
              title="В наличии"
              value={availableProducts}
              description="Доступны для продажи"
            />

            <ProductStat
              icon="⚠️"
              title="Нет в наличии"
              value={soldProducts}
              description="Проданы или закончились"
            />

            <ProductStat
              icon="🏷️"
              title="Категории"
              value={categories}
              description={`${totalStock} единиц на складе`}
            />
          </section>

          {/* ACTIONS */}
          <section className="mt-7 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="font-black text-gray-900">
                  Управление каталогом
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Добавляй новые товары и управляй существующими.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/admin/products/create"
                  className="rounded-xl bg-black px-5 py-3 text-sm font-black text-white transition hover:bg-green-500 hover:text-black"
                >
                  + Новый товар
                </Link>

                <Link
                  href="/admin/categories"
                  className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-black text-gray-700 transition hover:border-green-300 hover:text-green-700"
                >
                  📂 Категории
                </Link>
              </div>
            </div>
          </section>

          {/* TABLE */}
          <section className="mt-7 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-col justify-between gap-3 border-b border-gray-100 px-6 py-5 md:flex-row md:items-center">
              <div>
                <h3 className="font-black text-gray-900">
                  Все товары
                </h3>

                <p className="mt-1 text-xs text-gray-400">
                  Всего позиций: {totalProducts}
                </p>
              </div>

              <div className="rounded-full bg-gray-100 px-4 py-2 text-xs font-black text-gray-600">
                Склад: {totalStock} шт.
              </div>
            </div>

            {products.length === 0 ? (
              <div className="px-6 py-20 text-center">
                <div className="text-5xl">📦</div>

                <h3 className="mt-5 text-xl font-black text-gray-900">
                  Товаров пока нет
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
                  Добавь первый товар, чтобы он появился в каталоге
                  магазина.
                </p>

                <Link
                  href="/admin/products/create"
                  className="mt-6 inline-flex rounded-xl bg-green-500 px-6 py-3 text-sm font-black text-black transition hover:bg-green-400"
                >
                  + Добавить первый товар
                </Link>
              </div>
            ) : (
              <div className="p-2">
                <ProductTable products={products} />
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function ProductStat({
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
    <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-xl">
          {icon}
        </div>

        <span className="text-xs font-black uppercase tracking-wider text-gray-400">
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