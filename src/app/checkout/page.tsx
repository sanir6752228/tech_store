"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CreditCard,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  ShieldCheck,
  ShoppingBag,
  Truck,
  User,
  WalletCards,
  XCircle,
} from "lucide-react";

interface CartItem {
  id: number;
  quantity: number;
  type?: "single" | "stock";
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

function getItemQuantity(
  cart: CartItem[],
  product: Product
) {
  const item = cart.find(
    (cartItem) => cartItem.id === product.id
  );

  if (!item) {
    return 1;
  }

  return product.condition === "Б/У"
    ? 1
    : item.quantity;
}

function getProductsLabel(count: number) {
  if (count % 10 === 1 && count % 100 !== 11) {
    return "товар";
  }

  if (
    [2, 3, 4].includes(count % 10) &&
    ![12, 13, 14].includes(count % 100)
  ) {
    return "товара";
  }

  return "товаров";
}

function getConditionClass(condition: string) {
  if (condition === "Новый") {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }

  if (condition === "Б/У") {
    return "bg-orange-50 text-orange-700 border-orange-200";
  }

  if (condition === "После ремонта") {
    return "bg-blue-50 text-blue-700 border-blue-200";
  }

  return "bg-gray-50 text-gray-700 border-gray-200";
}

export default function CheckoutPage() {
  const router = useRouter();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");

  const [contactMethod, setContactMethod] =
    useState("Телефон");

  const [comment, setComment] = useState("");

  /*
   * ============================================
   * ЗАГРУЗКА КОРЗИНЫ
   * ============================================
   */

  useEffect(() => {
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

        const validCart = savedCart.filter(
          (item: any) =>
            Number.isInteger(Number(item.id)) &&
            Number(item.id) > 0
        );

        setCart(validCart);

        if (validCart.length === 0) {
          setLoading(false);
          return;
        }

        const ids = validCart
          .map((item: CartItem) => item.id)
          .join(",");

        const response = await fetch(
          `/api/cart?ids=${ids}`
        );

        if (!response.ok) {
          throw new Error(
            "Не удалось загрузить корзину"
          );
        }

        const data = await response.json();

        setProducts(
          Array.isArray(data) ? data : []
        );
      } catch (error) {
        console.error(
          "Ошибка загрузки checkout:",
          error
        );

        setError(
          "Не удалось загрузить корзину"
        );
      } finally {
        setLoading(false);
      }
    }

    loadCart();
  }, []);

  /*
   * ============================================
   * КОЛИЧЕСТВО
   * ============================================
   */

  function getQuantity(productId: number) {
    const item = cart.find(
      (cartItem) => cartItem.id === productId
    );

    if (!item) {
      return 1;
    }

    return item.quantity;
  }

  /*
   * ============================================
   * ИТОГО
   * ============================================
   */

  const total = products.reduce(
    (sum, product) => {
      const quantity = getItemQuantity(
        cart,
        product
      );

      return (
        sum +
        product.price * quantity
      );
    },
    0
  );

  const totalItems = products.reduce(
    (sum, product) =>
      sum + getItemQuantity(cart, product),
    0
  );

  /*
   * ============================================
   * ОФОРМЛЕНИЕ
   * ============================================
   */

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    if (products.length === 0) {
      setError("Корзина пуста");
      return;
    }

    if (!customerName.trim()) {
      setError("Введите имя и фамилию");
      return;
    }

    if (!phone.trim()) {
      setError("Введите номер телефона");
      return;
    }

    if (!city.trim()) {
      setError("Введите город");
      return;
    }

    if (!address.trim()) {
      setError("Введите адрес доставки");
      return;
    }

    setSubmitting(true);

    try {
      const orderItems = products.map(
        (product) => ({
          id: product.id,
          quantity: getItemQuantity(
            cart,
            product
          ),
        })
      );

      const response = await fetch(
        "/api/orders",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            customerName:
              customerName.trim(),

            phone: phone.trim(),

            city: city.trim(),

            address: address.trim(),

            contactMethod,

            comment:
              comment.trim() || null,

            items: orderItems,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Ошибка оформления заказа"
        );
      }

      localStorage.removeItem("cart");

      window.dispatchEvent(
        new Event("cartUpdated")
      );

      router.push(
        `/checkout/success?orderId=${data.order.id}`
      );
    } catch (error: any) {
      console.error(
        "Ошибка оформления:",
        error
      );

      setError(
        error.message ||
          "Не удалось оформить заказ"
      );
    } finally {
      setSubmitting(false);
    }
  }

  /*
   * ============================================
   * LOADING
   * ============================================
   */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f6f7] text-gray-950">
        <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-5 w-40 rounded-lg bg-gray-200" />
            <div className="h-12 w-72 rounded-xl bg-gray-200" />

            <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
              <div className="space-y-6">
                <div className="h-[420px] rounded-[28px] bg-white" />
                <div className="h-64 rounded-[28px] bg-white" />
              </div>

              <div className="h-[560px] rounded-[28px] bg-white" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  /*
   * ============================================
   * ПУСТАЯ КОРЗИНА
   * ============================================
   */

  if (products.length === 0) {
    return (
      <main className="min-h-screen bg-[#f5f6f7] text-gray-950">
        <div className="mx-auto flex min-h-[75vh] max-w-3xl items-center px-4 py-12 sm:px-6">
          <div className="w-full rounded-[30px] border border-gray-200 bg-white p-8 text-center shadow-[0_20px_60px_rgba(0,0,0,0.05)] sm:p-14">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-green-50 text-green-600">
              <ShoppingBag size={36} />
            </div>

            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              Корзина пуста
            </h1>

            <p className="mx-auto mt-3 max-w-md text-[15px] leading-6 text-gray-500">
              Добавьте товары в корзину,
              чтобы перейти к оформлению
              заказа.
            </p>

            <Link
              href="/catalog"
              className="mt-8 inline-flex h-13 items-center justify-center gap-2 rounded-2xl bg-green-600 px-7 font-extrabold text-white transition hover:bg-green-700"
            >
              Перейти в каталог
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </main>
    );
  }

  /*
   * ============================================
   * СТРАНИЦА
   * ============================================
   */

  return (
    <main className="min-h-screen bg-[#f5f6f7] text-gray-950">
      <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-10">

        {/* HEADER */}

        <div className="mb-8">
          <Link
            href="/cart"
            className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 transition hover:text-green-600"
          >
            <ArrowLeft size={17} />
            Вернуться в корзину
          </Link>

          <div className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-bold text-green-600">
                <ShoppingBag size={17} />
                Заказ
              </div>

              <h1 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-[44px]">
                Оформление заказа
              </h1>

              <p className="mt-2 text-[15px] text-gray-500">
                Заполните данные — мы свяжемся
                с вами для подтверждения.
              </p>
            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700">
              <Package
                size={17}
                className="text-green-600"
              />
              {totalItems}{" "}
              {getProductsLabel(totalItems)}
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_420px]"
        >
          {/* ======================================
              LEFT
          ====================================== */}

          <div className="space-y-6">

            {/* CONTACT */}

            <section className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.035)] sm:p-8">
              <div className="mb-7 flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-600">
                  <User size={21} />
                </div>

                <div>
                  <h2 className="text-xl font-black tracking-tight">
                    Контактные данные
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Нужны для подтверждения
                    заказа.
                  </p>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-extrabold text-gray-800">
                    Имя и фамилия *
                  </label>

                  <input
                    type="text"
                    value={customerName}
                    onChange={(event) =>
                      setCustomerName(
                        event.target.value
                      )
                    }
                    placeholder="Иван Иванов"
                    className="h-13 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 text-[15px] font-medium outline-none transition placeholder:text-gray-400 focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-extrabold text-gray-800">
                    Телефон *
                  </label>

                  <div className="relative">
                    <Phone
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      type="tel"
                      value={phone}
                      onChange={(event) =>
                        setPhone(
                          event.target.value
                        )
                      }
                      placeholder="+7 (999) 123-45-67"
                      className="h-13 w-full rounded-2xl border border-gray-200 bg-gray-50 pl-11 pr-4 text-[15px] font-medium outline-none transition placeholder:text-gray-400 focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-extrabold text-gray-800">
                    Город *
                  </label>

                  <div className="relative">
                    <MapPin
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      type="text"
                      value={city}
                      onChange={(event) =>
                        setCity(
                          event.target.value
                        )
                      }
                      placeholder="Симферополь"
                      className="h-13 w-full rounded-2xl border border-gray-200 bg-gray-50 pl-11 pr-4 text-[15px] font-medium outline-none transition placeholder:text-gray-400 focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-extrabold text-gray-800">
                    Адрес доставки *
                  </label>

                  <textarea
                    value={address}
                    onChange={(event) =>
                      setAddress(
                        event.target.value
                      )
                    }
                    placeholder="Улица, дом, квартира"
                    rows={3}
                    className="w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 text-[15px] font-medium outline-none transition placeholder:text-gray-400 focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10"
                  />
                </div>
              </div>
            </section>

            {/* CONTACT METHOD */}

            <section className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.035)] sm:p-8">
              <div className="mb-7 flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <MessageCircle size={21} />
                </div>

                <div>
                  <h2 className="text-xl font-black tracking-tight">
                    Способ связи
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Как менеджеру удобнее
                    связаться с вами?
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  {
                    value: "Телефон",
                    label: "Телефон",
                    icon: Phone,
                  },
                  {
                    value: "Telegram",
                    label: "Telegram",
                    icon: MessageCircle,
                  },
                  {
                    value: "WhatsApp",
                    label: "WhatsApp",
                    icon: MessageCircle,
                  },
                ].map((method) => {
                  const Icon = method.icon;
                  const active =
                    contactMethod ===
                    method.value;

                  return (
                    <label
                      key={method.value}
                      className={`relative flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition ${
                        active
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="contactMethod"
                        value={method.value}
                        checked={active}
                        onChange={(event) =>
                          setContactMethod(
                            event.target.value
                          )
                        }
                        className="sr-only"
                      />

                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                          active
                            ? "bg-green-600 text-white"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        <Icon size={17} />
                      </div>

                      <span className="text-sm font-extrabold">
                        {method.label}
                      </span>

                      {active && (
                        <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-white">
                          <Check size={12} />
                        </div>
                      )}
                    </label>
                  );
                })}
              </div>
            </section>

            {/* COMMENT */}

            <section className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.035)] sm:p-8">
              <div className="mb-6">
                <h2 className="text-xl font-black tracking-tight">
                  Комментарий к заказу
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Необязательно
                </p>
              </div>

              <textarea
                value={comment}
                onChange={(event) =>
                  setComment(
                    event.target.value
                  )
                }
                placeholder="Например: позвонить перед доставкой"
                rows={4}
                className="w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 text-[15px] font-medium outline-none transition placeholder:text-gray-400 focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10"
              />
            </section>

          </div>

          {/* ======================================
              RIGHT
          ====================================== */}

          <aside className="lg:sticky lg:top-6">
            <div className="overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-[0_16px_50px_rgba(0,0,0,0.06)]">

              <div className="border-b border-gray-100 px-6 py-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-black">
                    Ваш заказ
                  </h2>

                  <span className="text-sm font-bold text-gray-400">
                    {totalItems}{" "}
                    {getProductsLabel(
                      totalItems
                    )}
                  </span>
                </div>
              </div>

              <div className="max-h-[420px] overflow-y-auto px-6">
                <div className="divide-y divide-gray-100">
                  {products.map((product) => {
                    const quantity =
                      getItemQuantity(
                        cart,
                        product
                      );

                    const itemTotal =
                      product.price *
                      quantity;

                    return (
                      <div
                        key={product.id}
                        className="flex gap-4 py-5"
                      >
                        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-[#f6f7f8]">
                          {product.images?.[0] ? (
                            <img
                              src={
                                product.images[0]
                              }
                              alt={
                                product.name
                              }
                              className="h-full w-full object-contain p-2"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-gray-300">
                              <ShoppingBag size={25} />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="mb-1 text-[11px] font-extrabold uppercase tracking-[0.08em] text-gray-400">
                            {product.brand}
                          </div>

                          <div className="line-clamp-2 text-sm font-extrabold leading-5">
                            {product.name}
                          </div>

                          <div className="mt-2 flex flex-wrap gap-1.5">
                            <span
                              className={`rounded-md border px-1.5 py-0.5 text-[10px] font-extrabold ${getConditionClass(
                                product.condition
                              )}`}
                            >
                              {product.condition}
                            </span>

                            {product.memory && (
                              <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-500">
                                {product.memory}
                              </span>
                            )}
                          </div>

                          <div className="mt-3 flex items-end justify-between gap-3">
                            <span className="text-xs font-bold text-gray-400">
                              × {quantity}
                            </span>

                            <span className="text-sm font-black">
                              {formatPrice(
                                itemTotal
                              )}{" "}
                              ₽
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-gray-100 px-6 py-5">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      Товары
                    </span>

                    <span className="font-bold">
                      {formatPrice(total)} ₽
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-gray-500">
                      <Truck size={16} />
                      Доставка
                    </span>

                    <span className="font-extrabold text-green-600">
                      Бесплатно
                    </span>
                  </div>
                </div>

                <div className="my-5 h-px bg-gray-100" />

                <div className="flex items-end justify-between gap-4">
                  <span className="font-bold text-gray-500">
                    Итого
                  </span>

                  <span className="text-3xl font-black tracking-tight">
                    {formatPrice(total)} ₽
                  </span>
                </div>
              </div>

              <div className="px-6 pb-6">
                {error && (
                  <div className="mb-4 flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
                    <XCircle
                      size={18}
                      className="mt-0.5 shrink-0"
                    />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-green-600 px-5 text-[15px] font-black text-white shadow-lg shadow-green-600/15 transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none"
                >
                  {submitting ? (
                    <>
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Оформляем...
                    </>
                  ) : (
                    <>
                      Оформить заказ
                      <ArrowRight size={19} />
                    </>
                  )}
                </button>

                <div className="mt-4 flex items-start gap-3 rounded-2xl bg-gray-50 p-4">
                  <ShieldCheck
                    size={20}
                    className="mt-0.5 shrink-0 text-green-600"
                  />

                  <p className="text-xs font-medium leading-5 text-gray-500">
                    Ваши данные используются
                    только для обработки
                    заказа и связи с вами.
                  </p>
                </div>
              </div>
            </div>

            {/* FUTURE PAYMENT */}

            <div className="mt-4 rounded-[24px] border border-gray-200 bg-white p-5">
              <div className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-600">
                  <CreditCard size={19} />
                </div>

                <div>
                  <div className="text-sm font-black">
                    Безопасная оплата
                  </div>

                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    Онлайн-оплату подключим
                    на следующем этапе.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </form>
      </div>
    </main>
  );
}