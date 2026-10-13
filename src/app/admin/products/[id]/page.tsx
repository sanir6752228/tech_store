import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import AdminSidebar from "@/components/AdminSidebar";
import EditProductForm from "@/components/EditProductForm";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

async function getProduct(id: string) {
  const productId = Number(id);

  if (!Number.isInteger(productId) || productId <= 0) {
    return null;
  }

  return prisma.product.findUnique({
    where: {
      id: productId,
    },
    include: {
      category: true,
    },
  });
}

export default async function EditProductPage({
  params,
}: PageProps) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/admin/login");
  }

  if (currentUser.role !== "ADMIN") {
    redirect("/");
  }

  const { id } = await params;

  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  const firstImage = product.images?.[0] ?? null;

  const formatPrice = (price: number) =>
    `${price.toLocaleString("ru-RU")} ₽`;

  const getStatusStyle = (status: string) => {
    if (
      status === "В наличии" ||
      status === "Активен" ||
      status === "Доступен"
    ) {
      return "border-green-200 bg-green-50 text-green-700";
    }

    if (
      status === "Продан" ||
      status === "Недоступен"
    ) {
      return "border-red-200 bg-red-50 text-red-700";
    }

    if (
      status === "Забронирован" ||
      status === "Резерв"
    ) {
      return "border-yellow-200 bg-yellow-50 text-yellow-700";
    }

    return "border-gray-200 bg-gray-100 text-gray-700";
  };

  return (
    <div className="flex min-h-screen bg-[#f5f6f7] text-gray-900">

      <AdminSidebar />

      <main className="min-w-0 flex-1">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/90 backdrop-blur">

          <div className="flex items-center justify-between gap-4 px-6 py-4 lg:px-8">

            <div>

              <p className="text-xs font-bold uppercase tracking-[0.16em] text-green-600">
                TECHSTORE ADMIN
              </p>

              <h1 className="mt-1 text-xl font-black">
                Редактирование товара
              </h1>

            </div>

            <div className="flex items-center gap-2">

              <Link
                href="/admin/products"
                className="
                  inline-flex
                  items-center
                  gap-2
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
                ← Все товары
              </Link>

            </div>

          </div>

        </header>

        <div className="p-6 lg:p-8">

          {/* =====================================================
              BREADCRUMB
          ===================================================== */}

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
              href="/admin/products"
              className="font-bold text-gray-400 transition hover:text-green-600"
            >
              Товары
            </Link>

            <span className="text-gray-300">
              /
            </span>

            <span className="max-w-[280px] truncate font-bold text-gray-700">
              {product.name}
            </span>

          </div>

          {/* =====================================================
              HERO
          ===================================================== */}

          <section className="relative overflow-hidden rounded-3xl bg-[#0b0f0d] p-7 text-white shadow-xl lg:p-9">

            <div className="relative z-10">

              <div className="flex flex-col gap-7 xl:flex-row xl:items-center xl:justify-between">

                {/* PRODUCT */}

                <div className="flex min-w-0 items-center gap-5">

                  <div className="
                    relative
                    flex
                    h-24
                    w-24
                    shrink-0
                    items-center
                    justify-center
                    overflow-hidden
                    rounded-3xl
                    border
                    border-white/10
                    bg-white/5
                  ">

                    {firstImage ? (
                      <img
                        src={firstImage}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-4xl">
                        📦
                      </span>
                    )}

                  </div>

                  <div className="min-w-0">

                    <div className="mb-3 flex flex-wrap items-center gap-2">

                      <span className="
                        inline-flex
                        items-center
                        rounded-full
                        border
                        border-green-400/20
                        bg-green-400/10
                        px-3
                        py-1.5
                        text-xs
                        font-black
                        text-green-400
                      ">
                        ТОВАР #{product.id}
                      </span>

                      {product.isNew && (
                        <span className="
                          inline-flex
                          rounded-full
                          border
                          border-blue-400/20
                          bg-blue-400/10
                          px-3
                          py-1.5
                          text-xs
                          font-black
                          text-blue-300
                        ">
                          NEW
                        </span>
                      )}

                      {product.isHit && (
                        <span className="
                          inline-flex
                          rounded-full
                          border
                          border-orange-400/20
                          bg-orange-400/10
                          px-3
                          py-1.5
                          text-xs
                          font-black
                          text-orange-300
                        ">
                          ХИТ
                        </span>
                      )}

                    </div>

                    <h2 className="
                      max-w-3xl
                      text-3xl
                      font-black
                      tracking-tight
                      lg:text-4xl
                    ">
                      {product.name}
                    </h2>

                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-400">

                      <span>
                        {product.brand}
                      </span>

                      <span className="text-gray-700">
                        •
                      </span>

                      <span>
                        {product.model}
                      </span>

                      {product.category && (
                        <>
                          <span className="text-gray-700">
                            •
                          </span>

                          <span>
                            {product.category.name}
                          </span>
                        </>
                      )}

                    </div>

                  </div>

                </div>

                {/* PRICE */}

                <div className="shrink-0 xl:text-right">

                  <div className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">
                    Текущая цена
                  </div>

                  <div className="mt-1 text-3xl font-black text-white lg:text-4xl">
                    {formatPrice(product.price)}
                  </div>

                  {product.oldPrice && (
                    <div className="mt-1 text-sm font-bold text-gray-500 line-through">
                      {formatPrice(product.oldPrice)}
                    </div>
                  )}

                </div>

              </div>

              {/* HERO META */}

              <div className="mt-7 grid gap-3 border-t border-white/10 pt-6 sm:grid-cols-2 lg:grid-cols-4">

                <HeroInfo
                  label="Категория"
                  value={
                    product.category?.name ||
                    "Без категории"
                  }
                />

                <HeroInfo
                  label="Статус"
                  value={product.status}
                />

                <HeroInfo
                  label="Количество"
                  value={`${product.quantity} шт.`}
                />

                <HeroInfo
                  label="Фото"
                  value={`${product.images.length} ${
                    product.images.length === 1
                      ? "фото"
                      : "фото"
                  }`}
                />

              </div>

            </div>

            <div className="
              pointer-events-none
              absolute
              -right-24
              -top-24
              h-80
              w-80
              rounded-full
              bg-green-500/10
              blur-3xl
            " />

            <div className="
              pointer-events-none
              absolute
              -bottom-40
              right-20
              h-72
              w-72
              rounded-full
              bg-green-400/10
              blur-3xl
            " />

          </section>

          {/* =====================================================
              STATS
          ===================================================== */}

          <section className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

            <ProductStat
              icon="💰"
              label="Цена"
              value={formatPrice(product.price)}
              description="Текущая стоимость"
            />

            <ProductStat
              icon="📦"
              label="Остаток"
              value={`${product.quantity} шт.`}
              description="Количество товара"
            />

            <ProductStat
              icon="⭐"
              label="Рейтинг"
              value={
                product.rating > 0
                  ? `${product.rating}/5`
                  : "—"
              }
              description={`${product.reviews} отзывов`}
            />

            <ProductStat
              icon="🔥"
              label="Продажи"
              value={product.sales}
              description="Продано единиц"
            />

          </section>

          {/* =====================================================
              MAIN CONTENT
          ===================================================== */}

          <div className="mt-7 grid gap-7 xl:grid-cols-[minmax(0,1fr)_340px]">

            {/* =================================================
                EDIT FORM
            ================================================= */}

            <section className="
              overflow-hidden
              rounded-3xl
              border
              border-gray-200
              bg-white
              shadow-sm
            ">

              <div className="
                border-b
                border-gray-100
                bg-white
                px-6
                py-5
                lg:px-7
              ">

                <div className="flex items-center gap-4">

                  <div className="
                    flex
                    h-11
                    w-11
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    bg-black
                    text-lg
                    text-green-400
                  ">
                    ✎
                  </div>

                  <div>

                    <h3 className="font-black text-gray-900">
                      Данные товара
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                      Измени характеристики,
                      цену, фотографии и параметры
                      товара.
                    </p>

                  </div>

                </div>

              </div>

              <div className="p-6 lg:p-7">

                <EditProductForm
                  product={product}
                />

              </div>

            </section>

            {/* =================================================
                SIDEBAR
            ================================================= */}

            <aside className="space-y-5">

              {/* PRODUCT CARD */}

              <div className="
                overflow-hidden
                rounded-3xl
                border
                border-gray-200
                bg-white
                shadow-sm
              ">

                <div className="border-b border-gray-100 px-5 py-4">

                  <div className="text-xs font-black uppercase tracking-[0.15em] text-gray-400">
                    Товар
                  </div>

                </div>

                <div className="p-5">

                  <div className="
                    aspect-square
                    overflow-hidden
                    rounded-2xl
                    border
                    border-gray-200
                    bg-gray-100
                  ">

                    {firstImage ? (
                      <img
                        src={firstImage}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="
                        flex
                        h-full
                        items-center
                        justify-center
                        text-6xl
                      ">
                        📦
                      </div>
                    )}

                  </div>

                  <div className="mt-4">

                    <div className="
                      line-clamp-2
                      text-lg
                      font-black
                      text-gray-900
                    ">
                      {product.name}
                    </div>

                    <div className="mt-1 text-sm text-gray-500">
                      {product.brand} {product.model}
                    </div>

                  </div>

                  <div className="mt-5 flex items-center justify-between gap-3">

                    <span
                      className={`
                        inline-flex
                        rounded-full
                        border
                        px-3
                        py-1.5
                        text-xs
                        font-black
                        ${getStatusStyle(
                          product.status
                        )}
                      `}
                    >
                      {product.status}
                    </span>

                    <span className="text-lg font-black text-gray-900">
                      {formatPrice(product.price)}
                    </span>

                  </div>

                </div>

              </div>

              {/* CATEGORY */}

              <div className="
                rounded-3xl
                border
                border-gray-200
                bg-white
                p-5
                shadow-sm
              ">

                <div className="text-xs font-black uppercase tracking-[0.15em] text-gray-400">
                  Категория
                </div>

                <div className="mt-4 flex items-center gap-3">

                  <div className="
                    flex
                    h-12
                    w-12
                    shrink-0
                    items-center
                    justify-center
                    rounded-2xl
                    bg-gray-100
                    text-xl
                  ">
                    📂
                  </div>

                  <div className="min-w-0">

                    <div className="truncate font-black text-gray-900">
                      {product.category?.name ||
                        "Без категории"}
                    </div>

                    {product.category && (
                      <div className="mt-1 font-mono text-xs text-gray-400">
                        {product.category.slug}
                      </div>
                    )}

                  </div>

                </div>

              </div>

              {/* STATUS */}

              <div className="
                rounded-3xl
                border
                border-gray-200
                bg-white
                p-5
                shadow-sm
              ">

                <div className="text-xs font-black uppercase tracking-[0.15em] text-gray-400">
                  Состояние
                </div>

                <div className="mt-4 space-y-3">

                  <StatusRow
                    label="Статус"
                    value={product.status}
                  />

                  <StatusRow
                    label="Состояние"
                    value={product.condition}
                  />

                  <StatusRow
                    label="Количество"
                    value={`${product.quantity} шт.`}
                  />

                  <StatusRow
                    label="Фото"
                    value={`${product.images.length} шт.`}
                  />

                </div>

              </div>

              {/* QUICK ACTIONS */}

              <div className="
                rounded-3xl
                border
                border-gray-200
                bg-white
                p-5
                shadow-sm
              ">

                <div className="text-sm font-black text-gray-900">
                  Быстрые действия
                </div>

                <div className="mt-4 space-y-2">

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
                      📦 Все товары
                    </span>

                    <span>
                      →
                    </span>

                  </Link>

                  <Link
                    href="/admin/products/create"
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
                      ＋ Добавить товар
                    </span>

                    <span>
                      →
                    </span>

                  </Link>

                  {product.category && (
                    <Link
                      href={`/admin/categories/${product.category.id}`}
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
                        📂 Категория
                      </span>

                      <span>
                        →
                      </span>

                    </Link>
                  )}

                </div>

              </div>

            </aside>

          </div>

          {/* =====================================================
              FOOTER
          ===================================================== */}

          <section className="
            mt-7
            flex
            flex-col
            gap-4
            rounded-3xl
            border
            border-gray-200
            bg-white
            p-6
            shadow-sm
            sm:flex-row
            sm:items-center
            sm:justify-between
            lg:p-7
          ">

            <div>

              <div className="font-black text-gray-900">
                Товар #{product.id}
              </div>

              <div className="mt-1 text-sm text-gray-500">
                {product.name}
              </div>

            </div>

            <div className="flex flex-wrap gap-3">

              <Link
                href="/admin/products"
                className="
                  inline-flex
                  items-center
                  justify-center
                  rounded-xl
                  border
                  border-gray-200
                  bg-white
                  px-5
                  py-3
                  text-sm
                  font-black
                  text-gray-700
                  transition
                  hover:border-green-300
                  hover:text-green-700
                "
              >
                ← Все товары
              </Link>

              <Link
                href="/admin/products/create"
                className="
                  inline-flex
                  items-center
                  justify-center
                  rounded-xl
                  bg-black
                  px-5
                  py-3
                  text-sm
                  font-black
                  text-white
                  transition
                  hover:bg-green-500
                  hover:text-black
                "
              >
                ＋ Новый товар
              </Link>

            </div>

          </section>

        </div>

      </main>

    </div>
  );
}

