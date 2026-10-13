import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import AdminSidebar from "@/components/AdminSidebar";
import EditCategoryForm from "@/components/EditCategoryForm";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getCategory(id: string) {
  const categoryId = Number(id);

  if (!Number.isInteger(categoryId)) {
    return null;
  }

  return prisma.category.findUnique({
    where: {
      id: categoryId,
    },
    include: {
      _count: {
        select: {
          products: true,
        },
      },
    },
  });
}

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/admin/login");
  }

  if (currentUser.role !== "ADMIN") {
    redirect("/");
  }

  const { id } = await params;

  const category = await getCategory(id);

  if (!category) {
    notFound();
  }

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
                Редактирование категории
              </h1>

            </div>

            <Link
              href="/admin/categories"
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
              ← Все категории
            </Link>

          </div>

        </header>

        <div className="p-6 lg:p-8">

          {/* BREADCRUMB */}
          <div className="mb-6 flex flex-wrap items-center gap-2 text-sm">

            <Link
              href="/admin"
              className="font-bold text-gray-400 transition hover:text-green-600"
            >
              Dashboard
            </Link>

            <span className="text-gray-300">
              /
            </span>

            <Link
              href="/admin/categories"
              className="font-bold text-gray-400 transition hover:text-green-600"
            >
              Категории
            </Link>

            <span className="text-gray-300">
              /
            </span>

            <span className="font-bold text-gray-700">
              {category.name}
            </span>

          </div>

          {/* HERO */}
          <section className="relative overflow-hidden rounded-3xl bg-[#0b0f0d] p-7 text-white shadow-xl lg:p-9">

            <div className="relative z-10">

              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-green-400/20 bg-green-400/10 px-3 py-1.5 text-xs font-black text-green-400">

                <span className="h-2 w-2 rounded-full bg-green-400" />

                КАТЕГОРИЯ #{category.id}

              </div>

              <h2 className="text-3xl font-black tracking-tight lg:text-4xl">
                {category.name}
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-400 lg:text-base">
                Измени название или идентификатор
                категории. Изменения будут
                применены к каталогу магазина.
              </p>

            </div>

            <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-green-500/10 blur-3xl" />

            <div className="pointer-events-none absolute -bottom-32 right-20 h-64 w-64 rounded-full bg-green-400/10 blur-3xl" />

          </section>

          {/* CONTENT */}
          <div className="mt-7 grid gap-7 xl:grid-cols-[1fr_340px]">

            {/* FORM */}
            <section className="rounded-3xl border border-gray-200 bg-white shadow-sm">

              <div className="border-b border-gray-100 px-6 py-5 lg:px-7">

                <div className="flex items-center gap-4">

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-black text-lg text-green-400">
                    ✎
                  </div>

                  <div>

                    <h3 className="font-black text-gray-900">
                      Данные категории
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                      Измени информацию и сохрани
                      изменения.
                    </p>

                  </div>

                </div>

              </div>

              <div className="p-6 lg:p-7">

                <EditCategoryForm
                  category={category}
                />

              </div>

            </section>

            {/* SIDEBAR */}
            <aside className="space-y-5">

              <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">

                <div className="text-xs font-black uppercase tracking-[0.15em] text-gray-400">
                  Информация
                </div>

                <div className="mt-5">

                  <div className="flex items-center gap-4">

                    <div className="
                      flex
                      h-14
                      w-14
                      shrink-0
                      items-center
                      justify-center
                      rounded-2xl
                      bg-gray-100
                      text-2xl
                    ">
                      📂
                    </div>

                    <div className="min-w-0">

                      <div className="truncate text-lg font-black text-gray-900">
                        {category.name}
                      </div>

                      <div className="mt-1 text-xs text-gray-400">
                        ID: {category.id}
                      </div>

                    </div>

                  </div>

                </div>

              </div>

              {/* PRODUCTS */}
              <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">

                <div className="text-xs font-black uppercase tracking-[0.15em] text-gray-400">
                  Товары
                </div>

                <div className="mt-5 flex items-end justify-between gap-4">

                  <div>

                    <div className="text-4xl font-black text-gray-900">
                      {category._count.products}
                    </div>

                    <div className="mt-1 text-sm font-medium text-gray-500">
                      товаров в категории
                    </div>

                  </div>

                  <div className="
                    flex
                    h-12
                    w-12
                    items-center
                    justify-center
                    rounded-2xl
                    bg-green-50
                    text-xl
                  ">
                    📦
                  </div>

                </div>

                {category._count.products > 0 ? (

                  <div className="mt-5 rounded-2xl border border-green-100 bg-green-50 p-4">

                    <div className="flex items-start gap-3">

                      <div className="mt-0.5 text-green-600">
                        ✓
                      </div>

                      <div>

                        <div className="text-sm font-black text-green-900">
                          Категория используется
                        </div>

                        <div className="mt-1 text-xs leading-5 text-green-700">
                          В этой категории уже
                          есть товары.
                        </div>

                      </div>

                    </div>

                  </div>

                ) : (

                  <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-4">

                    <div className="flex items-start gap-3">

                      <div className="mt-0.5 text-gray-400">
                        ○
                      </div>

                      <div>

                        <div className="text-sm font-black text-gray-700">
                          Категория пустая
                        </div>

                        <div className="mt-1 text-xs leading-5 text-gray-500">
                          Товаров в этой категории
                          пока нет.
                        </div>

                      </div>

                    </div>

                  </div>

                )}

              </div>

              {/* NAVIGATION */}
              <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">

                <div className="text-sm font-black text-gray-900">
                  Быстрые действия
                </div>

                <div className="mt-4 space-y-2">

                  <Link
                    href="/admin/categories"
                    className="
                      flex
                      items-center
                      justify-between
                      rounded-xl
                      border
                      border-gray-200
                      px-4
                      py-3
                      text-sm
                      font-bold
                      text-gray-700
                      transition
                      hover:border-green-300
                      hover:text-green-700
                    "
                  >
                    <span>
                      📂 Все категории
                    </span>

                    <span>
                      →
                    </span>
                  </Link>

                  <Link
                    href="/admin/products"
                    className="
                      flex
                      items-center
                      justify-between
                      rounded-xl
                      border
                      border-gray-200
                      px-4
                      py-3
                      text-sm
                      font-bold
                      text-gray-700
                      transition
                      hover:border-green-300
                      hover:text-green-700
                    "
                  >
                    <span>
                      📦 Товары
                    </span>

                    <span>
                      →
                    </span>
                  </Link>

                </div>

              </div>

            </aside>

          </div>

        </div>

      </main>

    </div>
  );
}