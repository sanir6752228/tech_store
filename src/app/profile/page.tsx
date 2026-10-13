import Link from "next/link";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";

export const dynamic = "force-dynamic";

function formatPrice(price: number) {
  return new Intl.NumberFormat("ru-RU").format(price) + " ₽";
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function getOrderStatusClass(status: string) {
  switch (status) {
    case "Выполнен":
    case "Доставлен":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    case "Отменён":
    case "Отменен":
      return "bg-red-50 text-red-700 border-red-200";

    case "Передан в доставку":
      return "bg-blue-50 text-blue-700 border-blue-200";

    case "Собирается":
    case "В обработке":
      return "bg-amber-50 text-amber-700 border-amber-200";

    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

function getRepairStatusClass(status: string) {
  switch (status) {
    case "Готов":
    case "Выдан":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    case "Отменена":
      return "bg-red-50 text-red-700 border-red-200";

    case "Ремонт":
      return "bg-blue-50 text-blue-700 border-blue-200";

    case "Диагностика":
      return "bg-amber-50 text-amber-700 border-amber-200";

    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const [orders, repairs] = await Promise.all([
    prisma.order.findMany({
      where: {
        userId: user.id,
      },
      include: {
        items: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    }),

    prisma.repair.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    }),
  ]);

  const totalOrders = orders.length;
  const totalRepairs = repairs.length;

  const completedOrders = orders.filter(
    (order) =>
      order.status === "Выполнен" ||
      order.status === "Доставлен"
  ).length;

  const activeRepairs = repairs.filter(
    (repair) =>
      repair.status !== "Выдан" &&
      repair.status !== "Отменена"
  ).length;

  return (
    <main className="min-h-screen bg-[#f5f6f7] text-gray-900">

      {/* HEADER */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

          <Link
            href="/"
            className="group flex items-center gap-3"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-600 text-xl font-black text-white shadow-sm">
              T
            </div>

            <div>
              <div className="text-xl font-black tracking-tight">
                TECH<span className="text-green-600">STORE</span>
              </div>

              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                Техника • Продажа • Ремонт
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/catalog"
              className="hidden rounded-xl px-4 py-2.5 text-sm font-bold text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 sm:block"
            >
              Каталог
            </Link>

            <Link
              href="/repair"
              className="hidden rounded-xl px-4 py-2.5 text-sm font-bold text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 sm:block"
            >
              Ремонт
            </Link>

            <Link
              href="/"
              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 transition hover:border-green-300 hover:text-green-700"
            >
              В магазин
            </Link>
          </div>

        </div>
      </header>

      {/* MAIN */}
      <div className="mx-auto max-w-7xl px-6 py-8 md:py-10">

        {/* PROFILE HERO */}
        <section className="overflow-hidden rounded-[28px] bg-[#111827] shadow-xl">

          <div className="relative p-6 md:p-9">

            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-green-500/20 blur-3xl" />
            <div className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-green-400/10 blur-3xl" />

            <div className="relative flex flex-col gap-7 md:flex-row md:items-center md:justify-between">

              <div className="flex items-center gap-5">

                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[24px] bg-green-500 text-3xl font-black text-white shadow-lg shadow-green-500/20">
                  {user.name?.charAt(0)?.toUpperCase() || "U"}
                </div>

                <div>
                  <div className="mb-1 text-sm font-bold uppercase tracking-[0.16em] text-green-400">
                    Личный кабинет
                  </div>

                  <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">
                    Привет, {user.name} 👋
                  </h1>

                  <p className="mt-2 text-sm text-gray-400">
                    Здесь собраны ваши заказы, ремонты и данные аккаунта.
                  </p>
                </div>

              </div>

              <LogoutButton />

            </div>

          </div>
        </section>

        {/* STATISTICS */}
        <section className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-2xl">🛍️</span>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Всего
              </span>
            </div>

            <div className="mt-4 text-3xl font-black">
              {totalOrders}
            </div>

            <div className="mt-1 text-sm text-gray-500">
              заказов
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-2xl">✓</span>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Завершено
              </span>
            </div>

            <div className="mt-4 text-3xl font-black">
              {completedOrders}
            </div>

            <div className="mt-1 text-sm text-gray-500">
              покупок
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-2xl">🔧</span>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Всего
              </span>
            </div>

            <div className="mt-4 text-3xl font-black">
              {totalRepairs}
            </div>

            <div className="mt-1 text-sm text-gray-500">
              обращений
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-2xl">⚙️</span>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Сейчас
              </span>
            </div>

            <div className="mt-4 text-3xl font-black">
              {activeRepairs}
            </div>

            <div className="mt-1 text-sm text-gray-500">
              ремонтов в работе
            </div>
          </div>

        </section>

        {/* QUICK ACTIONS */}
        <section className="mt-8">

          <div className="mb-4">
            <h2 className="text-2xl font-black tracking-tight">
              Быстрый доступ
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Всё необходимое в одном месте
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <Link
              href="/catalog"
              className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-green-300 hover:shadow-lg"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-2xl transition group-hover:bg-green-100">
                🛍️
              </div>

              <h3 className="mt-5 font-black">
                Перейти в каталог
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Телефоны, планшеты и аксессуары
              </p>

              <div className="mt-4 text-sm font-bold text-green-600">
                Смотреть товары →
              </div>
            </Link>

            <Link
              href="/repair"
              className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-green-300 hover:shadow-lg"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-2xl transition group-hover:bg-green-50">
                🔧
              </div>

              <h3 className="mt-5 font-black">
                Заказать ремонт
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Оставьте заявку на ремонт техники
              </p>

              <div className="mt-4 text-sm font-bold text-green-600">
                Оставить заявку →
              </div>
            </Link>

            <Link
              href="/favorites"
              className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-green-300 hover:shadow-lg"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-2xl transition group-hover:bg-red-100">
                ❤️
              </div>

              <h3 className="mt-5 font-black">
                Избранное
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Сохранённые товары
              </p>

              <div className="mt-4 text-sm font-bold text-green-600">
                Открыть избранное →
              </div>
            </Link>

            <Link
              href="/cart"
              className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-green-300 hover:shadow-lg"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-2xl transition group-hover:bg-green-100">
                🛒
              </div>

              <h3 className="mt-5 font-black">
                Корзина
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Товары, которые вы выбрали
              </p>

              <div className="mt-4 text-sm font-bold text-green-600">
                Открыть корзину →
              </div>
            </Link>

          </div>
        </section>

        {/* PERSONAL DATA */}
        <section className="mt-10">

          <div className="mb-4">
            <h2 className="text-2xl font-black tracking-tight">
              Личные данные
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Информация вашего аккаунта
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">

            <div className="grid gap-5 md:grid-cols-3">

              <div className="rounded-2xl bg-gray-50 p-5">
                <div className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Имя
                </div>

                <div className="mt-2 font-bold text-gray-900">
                  {user.name}
                </div>
              </div>

              <div className="rounded-2xl bg-gray-50 p-5">
                <div className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Email
                </div>

                <div className="mt-2 break-all font-bold text-gray-900">
                  {user.email}
                </div>
              </div>

              <div className="rounded-2xl bg-gray-50 p-5">
                <div className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Телефон
                </div>

                <div className="mt-2 font-bold text-gray-900">
                  {user.phone || "Не указан"}
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* ORDERS */}
        <section className="mt-10">

          <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">

            <div>
              <h2 className="text-2xl font-black tracking-tight">
                Мои заказы
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                История ваших покупок
              </p>
            </div>

            {orders.length > 0 && (
              <span className="text-sm font-bold text-gray-400">
                Последние {orders.length}
              </span>
            )}

          </div>

          {orders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-3xl">
                🛍️
              </div>

              <h3 className="mt-5 text-xl font-black">
                У вас пока нет заказов
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
                Самое время выбрать что-нибудь в каталоге.
              </p>

              <Link
                href="/catalog"
                className="mt-6 inline-flex rounded-xl bg-green-600 px-6 py-3 text-sm font-black text-white shadow-sm transition hover:bg-green-700"
              >
                Перейти в каталог
              </Link>

            </div>
          ) : (
            <div className="space-y-4">

              {orders.map((order) => (

                <article
                  key={order.id}
                  className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
                >

                  <div className="flex flex-col gap-4 border-b border-gray-100 p-5 md:flex-row md:items-center md:justify-between">

                    <div>
                      <div className="flex flex-wrap items-center gap-3">

                        <h3 className="text-lg font-black">
                          Заказ #{order.id}
                        </h3>

                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-bold ${getOrderStatusClass(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>

                      </div>

                      <p className="mt-1 text-sm text-gray-500">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>

                    <div className="text-left md:text-right">

                      <div className="text-xs font-bold uppercase tracking-wider text-gray-400">
                        Сумма
                      </div>

                      <div className="mt-1 text-xl font-black">
                        {formatPrice(order.total)}
                      </div>

                    </div>

                  </div>

                  <div className="p-5">

                    <div className="space-y-3">

                      {order.items.map((item) => (

                        <div
                          key={item.id}
                          className="flex items-center justify-between gap-4 rounded-xl bg-gray-50 p-4"
                        >

                          <div className="min-w-0">

                            <div className="truncate font-bold text-gray-900">
                              {item.productName}
                            </div>

                            <div className="mt-1 text-sm text-gray-500">
                              {item.quantity} шт. × {formatPrice(item.price)}
                            </div>

                          </div>

                          <div className="shrink-0 font-black">
                            {formatPrice(item.price * item.quantity)}
                          </div>

                        </div>

                      ))}

                    </div>

                  </div>

                </article>

              ))}

            </div>
          )}

        </section>

        {/* REPAIRS */}
        <section className="mt-10">

          <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">

            <div>
              <h2 className="text-2xl font-black tracking-tight">
                Мои ремонты
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Заявки на ремонт вашей техники
              </p>
            </div>

            {repairs.length > 0 && (
              <span className="text-sm font-bold text-gray-400">
                Последние {repairs.length}
              </span>
            )}

          </div>

          {repairs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-3xl">
                🔧
              </div>

              <h3 className="mt-5 text-xl font-black">
                Заявок на ремонт пока нет
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
                Если с техникой что-то случилось, оставьте заявку — мы свяжемся с вами.
              </p>

              <Link
                href="/repair"
                className="mt-6 inline-flex rounded-xl bg-green-600 px-6 py-3 text-sm font-black text-white shadow-sm transition hover:bg-green-700"
              >
                Оставить заявку
              </Link>

            </div>
          ) : (
            <div className="space-y-4">

              {repairs.map((repair) => (

                <article
                  key={repair.id}
                  className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                >

                  <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">

                    <div className="flex gap-4">

                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gray-100 text-2xl">
                        🔧
                      </div>

                      <div>

                        <div className="flex flex-wrap items-center gap-3">

                          <h3 className="text-lg font-black">
                            Ремонт #{repair.id}
                          </h3>

                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-bold ${getRepairStatusClass(
                              repair.status
                            )}`}
                          >
                            {repair.status}
                          </span>

                        </div>

                        <div className="mt-2 text-sm font-bold text-gray-700">
                          {repair.deviceType}
                          {repair.brand ? ` • ${repair.brand}` : ""}
                          {repair.model ? ` ${repair.model}` : ""}
                        </div>

                        <div className="mt-1 text-sm text-gray-500">
                          Заявка от {formatDate(repair.createdAt)}
                        </div>

                      </div>

                    </div>

                    <div className="md:text-right">

                      <div className="text-xs font-bold uppercase tracking-wider text-gray-400">
                        Стоимость
                      </div>

                      <div className="mt-1 text-lg font-black">
                        {repair.price
                          ? formatPrice(repair.price)
                          : "Уточняется"}
                      </div>

                    </div>

                  </div>

                  <div className="mt-5 rounded-2xl bg-gray-50 p-5">

                    <div className="text-xs font-bold uppercase tracking-wider text-gray-400">
                      Проблема
                    </div>

                    <p className="mt-2 text-sm font-semibold leading-6 text-gray-700">
                      {repair.problem}
                    </p>

                    {repair.description && (
                      <>
                        <div className="mt-4 text-xs font-bold uppercase tracking-wider text-gray-400">
                          Дополнительная информация
                        </div>

                        <p className="mt-2 text-sm leading-6 text-gray-600">
                          {repair.description}
                        </p>
                      </>
                    )}

                  </div>

                  {repair.adminComment && (
                    <div className="mt-4 rounded-2xl border border-green-100 bg-green-50 p-5">

                      <div className="flex items-center gap-2 text-sm font-black text-green-800">
                        💬 Комментарий мастера
                      </div>

                      <p className="mt-2 text-sm leading-6 text-green-900">
                        {repair.adminComment}
                      </p>

                    </div>
                  )}

                </article>

              ))}

            </div>
          )}

        </section>

        {/* BOTTOM CTA */}
        <section className="mt-10 overflow-hidden rounded-[28px] bg-green-600 p-7 shadow-xl md:p-9">

          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

            <div>
              <div className="text-sm font-black uppercase tracking-[0.16em] text-green-100">
                TECHSTORE
              </div>

              <h2 className="mt-2 text-2xl font-black text-white md:text-3xl">
                Нужна техника или помощь с ремонтом?
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-green-50">
                Выберите товар в каталоге или оставьте заявку — мы поможем подобрать решение.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">

              <Link
                href="/catalog"
                className="rounded-xl bg-white px-6 py-3.5 text-center text-sm font-black text-gray-900 transition hover:bg-gray-100"
              >
                Открыть каталог
              </Link>

              <Link
                href="/repair"
                className="rounded-xl border border-white/30 bg-green-700 px-6 py-3.5 text-center text-sm font-black text-white transition hover:bg-green-800"
              >
                Ремонт техники
              </Link>

            </div>

          </div>

        </section>

        {/* FOOTER */}
        <div className="mt-10 border-t border-gray-200 pt-6 text-center text-xs font-semibold text-gray-400">
          TECHSTORE • Техника • Продажа • Ремонт
        </div>

      </div>
    </main>
  );
}