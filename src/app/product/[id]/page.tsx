import { prisma } from "@/lib/prisma";
import Link from "next/link";
import CartButton from "@/components/CartButton";
import ProductGallery from "@/components/ProductGallery";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  CircleCheck,
  Clock3,
  PackageCheck,
  ShieldCheck,
  Truck,
  Video,
} from "lucide-react";
import type { ReactNode } from "react";

async function getProduct(id: string) {
  const numericId = Number(id);

  if (!Number.isInteger(numericId)) {
    return null;
  }

  const product = await prisma.product.findUnique({
    where: {
      id: numericId,
    },
    include: {
      category: true,
    },
  });

  return product;
}

function formatPrice(price: number) {
  return price.toLocaleString("ru-RU");
}

function getStatusClass(status: string) {
  switch (status) {
    case "В наличии":
      return "bg-emerald-50 text-emerald-700 border border-emerald-100";

    case "Под заказ":
      return "bg-amber-50 text-amber-700 border border-amber-100";

    case "Продан":
      return "bg-red-50 text-red-700 border border-red-100";

    default:
      return "bg-gray-100 text-gray-700 border border-gray-200";
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } = await params;

  const product = await getProduct(id);

  /* =========================================================
     PRODUCT NOT FOUND
  ========================================================= */

  if (!product) {
    return (
      <main className="min-h-screen bg-[#f5f6f7] px-4 py-10">
        <div className="mx-auto flex min-h-[70vh] max-w-5xl items-center justify-center">
          <div className="w-full max-w-lg rounded-[28px] border border-gray-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-100 text-4xl">
              📱
            </div>

            <h1 className="text-3xl font-black tracking-tight text-gray-950">
              Товар не найден
            </h1>

            <p className="mt-3 text-sm leading-6 text-gray-500">
              Возможно, товар был удалён или ссылка больше не актуальна.
            </p>

            <Link
              href="/catalog"
              className="mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-green-600 px-6 text-sm font-bold text-white transition hover:bg-green-700"
            >
              <ArrowLeft size={17} />
              Вернуться в каталог
            </Link>
          </div>
        </div>
      </main>
    );
  }

  /* =========================================================
     PRODUCT LOGIC
  ========================================================= */

  const cartType: "single" | "stock" =
    product.condition === "Б/У" ? "single" : "stock";

  const isAvailable = product.status !== "Продан";

  const discount =
    product.oldPrice && product.oldPrice > product.price
      ? Math.round(
          ((product.oldPrice - product.price) / product.oldPrice) * 100
        )
      : null;

  const saving =
    product.oldPrice && product.oldPrice > product.price
      ? product.oldPrice - product.price
      : 0;

  return (
    <main className="min-h-screen bg-[#f5f6f7] text-gray-950">
      <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8">
        {/* ================================================= */}
        {/* BREADCRUMBS */}
        {/* ================================================= */}

        <nav className="mb-5 flex items-center gap-1.5 overflow-x-auto whitespace-nowrap text-sm">
          <Link
            href="/catalog"
            className="font-medium text-gray-500 transition hover:text-green-600"
          >
            Каталог
          </Link>

          <ChevronRight
            size={15}
            className="shrink-0 text-gray-300"
          />

          {product.category?.name && (
            <>
              <Link
                href={`/catalog?category=${product.category.slug}`}
                className="font-medium text-gray-500 transition hover:text-green-600"
              >
                {product.category.name}
              </Link>

              <ChevronRight
                size={15}
                className="shrink-0 text-gray-300"
              />
            </>
          )}

          <span className="max-w-[280px] truncate font-semibold text-gray-900">
            {product.name}
          </span>
        </nav>

        {/* ================================================= */}
        {/* MAIN PRODUCT CARD */}
        {/* ================================================= */}

        <section className="overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-[0_8px_40px_rgba(0,0,0,0.04)]">
          <div className="grid lg:grid-cols-[minmax(0,1.08fr)_minmax(420px,0.92fr)]">
            {/* ================================================= */}
            {/* LEFT — PRODUCT GALLERY */}
            {/* ================================================= */}

            <div className="border-b border-gray-100 p-4 sm:p-6 lg:border-b-0 lg:border-r lg:p-8">
              <ProductGallery
                images={product.images}
                productName={product.name}
                productId={product.id}
                condition={product.condition}
                discount={discount}
              />

              {/* TRUST / DELIVERY */}
              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <TrustItem
                  icon={<Truck size={18} />}
                  title="Доставка"
                  text="По Германии"
                />

                <TrustItem
                  icon={<ShieldCheck size={18} />}
                  title="Гарантия"
                  text="На товар"
                />

                <TrustItem
                  icon={<PackageCheck size={18} />}
                  title="Проверка"
                  text="Перед отправкой"
                />
              </div>
            </div>

            {/* ================================================= */}
            {/* RIGHT — PRODUCT INFORMATION */}
            {/* ================================================= */}

            <div className="flex flex-col p-5 sm:p-7 lg:p-10">
              {/* BRAND + STATUS */}

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-bold uppercase tracking-[0.08em] text-gray-400">
                  {product.brand}
                </span>

                {product.status && (
                  <span
                    className={`
                      inline-flex
                      rounded-lg
                      px-3
                      py-1.5
                      text-xs
                      font-bold
                      ${getStatusClass(product.status)}
                    `}
                  >
                    {product.status}
                  </span>
                )}
              </div>

              {/* TITLE */}

              <h1 className="mt-3 text-[30px] font-black leading-[1.08] tracking-[-0.03em] text-gray-950 sm:text-[36px] lg:text-[42px]">
                {product.name}
              </h1>

              {product.model && (
                <p className="mt-2 text-sm font-medium text-gray-400">
                  {product.model}
                </p>
              )}

              {/* RATING / ARTICLE */}

              <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                {product.rating > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-gray-950">
                      ★ {product.rating}
                    </span>

                    {product.reviews > 0 && (
                      <span className="text-gray-400">
                        {product.reviews} отзывов
                      </span>
                    )}
                  </div>
                )}

                {product.rating > 0 && (
                  <span className="h-1 w-1 rounded-full bg-gray-300" />
                )}

                <span className="text-gray-500">
                  Артикул #{product.id}
                </span>
              </div>

              {/* ================================================= */}
              {/* PRICE */}
              {/* ================================================= */}

              <div className="mt-7 rounded-2xl bg-[#f7f8f9] p-5">
                <div className="flex flex-wrap items-end gap-3">
                  <span className="text-[36px] font-black leading-none tracking-[-0.03em] sm:text-[42px]">
                    {formatPrice(product.price)} ₽
                  </span>

                  {product.oldPrice &&
                    product.oldPrice > product.price && (
                      <span className="mb-1 text-base font-semibold text-gray-400 line-through">
                        {formatPrice(product.oldPrice)} ₽
                      </span>
                    )}
                </div>

                {discount && saving > 0 && (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-green-600">
                      Вы экономите {formatPrice(saving)} ₽
                    </span>

                    <span className="rounded-md bg-red-50 px-2 py-1 text-xs font-extrabold text-red-600">
                      −{discount}%
                    </span>
                  </div>
                )}
              </div>

              {/* ================================================= */}
              {/* MAIN SPECS */}
              {/* ================================================= */}

              <div className="mt-6">
                <h2 className="text-sm font-extrabold text-gray-950">
                  Основные характеристики
                </h2>

                <div className="mt-3 divide-y divide-gray-100 rounded-2xl border border-gray-200">
                  <SpecRow
                    label="Состояние"
                    value={product.condition}
                  />

                  {product.memory && (
                    <SpecRow
                      label="Память"
                      value={product.memory}
                    />
                  )}

                  {product.color && (
                    <SpecRow
                      label="Цвет"
                      value={product.color}
                    />
                  )}

                  {product.battery && (
                    <SpecRow
                      label="Аккумулятор"
                      value={product.battery}
                    />
                  )}

                  {product.category?.name && (
                    <SpecRow
                      label="Категория"
                      value={product.category.name}
                    />
                  )}
                </div>
              </div>

              {/* ================================================= */}
              {/* AVAILABILITY */}
              {/* ================================================= */}

              {isAvailable && (
                <div className="mt-5 flex items-center gap-2 text-sm">
                  <CircleCheck
                    size={17}
                    className="text-green-600"
                  />

                  <span className="font-semibold text-gray-700">
                    Товар доступен для заказа
                  </span>
                </div>
              )}

              {/* ================================================= */}
              {/* CART */}
              {/* ================================================= */}

              <div className="mt-6">
                {isAvailable ? (
                  <CartButton
                    id={product.id}
                    type={cartType}
                  />
                ) : (
                  <button
                    disabled
                    className="flex h-14 w-full cursor-not-allowed items-center justify-center rounded-xl bg-gray-100 text-base font-extrabold text-gray-400"
                  >
                    Товар продан
                  </button>
                )}
              </div>

              {/* ================================================= */}
              {/* QUICK INFO */}
              {/* ================================================= */}

              <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <MiniInfo
                  icon={<Clock3 size={17} />}
                  title="Быстрая обработка"
                  text="Заказ подтверждаем быстро"
                />

                <MiniInfo
                  icon={<ShieldCheck size={17} />}
                  title="Проверенный товар"
                  text="Проверяем перед отправкой"
                />
              </div>

              {/* ================================================= */}
              {/* TELEGRAM VIDEO */}
              {/* ================================================= */}

              {product.telegramVideo && (
                <a
                  href={product.telegramVideo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3.5 text-sm font-bold text-gray-700 transition hover:border-green-300 hover:bg-green-50 hover:text-green-700"
                >
                  <Video size={17} />
                  Посмотреть видео товара
                </a>
              )}
            </div>
          </div>
        </section>

        {/* ================================================= */}
        {/* DESCRIPTION + PURCHASE BENEFITS */}
        {/* ================================================= */}

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* DESCRIPTION */}

          <section className="rounded-[24px] border border-gray-200 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)] sm:p-8">
            <div className="flex items-center gap-3">
              <div className="h-1 w-8 rounded-full bg-green-500" />

              <h2 className="text-2xl font-black tracking-tight">
                Описание
              </h2>
            </div>

            <div className="mt-5 max-w-4xl">
              <p className="whitespace-pre-line text-[15px] leading-7 text-gray-600">
                {product.description ||
                  "Описание товара пока не добавлено."}
              </p>
            </div>
          </section>

          {/* PURCHASE CARD */}

          <section className="rounded-[24px] border border-gray-200 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)]">
            <h2 className="text-lg font-black">
              Покупка у нас
            </h2>

            <div className="mt-5 space-y-4">
              <BenefitRow text="Товар проверяется перед отправкой" />
              <BenefitRow text="Безопасная упаковка" />
              <BenefitRow text="Доставка по Германии" />
              <BenefitRow text="Поддержка по заказу" />
            </div>
          </section>
        </div>

        {/* ================================================= */}
        {/* FULL SPECIFICATIONS */}
        {/* ================================================= */}

        <section className="mt-6 rounded-[24px] border border-gray-200 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)] sm:p-8">
          <div className="flex items-center gap-3">
            <div className="h-1 w-8 rounded-full bg-green-500" />

            <h2 className="text-2xl font-black tracking-tight">
              Характеристики
            </h2>
          </div>

          <div className="mt-6 grid gap-x-10 gap-y-0 md:grid-cols-2">
            <DetailRow
              label="Бренд"
              value={product.brand}
            />

            <DetailRow
              label="Модель"
              value={product.model || "—"}
            />

            <DetailRow
              label="Категория"
              value={product.category?.name || "—"}
            />

            <DetailRow
              label="Состояние"
              value={product.condition}
            />

            <DetailRow
              label="Память"
              value={product.memory || "—"}
            />

            <DetailRow
              label="Цвет"
              value={product.color || "—"}
            />

            <DetailRow
              label="Аккумулятор"
              value={product.battery || "—"}
            />

            <DetailRow
              label="Статус"
              value={product.status}
            />

            {product.year && (
              <DetailRow
                label="Год"
                value={String(product.year)}
              />
            )}

            {product.display && (
              <DetailRow
                label="Дисплей"
                value={product.display}
              />
            )}

            {product.processor && (
              <DetailRow
                label="Процессор"
                value={product.processor}
              />
            )}

            {product.camera && (
              <DetailRow
                label="Камера"
                value={product.camera}
              />
            )}

            {product.sim && (
              <DetailRow
                label="SIM"
                value={product.sim}
              />
            )}

            <DetailRow
              label="Количество"
              value={`${product.quantity} шт.`}
            />
          </div>
        </section>

        {/* ================================================= */}
        {/* BACK */}
        {/* ================================================= */}

        <div className="py-8">
          <Link
            href="/catalog"
            className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 transition hover:text-green-600"
          >
            <ArrowLeft size={16} />
            Вернуться в каталог
          </Link>
        </div>
      </div>
    </main>
  );
}

