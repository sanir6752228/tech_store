"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Heart,
  ShoppingBag,
  Package,
  Check,
  Trash2,
} from "lucide-react";

import FavoriteButton from "@/components/FavoriteButton";
import CartButton from "@/components/CartButton";

interface Product {
  id: number;
  name: string;
  brand: string;
  model: string;
  condition: string;
  status: string;
  memory: string | null;
  color: string | null;
  battery: string | null;
  price: number;
  oldPrice: number | null;
  description: string | null;
  images: string[];
  telegramVideo: string | null;
  quantity: number;

  category?: {
    id: number;
    name: string;
    slug: string;
  };
}

function formatPrice(price: number) {
  return price.toLocaleString("ru-RU");
}

function getConditionClass(condition: string) {
  switch (condition) {
    case "Новый":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "Б/У":
      return "border-orange-200 bg-orange-50 text-orange-700";

    case "После ремонта":
      return "border-blue-200 bg-blue-50 text-blue-700";

    default:
      return "border-gray-200 bg-gray-50 text-gray-600";
  }
}

function getStatusClass(status: string) {
  switch (status) {
    case "В наличии":
      return "bg-emerald-50 text-emerald-700";

    case "Под заказ":
      return "bg-amber-50 text-amber-700";

    case "Продан":
      return "bg-red-50 text-red-700";

    default:
      return "bg-gray-100 text-gray-600";
  }
}

function getDiscount(product: Product) {
  if (
    product.oldPrice &&
    product.oldPrice > product.price
  ) {
    return Math.round(
      ((product.oldPrice - product.price) /
        product.oldPrice) *
        100
    );
  }

  return null;
}

function getProductsWord(count: number) {
  if (count === 1) return "товар";
  if (count >= 2 && count <= 4) return "товара";
  return "товаров";
}

