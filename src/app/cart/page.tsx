"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Minus,
  Package,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Truck,
} from "lucide-react";

interface CartItem {
  id: number;
  quantity: number;
  type: "single" | "stock";
}

interface Product {
  id: number;
  name: string;
  brand: string;
  model: string;
  condition: string;
  status: string;
  memory: string | null;
  color: string | null;
  price: number;
  oldPrice: number | null;
  images: string[];
  quantity: number;
}

function formatPrice(price: number) {
  return price.toLocaleString("ru-RU");
}

function getProductsWord(count: number) {
  if (count === 1) return "товар";
  if (count >= 2 && count <= 4) return "товара";
  return "товаров";
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

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>(
    []
  );

  const [products, setProducts] = useState<Product[]>(
    []
  );

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCart();

    function handleCartUpdate() {
      loadCart();
    }

    window.addEventListener(
      "cartUpdated",
      handleCartUpdate
    );

    return () => {
      window.removeEventListener(
        "cartUpdated",
        handleCartUpdate
      );
    };
  }, []);

  async function loadCart() {
    try {
      const savedCart = JSON.parse(
        localStorage.getItem("cart") || "[]"
      );

      if (
        !Array.isArray(savedCart) ||
        savedCart.length === 0
      ) {
        setCart([]);
        setProducts([]);
        setLoading(false);
        return;
      }

      setCart(savedCart);

      const ids = savedCart
        .map((item: CartItem) => item.id)
        .join(",");

      const response = await fetch(
        `/api/cart?ids=${encodeURIComponent(ids)}`
      );

      if (!response.ok) {
        throw new Error(
          "Ошибка загрузки корзины"
        );
      }

      const data = await response.json();

      setProducts(
        Array.isArray(data) ? data : []
      );
    } catch (error) {
      console.error(
        "Ошибка корзины:",
        error
      );

      setCart([]);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  function saveCart(
    updatedCart: CartItem[]
  ) {
    setCart(updatedCart);

    localStorage.setItem(
      "cart",
      JSON.stringify(updatedCart)
    );

    window.dispatchEvent(
      new Event("cartUpdated")
    );
  }

  function getCartQuantity(
    productId: number
  ) {
    const item = cart.find(
      (item) => item.id === productId
    );

    return item?.quantity || 1;
  }

  function increaseQuantity(
    product: Product
  ) {
    if (product.condition === "Б/У") {
      return;
    }

    const updatedCart = cart.map(
      (item) => {
        if (item.id !== product.id) {
          return item;
        }

        return {
          ...item,
          quantity:
            item.quantity + 1,
        };
      }
    );

    saveCart(updatedCart);
  }

  function decreaseQuantity(
    product: Product
  ) {
    const currentQuantity =
      getCartQuantity(product.id);

    if (currentQuantity <= 1) {
      removeFromCart(product.id);
      return;
    }

    const updatedCart = cart.map(
      (item) => {
        if (item.id !== product.id) {
          return item;
        }

        return {
          ...item,
          quantity:
            item.quantity - 1,
        };
      }
    );

    saveCart(updatedCart);
  }

  function removeFromCart(
    productId: number
  ) {
    const updatedCart =
      cart.filter(
        (item) =>
          item.id !== productId
      );

    saveCart(updatedCart);

    setProducts(
      (currentProducts) =>
        currentProducts.filter(
          (product) =>
            product.id !== productId
        )
    );
  }

  function clearCart() {
    localStorage.removeItem("cart");

    setCart([]);
    setProducts([]);

    window.dispatchEvent(
      new Event("cartUpdated")
    );
  }

  const total = useMemo(() => {
    return products.reduce(
      (sum, product) => {
        const quantity =
          getCartQuantity(product.id);

        return (
          sum +
          product.price * quantity
        );
      },
      0
    );
  }, [products, cart]);

  const totalItems = useMemo(() => {
    return cart.reduce(
      (sum, item) =>
        sum + item.quantity,
      0
    );
  }, [cart]);

  /* =========================================
     LOADING
  ========================================= */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f6f7]">
        <div className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-[28px] border border-gray-200 bg-white p-7">
            <div className="h-8 w-48 animate-pulse rounded-lg bg-gray-200" />

            <div className="mt-3 h-4 w-28 animate-pulse rounded bg-gray-100" />

            <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
              <div className="space-y-4">
                {Array.from({ length: 2 }).map(
                  (_, index) => (
                    <div
                      key={index}
                      className="h-48 animate-pulse rounded-2xl bg-gray-100"
                    />
                  )
                )}
              </div>

              <div className="h-80 animate-pulse rounded-2xl bg-gray-100" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  /* =========================================
     EMPTY
  ========================================= */

  if (products.length === 0) {
    return (
      <main className="min-h-screen bg-[#f5f6f7]">
        <div className="mx-auto flex min-h-[75vh] max-w-[1500px] items-center px-4 py-10 sm:px-6 lg:px-8">
          <div className="w-full rounded-[28px] border border-gray-200 bg-white px-6 py-16 text-center shadow-[0_10px_40px_rgba(0,0,0,0.03)] sm:px-10">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-green-50 text-green-600">
              <ShoppingBag
                size={36}
                strokeWidth={1.8}
              />
            </div>

            <p className="mt-7 text-xs font-extrabold uppercase tracking-[0.14em] text-green-600">
              Корзина
            </p>

            <h1 className="mt-3 text-3xl font-black tracking-tight text-gray-950 sm:text-4xl">
              Корзина пуста
            </h1>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-gray-500 sm:text-base">
              Добавьте понравившиеся товары
              из каталога, и они появятся
              здесь.
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
     CART
  ========================================= */

  return (
    <main className="min-h-screen bg-[#f5f6f7] text-gray-950">
      <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {/* TOP */}

        <div className="mb-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              href="/"
              className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition hover:text-green-600"
            >
              <ArrowLeft size={16} />
              На главную
            </Link>

            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-600">
                <ShoppingBag
                  size={22}
                  strokeWidth={2}
                />
              </div>

              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-green-600">
                  Ваш заказ
                </p>

                <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                  Корзина
                </h1>
              </div>
            </div>

            <p className="mt-3 text-sm text-gray-500">
              {products.length}{" "}
              {getProductsWord(
                products.length
              )}
              {" · "}
              {totalItems} шт.
            </p>
          </div>

          <button
            type="button"
            onClick={clearCart}
            className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-lg px-3 text-sm font-bold text-gray-400 transition hover:bg-red-50 hover:text-red-600 sm:self-auto"
          >
            <Trash2 size={16} />
            Очистить корзину
          </button>
        </div>

        {/* CONTENT */}

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_370px]">
          {/* PRODUCTS */}

          <section className="space-y-3">
            {products.map((product) => {
              const quantity =
                getCartQuantity(
                  product.id
                );

              const isUsed =
                product.condition ===
                "Б/У";

              const canIncrease =
                !isUsed;

              return (
                <article
                  key={product.id}
                  className="rounded-[22px] border border-gray-200 bg-white p-4 transition hover:border-gray-300 sm:p-5"
                >
                  <div className="flex flex-col gap-5 sm:flex-row">
                    {/* IMAGE */}

                    <Link
                      href={`/product/${product.id}`}
                      className="group relative flex h-44 w-full shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#f7f8f9] sm:h-40 sm:w-40"
                    >
                      {product.images?.[0] ? (
                        <img
                          src={
                            product.images[0]
                          }
                          alt={
                            product.name
                          }
                          className="h-full w-full object-contain p-3 transition duration-300 group-hover:scale-[1.04]"
                        />
                      ) : (
                        <Package
                          size={48}
                          className="text-gray-300"
                        />
                      )}
                    </Link>

                    {/* INFO */}

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-gray-400">
                            {product.brand}
                          </p>

                          <Link
                            href={`/product/${product.id}`}
                            className="mt-1 block text-xl font-black tracking-tight text-gray-950 transition hover:text-green-600 sm:text-[22px]"
                          >
                            {product.name}
                          </Link>

                          {product.model && (
                            <p className="mt-1 text-sm font-medium text-gray-400">
                              {product.model}
                            </p>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            removeFromCart(
                              product.id
                            )
                          }
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-300 transition hover:bg-red-50 hover:text-red-500"
                          aria-label="Удалить товар"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>

                      {/* TAGS */}

                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {product.condition && (
                          <span
                            className={`rounded-md border px-2.5 py-1 text-[11px] font-extrabold ${getConditionClass(
                              product.condition
                            )}`}
                          >
                            {product.condition}
                          </span>
                        )}

                        {product.memory && (
                          <span className="rounded-md bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-600">
                            {product.memory}
                          </span>
                        )}

                        {product.color && (
                          <span className="rounded-md bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-600">
                            {product.color}
                          </span>
                        )}

                        {product.status ===
                          "Под заказ" && (
                          <span className="rounded-md bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">
                            Под заказ
                          </span>
                        )}
                      </div>

                      {/* BOTTOM */}

                      <div className="mt-5 flex flex-col gap-4 border-t border-gray-100 pt-4 sm:flex-row sm:items-end sm:justify-between">
                        {/* QUANTITY */}

                        <div>
                          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-gray-400">
                            Количество
                          </p>

                          <div className="flex h-10 w-fit items-center overflow-hidden rounded-lg border border-gray-200 bg-white">
                            <button
                              type="button"
                              onClick={() =>
                                decreaseQuantity(
                                  product
                                )
                              }
                              className="flex h-10 w-10 items-center justify-center text-gray-500 transition hover:bg-gray-50 hover:text-gray-900"
                              aria-label="Уменьшить количество"
                            >
                              <Minus size={15} />
                            </button>

                            <span className="flex h-10 min-w-[42px] items-center justify-center border-x border-gray-200 px-2 text-sm font-extrabold">
                              {quantity}
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                increaseQuantity(
                                  product
                                )
                              }
                              disabled={
                                !canIncrease
                              }
                              className="flex h-10 w-10 items-center justify-center text-gray-500 transition hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-25"
                              aria-label="Увеличить количество"
                            >
                              <Plus size={15} />
                            </button>
                          </div>

                          {isUsed && (
                            <p className="mt-2 text-[11px] font-medium text-gray-400">
                              Б/У — только 1 шт.
                            </p>
                          )}
                        </div>

                        {/* PRICE */}

                        <div className="text-left sm:text-right">
                          <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
                            Стоимость
                          </p>

                          <p className="mt-1 text-2xl font-black tracking-tight">
                            {formatPrice(
                              product.price *
                                quantity
                            )}{" "}
                            ₽
                          </p>

                          {quantity > 1 && (
                            <p className="mt-1 text-xs text-gray-400">
                              {formatPrice(
                                product.price
                              )}{" "}
                              ₽ ×{" "}
                              {quantity}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>

          {/* SUMMARY */}

          <aside className="lg:sticky lg:top-5">
            <div className="overflow-hidden rounded-[24px] border border-gray-200 bg-white">
              <div className="border-b border-gray-100 p-6">
                <h2 className="text-xl font-black tracking-tight">
                  Ваш заказ
                </h2>

                <p className="mt-1 text-sm text-gray-400">
                  Проверьте товары перед
                  оформлением
                </p>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="text-gray-500">
                      Товары
                    </span>

                    <span className="font-bold text-gray-900">
                      {formatPrice(
                        total
                      )}{" "}
                      ₽
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-4 text-sm">
                    <span className="text-gray-500">
                      Доставка
                    </span>

                    <span className="max-w-[170px] text-right font-semibold text-green-600">
                      Рассчитывается при
                      оформлении
                    </span>
                  </div>
                </div>

                <div className="my-5 border-t border-gray-100" />

                <div className="flex items-end justify-between gap-4">
                  <span className="text-sm font-bold text-gray-500">
                    Итого
                  </span>

                  <span className="text-[30px] font-black leading-none tracking-tight">
                    {formatPrice(
                      total
                    )}{" "}
                    ₽
                  </span>
                </div>

                <Link
                  href="/checkout"
                  className="mt-6 flex h-13 min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-5 text-sm font-extrabold text-white transition hover:bg-green-700"
                >
                  Перейти к оформлению
                  <ArrowRight size={17} />
                </Link>

                <Link
                  href="/catalog"
                  className="mt-2.5 flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 text-sm font-bold text-gray-700 transition hover:border-green-300 hover:bg-green-50 hover:text-green-700"
                >
                  <ArrowLeft size={16} />
                  Продолжить покупки
                </Link>
              </div>
            </div>

            {/* BENEFITS */}

            <div className="mt-3 rounded-[20px] border border-gray-200 bg-white p-5">
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600">
                    <Truck size={17} />
                  </div>

                  <div>
                    <p className="text-xs font-extrabold text-gray-900">
                      Доставка
                    </p>

                    <p className="mt-0.5 text-[11px] leading-4 text-gray-500">
                      Условия доставки уточняются
                      при оформлении
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600">
                    <ShieldCheck size={17} />
                  </div>

                  <div>
                    <p className="text-xs font-extrabold text-gray-900">
                      Проверка товара
                    </p>

                    <p className="mt-0.5 text-[11px] leading-4 text-gray-500">
                      Проверяем товар перед
                      отправкой
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600">
                    <Check
                      size={17}
                      strokeWidth={2.5}
                    />
                  </div>

                  <div>
                    <p className="text-xs font-extrabold text-gray-900">
                      Поддержка
                    </p>

                    <p className="mt-0.5 text-[11px] leading-4 text-gray-500">
                      Поможем с заказом и
                      покупкой
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* BOTTOM INFO */}

        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl border border-gray-200 bg-white px-5 py-4 text-xs font-medium text-gray-500">
          <span className="inline-flex items-center gap-2">
            <Check
              size={14}
              className="text-green-600"
            />
            Актуальные цены
          </span>

          <span className="inline-flex items-center gap-2">
            <Check
              size={14}
              className="text-green-600"
            />
            Проверенные товары
          </span>

          <span className="inline-flex items-center gap-2">
            <Check
              size={14}
              className="text-green-600"
            />
            Поддержка при заказе
          </span>

          <Link
            href="/catalog"
            className="ml-auto inline-flex items-center gap-1 font-bold text-gray-700 transition hover:text-green-600"
          >
            Вернуться к товарам
            <ChevronRight size={14} />
          </Link>
        </div>
      </div>
    </main>
  );
}