/* =========================================================
   HERO INFO
========================================================= */

function HeroInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="
      rounded-2xl
      border
      border-white/10
      bg-white/[0.03]
      px-4
      py-3
    ">

      <div className="
        text-[10px]
        font-black
        uppercase
        tracking-[0.15em]
        text-gray-500
      ">
        {label}
      </div>

      <div className="mt-1 truncate text-sm font-black text-white">
        {value}
      </div>

    </div>
  );
}

/* =========================================================
   PRODUCT STAT
========================================================= */

function ProductStat({
  icon,
  label,
  value,
  description,
}: {
  icon: string;
  label: string;
  value: string | number;
  description: string;
}) {
  return (
    <div className="
      rounded-3xl
      border
      border-gray-200
      bg-white
      p-5
      shadow-sm
    ">

      <div className="flex items-start justify-between gap-3">

        <div className="
          flex
          h-12
          w-12
          items-center
          justify-center
          rounded-2xl
          bg-gray-100
          text-xl
        ">
          {icon}
        </div>

        <div className="
          text-[10px]
          font-black
          uppercase
          tracking-[0.15em]
          text-gray-400
        ">
          {label}
        </div>

      </div>

      <div className="mt-5 break-words text-2xl font-black text-gray-900 lg:text-3xl">
        {typeof value === "number"
          ? value.toLocaleString("ru-RU")
          : value}
      </div>

      <div className="mt-1 text-sm font-medium text-gray-500">
        {description}
      </div>

    </div>
  );
}

/* =========================================================
   STATUS ROW
========================================================= */

function StatusRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="
      flex
      items-center
      justify-between
      gap-4
      rounded-xl
      bg-gray-50
      px-3
      py-2.5
    ">

      <span className="text-xs font-bold text-gray-400">
        {label}
      </span>

      <span className="truncate text-right text-xs font-black text-gray-800">
        {value}
      </span>

    </div>
  );
}