export default function FavoritesPage() {
  const [favoriteItems, setFavoriteItems] = useState<Product[]>(
    []
  );

  const [loading, setLoading] = useState(true);

  async function loadFavorites() {
    try {
      const savedFavorites = JSON.parse(
        localStorage.getItem("favorites") || "[]"
      );

      if (
        !Array.isArray(savedFavorites) ||
        savedFavorites.length === 0
      ) {
        setFavoriteItems([]);
        setLoading(false);
        return;
      }

      const ids = savedFavorites
        .map((id: number) => Number(id))
        .filter(
          (id: number) =>
            Number.isInteger(id) && id > 0
        )
        .join(",");

      if (!ids) {
        setFavoriteItems([]);
        setLoading(false);
        return;
      }

      const response = await fetch(
        `/api/favorites?ids=${encodeURIComponent(ids)}`
      );

      if (!response.ok) {
        throw new Error(
          "Ошибка загрузки избранного"
        );
      }

      const data = await response.json();

      setFavoriteItems(
        Array.isArray(data) ? data : []
      );
    } catch (error) {
      console.error(
        "Ошибка избранного:",
        error
      );

      setFavoriteItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFavorites();

    function handleFavoritesUpdate() {
      loadFavorites();
    }

    window.addEventListener(
      "favoritesUpdated",
      handleFavoritesUpdate
    );

    return () => {
      window.removeEventListener(
        "favoritesUpdated",
        handleFavoritesUpdate
      );
    };
  }, []);

  /* =========================================
     LOADING
  ========================================= */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f6f7]">
        <div className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6">
            <div className="h-4 w-28 animate-pulse rounded bg-gray-200" />
          </div>

          <div className="rounded-[28px] border border-gray-200 bg-white p-6 sm:p-8">
            <div className="h-8 w-56 animate-pulse rounded-lg bg-gray-200" />

            <div className="mt-3 h-4 w-36 animate-pulse rounded bg-gray-100" />

            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 4 }).map(
                (_, index) => (
                  <div
                    key={index}
                    className="overflow-hidden rounded-2xl border border-gray-100"
                  >
                    <div className="h-64 animate-pulse bg-gray-100" />

                    <div className="space-y-3 p-5">
                      <div className="h-3 w-20 animate-pulse rounded bg-gray-100" />
                      <div className="h-5 w-4/5 animate-pulse rounded bg-gray-100" />
                      <div className="h-4 w-1/2 animate-pulse rounded bg-gray-100" />
                      <div className="h-8 w-32 animate-pulse rounded bg-gray-100" />
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </main>
    );
  }

  /* =========================================
     EMPTY
  ========================================= */

  if (favoriteItems.length === 0) {
    return (
      <main className="min-h-screen bg-[#f5f6f7]">
        <div className="mx-auto flex min-h-[75vh] max-w-[1500px] items-center px-4 py-10 sm:px-6 lg:px-8">
          <div className="w-full rounded-[28px] border border-gray-200 bg-white px-6 py-16 text-center shadow-[0_10px_40px_rgba(0,0,0,0.03)] sm:px-10">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-green-50 text-green-600">
              <Heart
                size={36}
                strokeWidth={1.8}
              />
            </div>

            <p className="mt-7 text-xs font-extrabold uppercase tracking-[0.14em] text-green-600">
              Избранное
            </p>

            <h1 className="mt-3 text-3xl font-black tracking-tight text-gray-950 sm:text-4xl">
              Здесь пока ничего нет
            </h1>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-gray-500 sm:text-base">
              Сохраняйте понравившиеся товары,
              чтобы быстро вернуться к ним позже.
            </p>

            <Link
              href="/catalog"
              className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-green-600 px-6 text-sm font-extrabold text-white transition hover:bg-green-700"
            >
              Перейти в каталог
              <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </main>
    );
  }

  /* =========================================
     FAVORITES
  ========================================= */

  return (
    <main className="min-h-screen bg-[#f5f6f7] text-gray-950">
      <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {/* BREADCRUMBS */}

        <div className="mb-5">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition hover:text-green-600"
          >
            <ArrowLeft size={16} />
            На главную
          </Link>
        </div>

        {/* HEADER */}

        <section className="rounded-[28px] border border-gray-200 bg-white px-5 py-6 shadow-[0_8px_35px_rgba(0,0,0,0.03)] sm:px-7 sm:py-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-600">
                  <Heart
                    size={22}
                    strokeWidth={2}
                  />
                </div>

                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-green-600">
                    Мои товары
                  </p>

                  <h1 className="text-3xl font-black tracking-tight text-gray-950 sm:text-4xl">
                    Избранное
                  </h1>
                </div>
              </div>

              <p className="mt-3 text-sm text-gray-500">
                {favoriteItems.length}{" "}
                {getProductsWord(
                  favoriteItems.length
                )}{" "}
                сохранено
              </p>
            </div>

            <Link
              href="/catalog"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 text-sm font-bold text-gray-700 transition hover:border-green-300 hover:bg-green-50 hover:text-green-700"
            >
              Перейти в каталог
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>

        {/* PRODUCTS */}

        <section className="mt-6">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {favoriteItems.map((product) => {
              const image =
                product.images?.[0];

              const isAvailable =
                product.status !== "Продан";

              const cartType:
                | "single"
                | "stock" =
                product.condition === "Б/У"
                  ? "single"
                  : "stock";

              const discount =
                getDiscount(product);

              return (
                <article
                  key={product.id}
                  className="group overflow-hidden rounded-[22px] border border-gray-200 bg-white transition duration-300 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-[0_16px_45px_rgba(0,0,0,0.08)]"
                >
                  {/* IMAGE */}

                  <Link
                    href={`/product/${product.id}`}
                    className="block"
                  >
                    <div className="relative h-[280px] overflow-hidden bg-[#f7f8f9] p-5">
                      {image ? (
                        <img
                          src={image}
                          alt={product.name}
                          className="h-full w-full object-contain transition duration-500 group-hover:scale-[1.045]"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-gray-300">
                          <Package size={58} />
                        </div>
                      )}

                      {/* CONDITION */}

                      <div className="absolute left-4 top-4">
                        <span
                          className={`inline-flex rounded-lg border px-2.5 py-1 text-[11px] font-extrabold ${getConditionClass(
                            product.condition
                          )}`}
                        >
                          {product.condition}
                        </span>
                      </div>

                      {/* DISCOUNT */}

                      {discount && (
                        <div className="absolute bottom-4 left-4">
                          <span className="rounded-lg bg-red-500 px-2.5 py-1 text-[11px] font-extrabold text-white">
                            −{discount}%
                          </span>
                        </div>
                      )}

                      {/* FAVORITE */}

                      <div
                        className="absolute right-4 top-4"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                        }}
                      >
                        <FavoriteButton
                          id={product.id}
                        />
                      </div>
                    </div>
                  </Link>

                  {/* CONTENT */}

                  <div className="p-5">
                    <div className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-gray-400">
                      {product.brand}
                    </div>

                    <Link
                      href={`/product/${product.id}`}
                      className="mt-1 block text-[18px] font-black leading-6 tracking-tight text-gray-950 transition hover:text-green-600"
                    >
                      {product.name}
                    </Link>

                    {product.model && (
                      <p className="mt-1 text-xs font-medium text-gray-400">
                        {product.model}
                      </p>
                    )}

                    {/* SPECS */}

                    <div className="mt-4 flex min-h-[28px] flex-wrap gap-1.5">
                      {product.memory && (
                        <span className="rounded-md bg-gray-100 px-2 py-1 text-[11px] font-semibold text-gray-600">
                          {product.memory}
                        </span>
                      )}

                      {product.color && (
                        <span className="rounded-md bg-gray-100 px-2 py-1 text-[11px] font-semibold text-gray-600">
                          {product.color}
                        </span>
                      )}

                      {product.category?.name && (
                        <span className="rounded-md bg-gray-100 px-2 py-1 text-[11px] font-semibold text-gray-600">
                          {product.category.name}
                        </span>
                      )}
                    </div>

                    {/* STATUS */}

                    <div className="mt-4">
                      <span
                        className={`inline-flex rounded-md px-2.5 py-1 text-[11px] font-bold ${getStatusClass(
                          product.status
                        )}`}
                      >
                        {product.status}
                      </span>
                    </div>

                    {/* PRICE */}

                    <div className="mt-4 flex items-end gap-2">
                      <span className="text-[25px] font-black leading-none tracking-tight text-gray-950">
                        {formatPrice(
                          product.price
                        )}{" "}
                        ₽
                      </span>

                      {product.oldPrice &&
                        product.oldPrice >
                          product.price && (
                          <span className="mb-0.5 text-xs font-semibold text-gray-400 line-through">
                            {formatPrice(
                              product.oldPrice
                            )}{" "}
                            ₽
                          </span>
                        )}
                    </div>

                    {/* CART */}

                    <div className="mt-5">
                      {isAvailable ? (
                        <CartButton
                          id={product.id}
                          type={cartType}
                        />
                      ) : (
                        <button
                          disabled
                          className="flex h-11 w-full items-center justify-center rounded-xl bg-gray-100 text-sm font-bold text-gray-400"
                        >
                          Товар продан
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}