/* =========================================================
   TRUST ITEM
========================================================= */

function TrustItem({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="truncate text-xs font-extrabold text-gray-900">
          {title}
        </p>

        <p className="mt-0.5 truncate text-[11px] font-medium text-gray-400">
          {text}
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   SPEC ROW
========================================================= */

function SpecRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-5 px-4 py-3.5">
      <span className="text-sm font-medium text-gray-500">
        {label}
      </span>

      <span className="text-right text-sm font-bold text-gray-900">
        {value}
      </span>
    </div>
  );
}

/* =========================================================
   MINI INFO
========================================================= */

function MiniInfo({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3.5">
      <div className="flex gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-green-600 shadow-sm">
          {icon}
        </div>

        <div>
          <p className="text-xs font-extrabold text-gray-900">
            {title}
          </p>

          <p className="mt-0.5 text-[11px] leading-4 text-gray-500">
            {text}
          </p>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   BENEFIT ROW
========================================================= */

function BenefitRow({
  text,
}: {
  text: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
        <Check
          size={12}
          strokeWidth={3}
        />
      </div>

      <span className="text-sm font-medium leading-5 text-gray-600">
        {text}
      </span>
    </div>
  );
}

/* =========================================================
   DETAIL ROW
========================================================= */

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-h-[58px] items-center justify-between gap-6 border-b border-gray-100 py-3">
      <span className="text-sm font-medium text-gray-500">
        {label}
      </span>

      <span className="max-w-[60%] text-right text-sm font-bold text-gray-900">
        {value}
      </span>
    </div>
  );
}