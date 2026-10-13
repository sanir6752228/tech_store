import Link from "next/link";
import FavoriteButton from "./FavoriteButton";
import CartButton from "./CartButton";
import { formatPrice } from "@/lib/formatPrice";

import {
  ArrowUpRight,
  Battery,
  Check,
  Package,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

interface Product {
  id: number;

  name: string;
  brand: string;
  model: string;

  categoryId: number;

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

interface ProductProps {
  product: Product;
}

/*
 * =========================================================
 * СОСТОЯНИЕ ТОВАРА
 * =========================================================
 */

function getConditionLabel(
  condition: string
) {
  switch (condition) {
    case "Б/У":
      return "Б/У";

    case "Новый":
      return "Новый";

    case "После ремонта":
      return "После ремонта";

    default:
      return condition;
  }
}

function getConditionClass(
  condition: string
) {
  switch (condition) {
    case "Новый":
      return "bg-green-500 text-black";

    case "Б/У":
      return "bg-orange-500 text-white";

    case "После ремонта":
      return "bg-blue-500 text-white";

    default:
      return "bg-gray-900 text-white";
  }
}

/*
 * =========================================================
 * СТАТУС
 * =========================================================
 */

function getStatusInfo(
  status: string
) {
  switch (status) {
    case "В наличии":
      return {
        text: "В наличии",
        className:
          "text-green-700",
        dot:
          "bg-green-500",
      };

    case "Под заказ":
      return {
        text: "Под заказ",
        className:
          "text-yellow-700",
        dot:
          "bg-yellow-500",
      };

    case "Продан":
      return {
        text: "Продано",
        className:
          "text-red-600",
        dot:
          "bg-red-500",
      };

    default:
      return {
        text: status,
        className:
          "text-gray-500",
        dot:
          "bg-gray-400",
      };
  }
}

/*
 * =========================================================
 * CARD
 * =========================================================
 */

export default function ProductCard({
  product,
}: ProductProps) {
  const image =
    product.images?.[0];

  const cartType:
    | "single"
    | "stock" =
    product.condition === "Б/У"
      ? "single"
      : "stock";

  const isAvailable =
    product.status !== "Продан";

  const statusInfo =
    getStatusInfo(
      product.status
    );

  const hasDiscount =
    product.oldPrice !== null &&
    product.oldPrice >
      product.price;

  const discountPercent =
    hasDiscount
      ? Math.round(
          ((product.oldPrice! -
            product.price) /
            product.oldPrice!) *
            100
        )
      : 0;

  return (
    <article
      className="
        group flex h-full flex-col overflow-hidden rounded-[24px]
        border border-gray-200 bg-white shadow-sm
        transition-all duration-300
        hover:-translate-y-1
        hover:border-gray-300
        hover:shadow-[0_20px_50px_rgba(0,0,0,0.10)]
      "
    >

      {/* =====================================================
          IMAGE
      ===================================================== */}

      <div className="relative">

        <Link
          href={`/product/${product.id}`}
          className="block"
        >

          <div
            className="
              relative h-[270px] overflow-hidden
              bg-[#f5f6f7]
            "
          >

            {/* IMAGE */}

            {image ? (
              <img
                src={image}
                alt={product.name}
                className="
                  h-full w-full object-contain p-7
                  transition-transform duration-700
                  ease-out
                  group-hover:scale-[1.07]
                "
              />
            ) : (
              <div
                className="
                  flex h-full w-full items-center
                  justify-center text-gray-300
                "
              >
                <Package
                  size={58}
                  strokeWidth={1.2}
                />
              </div>
            )}

            {/* IMAGE OVERLAY */}

            <div
              className="
                pointer-events-none absolute inset-0
                bg-gradient-to-t from-black/[0.04]
                via-transparent to-transparent
              "
            />

            {/* CONDITION */}

            <div className="absolute left-4 top-4">

              <span
                className={`
                  inline-flex items-center rounded-full
                  px-3 py-1.5 text-[10px]
                  font-black uppercase tracking-wide
                  shadow-sm
                  ${getConditionClass(
                    product.condition
                  )}
                `}
              >
                {getConditionLabel(
                  product.condition
                )}
              </span>

            </div>

            {/* DISCOUNT */}

            {hasDiscount && (
              <div className="absolute right-4 top-4">

                <span className="rounded-full bg-red-500 px-3 py-1.5 text-[10px] font-black text-white shadow-sm">
                  −{discountPercent}%
                </span>

              </div>
            )}

            {/* NEW */}

            {product.condition ===
              "Новый" &&
              !hasDiscount && (
                <div className="absolute right-4 top-4">

                  <span className="flex items-center gap-1 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-black text-gray-800 shadow-sm backdrop-blur">
                    <Sparkles
                      size={11}
                      className="text-green-600"
                    />
                    Новинка
                  </span>

                </div>
              )}

          </div>

        </Link>

        {/* ===================================================
            FAVORITE
        =================================================== */}

        <div className="absolute right-4 bottom-4 z-10">

          <FavoriteButton
            id={product.id}
          />

        </div>

      </div>

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <div className="flex flex-1 flex-col p-5">

        {/* BRAND */}

        <div className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">
          {product.brand}
        </div>

        {/* NAME */}

        <Link
          href={`/product/${product.id}`}
          className="group/title"
        >

          <h3
            className="
              line-clamp-2 min-h-[50px]
              text-[17px] font-black leading-6
              tracking-[-0.02em] text-gray-950
              transition group-hover/title:text-green-600
            "
          >
            {product.name}
          </h3>

        </Link>

        {/* MODEL */}

        {product.model && (
          <p className="mt-1 line-clamp-1 text-xs font-medium text-gray-400">
            {product.model}
          </p>
        )}

        {/* ===================================================
            SPECS
        =================================================== */}

        <div className="mt-4 flex min-h-[30px] flex-wrap gap-1.5">

          {product.memory && (
            <span className="rounded-lg bg-gray-100 px-2.5 py-1.5 text-[10px] font-bold text-gray-600">
              {product.memory}
            </span>
          )}

          {product.color && (
            <span className="max-w-[120px] truncate rounded-lg bg-gray-100 px-2.5 py-1.5 text-[10px] font-bold text-gray-600">
              {product.color}
            </span>
          )}

          {product.battery && (
            <span className="flex items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-1.5 text-[10px] font-bold text-gray-600">
              <Battery size={11} />
              {product.battery}
            </span>
          )}

        </div>

        {/* ===================================================
            STATUS
        =================================================== */}

        <div className="mt-4 flex items-center justify-between">

          <div
            className={`
              flex items-center gap-1.5
              text-[11px] font-black
              ${statusInfo.className}
            `}
          >

            <span
              className={`
                h-1.5 w-1.5 rounded-full
                ${statusInfo.dot}
              `}
            />

            {statusInfo.text}

          </div>

          {product.quantity >
            0 &&
            product.status !==
              "Продан" && (
              <span className="text-[10px] font-bold text-gray-400">
                {product.quantity} шт.
              </span>
            )}

        </div>

        {/* ===================================================
            PRICE
        =================================================== */}

        <div className="mt-auto pt-5">

          <div className="flex items-end justify-between gap-3">

            <div>

              <div className="flex items-baseline gap-2">

                <span className="text-[25px] font-black tracking-tight text-gray-950">
                  {formatPrice(
                    product.price
                  )}
                </span>

                <span className="text-xs font-bold text-gray-400">
                  ₽
                </span>

              </div>

              {hasDiscount && (
                <div className="mt-0.5 text-xs font-semibold text-gray-400 line-through">
                  {formatPrice(
                    product.oldPrice!
                  )} ₽
                </div>
              )}

            </div>

            {product.status ===
              "В наличии" && (
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-50 text-green-600">

                <Check size={16} />

              </div>
            )}

          </div>

        </div>

        {/* ===================================================
            CART
        =================================================== */}

        <div className="mt-4">

          {isAvailable ? (
            <CartButton
              id={product.id}
              type={cartType}
            />
          ) : (
            <button
              type="button"
              disabled
              className="
                flex h-12 w-full items-center
                justify-center rounded-xl
                bg-gray-100 text-sm font-black
                text-gray-400
                cursor-not-allowed
              "
            >
              Товар продан
            </button>
          )}

        </div>

        {/* ===================================================
            TRUST
        =================================================== */}

        <div className="mt-4 flex items-center justify-center gap-2 border-t border-gray-100 pt-3 text-[9px] font-bold uppercase tracking-wider text-gray-400">

          <ShieldCheck
            size={12}
            className="text-green-500"
          />

          TECHSTORE

          <span className="text-gray-200">
            •
          </span>

          Гарантия

        </div>

      </div>

      {/* =====================================================
          HOVER ARROW
      ===================================================== */}

      <Link
        href={`/product/${product.id}`}
        aria-label={`Открыть ${product.name}`}
        className="
          pointer-events-none absolute
          opacity-0 transition
          group-hover:pointer-events-auto
          group-hover:opacity-100
        "
      >
        <ArrowUpRight
          size={18}
        />
      </Link>

    </article>
  );
}