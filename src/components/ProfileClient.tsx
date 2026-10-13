"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type CartItem = {
  quantity?: number;
};

export default function ProfileClient() {
  const [cartCount, setCartCount] = useState(0);
  const [favoritesCount, setFavoritesCount] = useState(0);

  function updateCounters() {
    try {
      const cartRaw = localStorage.getItem("cart");
      const favoritesRaw = localStorage.getItem("favorites");

      const cart: CartItem[] = cartRaw
        ? JSON.parse(cartRaw)
        : [];

      const favorites: unknown[] = favoritesRaw
        ? JSON.parse(favoritesRaw)
        : [];

      const totalCartItems = cart.reduce(
        (sum, item) => {
          const quantity =
            typeof item?.quantity === "number"
              ? item.quantity
              : 1;

          return sum + quantity;
        },
        0
      );

      setCartCount(totalCartItems);
      setFavoritesCount(favorites.length);
    } catch (error) {
      console.error(
        "Ошибка чтения корзины/избранного:",
        error
      );

      setCartCount(0);
      setFavoritesCount(0);
    }
  }

  useEffect(() => {
    updateCounters();

    window.addEventListener(
      "cartUpdated",
      updateCounters
    );

    window.addEventListener(
      "favoritesUpdated",
      updateCounters
    );

    window.addEventListener(
      "storage",
      updateCounters
    );

    return () => {
      window.removeEventListener(
        "cartUpdated",
        updateCounters
      );

      window.removeEventListener(
        "favoritesUpdated",
        updateCounters
      );

      window.removeEventListener(
        "storage",
        updateCounters
      );
    };
  }, []);

  return (
    <section className="grid grid-cols-1 gap-6 md:grid-cols-2">

      {/* Избранное */}

      <Link
        href="/favorites"
        className="group rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-red-200 hover:shadow-md"
      >
        <div className="flex items-center justify-between">

          <div>
            <p className="text-sm font-bold text-gray-400">
              СОХРАНЁННЫЕ ТОВАРЫ
            </p>

            <h2 className="mt-2 text-2xl font-black text-gray-900">
              ❤️ Избранное
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Товары, которые вы сохранили
            </p>
          </div>

          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-3xl transition group-hover:scale-110">
            ❤️
          </div>

        </div>

        <div className="mt-6 border-t border-gray-100 pt-4">
          <span className="font-black text-gray-900">
            {favoritesCount}
          </span>

          <span className="ml-2 text-gray-500">
            {favoritesCount === 1
              ? "товар"
              : "товаров"}
          </span>
        </div>
      </Link>

      {/* Корзина */}

      <Link
        href="/cart"
        className="group rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-green-200 hover:shadow-md"
      >
        <div className="flex items-center justify-between">

          <div>
            <p className="text-sm font-bold text-gray-400">
              ПОКУПКИ
            </p>

            <h2 className="mt-2 text-2xl font-black text-gray-900">
              🛒 Корзина
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Товары, которые готовы к покупке
            </p>
          </div>

          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50 text-3xl transition group-hover:scale-110">
            🛒
          </div>

        </div>

        <div className="mt-6 border-t border-gray-100 pt-4">
          <span className="font-black text-gray-900">
            {cartCount}
          </span>

          <span className="ml-2 text-gray-500">
            {cartCount === 1
              ? "товар"
              : "товаров"}
          </span>
        </div>
      </Link>

    </section>
  );
}