"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import DeleteProductButton from "@/components/DeleteProductButton";

type Product = {
  id: number;
  name: string;
  brand: string;
  model: string;
  price: number;
  quantity: number;
  status: string;
  images: string[];
  category?: {
    id: number;
    name: string;
  } | null;
};

function formatPrice(price: number) {
  return price.toLocaleString("ru-RU");
}

function getStatusStyle(status: string) {
  if (status === "Продан") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (
    status === "В наличии" ||
    status === "Активен" ||
    status === "Доступен"
  ) {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (
    status === "Забронирован" ||
    status === "Резерв"
  ) {
    return "border-yellow-200 bg-yellow-50 text-yellow-700";
  }

  return "border-gray-200 bg-gray-100 text-gray-700";
}

export default function ProductTable({
  products,
}: {
  products: Product[];
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Все");

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(
        products
          .map((product) => product.category?.name)
          .filter(
            (name): name is string =>
              Boolean(name)
          )
      )
    );

    return ["Все", ...uniqueCategories];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLowerCase();

    return products.filter((product) => {
      const text = [
        product.name,
        product.brand,
        product.model,
        product.category?.name ?? "",
      ]
        .join(" ")
        .toLowerCase();

      const searchMatch =
        normalizedSearch === "" ||
        text.includes(normalizedSearch);

      const categoryMatch =
        category === "Все" ||
        product.category?.name === category;

      return searchMatch && categoryMatch;
    });
  }, [products, search, category]);

  return (
    <div className="p-4 lg:p-5">

      {/* ФИЛЬТРЫ */}
      <div className="flex flex-col gap-3 lg:flex-row">

        {/* ПОИСК */}
        <div className="relative flex-1">

          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            🔍
          </span>

          <input
            type="text"
            placeholder="Поиск по названию, бренду или модели..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            className="
              w-full
              rounded-2xl
              border
              border-gray-200
              bg-gray-50
              py-3.5
              pl-11
              pr-4
              text-sm
              font-medium
              text-gray-900
              outline-none
              transition
              placeholder:text-gray-400
              focus:border-green-500
              focus:bg-white
              focus:ring-4
              focus:ring-green-500/10
            "
          />

        </div>

        {/* КАТЕГОРИЯ */}
        <select
          value={category}
          onChange={(event) =>
            setCategory(event.target.value)
          }
          className="
            rounded-2xl
            border
            border-gray-200
            bg-gray-50
            px-5
            py-3.5
            text-sm
            font-bold
            text-gray-700
            outline-none
            transition
            focus:border-green-500
            focus:bg-white
            focus:ring-4
            focus:ring-green-500/10
          "
        >
          {categories.map((item) => (
            <option
              key={item}
              value={item}
            >
              {item === "Все"
                ? "Все категории"
                : item}
            </option>
          ))}
        </select>

      </div>

      {/* РЕЗУЛЬТАТЫ */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">

        <p className="text-sm font-medium text-gray-500">
          Найдено товаров:{" "}
          <span className="font-black text-gray-900">
            {filteredProducts.length}
          </span>
        </p>

        {(search || category !== "Все") && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setCategory("Все");
            }}
            className="
              text-sm
              font-bold
              text-green-600
              transition
              hover:text-green-700
            "
          >
            Сбросить фильтры
          </button>
        )}

      </div>

      {/* ТАБЛИЦА */}
      <div className="mt-5 overflow-hidden rounded-2xl border border-gray-200">

        <div className="overflow-x-auto">

          <table className="w-full min-w-[1050px]">

            {/* HEADER */}
            <thead className="bg-[#0b0f0d] text-white">

              <tr className="text-left text-xs font-black uppercase tracking-wider">

                <th className="px-5 py-4">
                  Товар
                </th>

                <th className="px-5 py-4">
                  Категория
                </th>

                <th className="px-5 py-4">
                  Цена
                </th>

                <th className="px-5 py-4">
                  Остаток
                </th>

                <th className="px-5 py-4">
                  Статус
                </th>

                <th className="px-5 py-4 text-right">
                  Действия
                </th>

              </tr>

            </thead>

            {/* BODY */}
            <tbody className="divide-y divide-gray-100 bg-white">

              {/* НЕТ ТОВАРОВ */}
              {filteredProducts.length === 0 && (
                <tr>

                  <td
                    colSpan={6}
                    className="px-6 py-16 text-center"
                  >

                    <div className="text-4xl">
                      🔎
                    </div>

                    <div className="mt-4 font-black text-gray-900">
                      Товары не найдены
                    </div>

                    <p className="mt-1 text-sm text-gray-500">
                      Попробуй изменить запрос
                      или категорию.
                    </p>

                  </td>

                </tr>
              )}

              {/* ТОВАРЫ */}
              {filteredProducts.map((product) => {

                const firstImage =
                  product.images?.[0];

                const statusClass =
                  getStatusStyle(
                    product.status
                  );

                return (
                  <tr
                    key={product.id}
                    className="
                      group
                      transition
                      hover:bg-gray-50
                    "
                  >

                    {/* ТОВАР */}
                    <td className="px-5 py-5">

                      <div className="flex items-center gap-4">

                        {/* ФОТО */}
                        <div
                          className="
                            h-16
                            w-16
                            shrink-0
                            overflow-hidden
                            rounded-2xl
                            border
                            border-gray-200
                            bg-gray-100
                          "
                        >

                          {firstImage ? (
                            <img
                              src={firstImage}
                              alt={product.name}
                              className="
                                h-full
                                w-full
                                object-cover
                                transition
                                duration-300
                                group-hover:scale-105
                              "
                            />
                          ) : (
                            <div
                              className="
                                flex
                                h-full
                                w-full
                                items-center
                                justify-center
                                text-xl
                              "
                            >
                              📦
                            </div>
                          )}

                        </div>

                        {/* ИНФОРМАЦИЯ */}
                        <div className="min-w-0">

                          <Link
                            href={`/admin/products/${product.id}`}
                            className="
                              block
                              max-w-[320px]
                              truncate
                              font-black
                              text-gray-900
                              transition
                              hover:text-green-600
                            "
                          >
                            {product.name}
                          </Link>

                          <div className="mt-1 text-sm text-gray-500">
                            {product.brand}{" "}
                            {product.model}
                          </div>

                          {product.images &&
                            product.images.length > 1 && (
                              <div className="mt-1 text-xs font-bold text-gray-400">
                                📷{" "}
                                {product.images.length}{" "}
                                фото
                              </div>
                            )}

                        </div>

                      </div>

                    </td>

                    {/* КАТЕГОРИЯ */}
                    <td className="px-5 py-5">

                      {product.category ? (
                        <span
                          className="
                            inline-flex
                            rounded-xl
                            bg-gray-100
                            px-3
                            py-2
                            text-xs
                            font-bold
                            text-gray-700
                          "
                        >
                          {product.category.name}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">
                          Без категории
                        </span>
                      )}

                    </td>

                    {/* ЦЕНА */}
                    <td className="px-5 py-5">

                      <div className="font-black text-gray-900">
                        {formatPrice(product.price)} ₽
                      </div>

                    </td>

                    {/* ОСТАТОК */}
                    <td className="px-5 py-5">

                      <span className="text-sm font-bold text-gray-700">
                        {product.quantity} шт.
                      </span>

                    </td>

                    {/* СТАТУС */}
                    <td className="px-5 py-5">

                      <span
                        className={`
                          inline-flex
                          rounded-full
                          border
                          px-3
                          py-1.5
                          text-xs
                          font-black
                          ${statusClass}
                        `}
                      >
                        {product.status}
                      </span>

                    </td>

                    {/* ДЕЙСТВИЯ */}
                    <td className="px-5 py-5">

                      <div className="flex justify-end gap-2">

                        <Link
                          href={`/admin/products/${product.id}`}
                          className="
                            inline-flex
                            items-center
                            rounded-xl
                            border
                            border-gray-200
                            bg-white
                            px-3.5
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

                        <DeleteProductButton
                          id={product.id}
                        />

                      </div>

                    </td>

                  </tr>
                );
              })}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}