import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import AdminSidebar from "@/components/AdminSidebar";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AdminUserPage({
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
  const userId = Number(id);

  if (!Number.isInteger(userId) || userId <= 0) {
    notFound();
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,

      orders: {
        orderBy: {
          createdAt: "desc",
        },
        include: {
          items: true,
        },
      },

      repairs: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!user) {
    notFound();
  }

  const totalOrders = user.orders.length;

  const totalRepairs = user.repairs.length;

  const totalSpent = user.orders.reduce(
    (sum, order) => sum + order.total,
    0
  );

  const totalProducts = user.orders.reduce(
    (sum, order) =>
      sum +
      order.items.reduce(
        (itemSum, item) => itemSum + item.quantity,
        0
      ),
    0
  );

  const completedOrders = user.orders.filter(
    (order) =>
      order.status === "Завершён" ||
      order.status === "Завершен"
  ).length;

  const activeRepairs = user.repairs.filter(
    (repair) =>
      repair.status !== "Выдан" &&
      repair.status !== "Отменена"
  ).length;

  const formatPrice = (price: number) =>
    `${price.toLocaleString("ru-RU")} ₽`;

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(date);

  const formatDateTime = (date: Date) =>
    new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);

  return (
    <div className="flex min-h-screen bg-[#f5f6f7] text-gray-900">

      <AdminSidebar />

      <main className="min-w-0 flex-1">

        {/* HEADER */}

        <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/90 backdrop-blur">

          <div className="flex items-center justify-between gap-4 px-6 py-4 lg:px-8">

            <div>

              <p className="text-xs font-bold uppercase tracking-[0.16em] text-green-600">
                TECHSTORE ADMIN
              </p>

              <h1 className="mt-1 text-xl font-black">
                Профиль клиента
              </h1>

            </div>

            <Link
              href="/admin/users"
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
              ← Все пользователи
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
              href="/admin/users"
              className="font-bold text-gray-400 transition hover:text-green-600"
            >
              Пользователи
            </Link>

            <span className="text-gray-300">
              /
            </span>

            <span className="font-bold text-gray-700">
              {user.name}
            </span>

          </div>

          {/* HERO */}

          <section className="relative overflow-hidden rounded-3xl bg-[#0b0f0d] p-7 text-white shadow-xl lg:p-9">

            <div className="relative z-10">

              <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">

                <div className="flex min-w-0 items-center gap-5">

                  <div className="
                    flex
                    h-20
                    w-20
                    shrink-0
                    items-center
                    justify-center
                    rounded-3xl
                    bg-green-500
                    text-3xl
                    font-black
                    text-black
                    shadow-lg
                    shadow-green-500/10
                  ">
                    {user.name
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div className="min-w-0">

                    <div className="flex flex-wrap items-center gap-3">

                      <h2 className="truncate text-3xl font-black tracking-tight">
                        {user.name}
                      </h2>

                      <span
                        className={`
                          inline-flex
                          items-center
                          rounded-full
                          border
                          px-3
                          py-1.5
                          text-xs
                          font-black
                          ${
                            user.role === "ADMIN"
                              ? "border-green-400/20 bg-green-400/10 text-green-400"
                              : "border-white/10 bg-white/5 text-gray-300"
                          }
                        `}
                      >
                        {user.role === "ADMIN"
                          ? "👑 Администратор"
                          : "👤 Клиент"}
                      </span>

                    </div>

                    <div className="mt-2 break-all text-sm text-gray-400">
                      {user.email}
                    </div>

                    <div className="mt-1 text-sm text-gray-500">
                      {user.phone ||
                        "Телефон не указан"}
                    </div>

                  </div>

                </div>

                <div className="shrink-0">

                  <div className="text-xs font-black uppercase tracking-[0.16em] text-gray-500">
                    Клиент
                  </div>

                  <div className="mt-1 text-2xl font-black text-white">
                    #{user.id}
                  </div>

                </div>

              </div>

              <div className="mt-7 grid gap-3 border-t border-white/10 pt-6 sm:grid-cols-3">

                <HeroInfo
                  label="Регистрация"
                  value={formatDate(user.createdAt)}
                />

                <HeroInfo
                  label="Заказов"
                  value={String(totalOrders)}
                />

                <HeroInfo
                  label="Покупки"
                  value={formatPrice(totalSpent)}
                />

              </div>

            </div>

            <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-green-500/10 blur-3xl" />

            <div className="pointer-events-none absolute -bottom-40 right-20 h-72 w-72 rounded-full bg-green-400/10 blur-3xl" />

          </section>

          {/* STATISTICS */}

          <section className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

            <StatCard
              icon="🛒"
              label="Заказы"
              value={totalOrders}
              description="Всего заказов"
            />

            <StatCard
              icon="📦"
              label="Товары"
              value={totalProducts}
              description="Единиц товара"
            />

            <StatCard
              icon="💰"
              label="Покупки"
              value={formatPrice(totalSpent)}
              description="Общая сумма заказов"
              wideValue
            />

            <StatCard
              icon="🔧"
              label="Ремонты"
              value={totalRepairs}
              description="Заявок на ремонт"
            />

          </section>

          {/* ADDITIONAL STATS */}

          <section className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">

            <MiniStat
              icon="✓"
              title="Завершённые заказы"
              value={completedOrders}
              description="Заказов успешно завершено"
            />

            <MiniStat
              icon="⚙"
              title="Активные ремонты"
              value={activeRepairs}
              description="Заявок сейчас в работе"
            />

          </section>

          {/* PERSONAL INFORMATION */}

          <section className="mt-7 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">

            <div className="border-b border-gray-100 px-6 py-5 lg:px-7">

              <div className="flex items-center gap-4">

                <div className="
                  flex
                  h-11
                  w-11
                  items-center
                  justify-center
                  rounded-xl
                  bg-black
                  text-lg
                  text-green-400
                ">
                  👤
                </div>

                <div>

                  <h3 className="font-black text-gray-900">
                    Личные данные
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    Основная информация о клиенте
                  </p>

                </div>

              </div>

            </div>

            <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-3 lg:p-7">

              <InfoCard
                label="Имя"
                value={user.name}
              />

              <InfoCard
                label="Email"
                value={user.email}
              />

              <InfoCard
                label="Телефон"
                value={
                  user.phone || "Не указан"
                }
              />

              <InfoCard
                label="Роль"
                value={
                  user.role === "ADMIN"
                    ? "Администратор"
                    : "Клиент"
                }
              />

              <InfoCard
                label="ID пользователя"
                value={`#${user.id}`}
              />

              <InfoCard
                label="Дата регистрации"
                value={formatDate(user.createdAt)}
              />

            </div>

          </section>

          {/* ORDERS */}

          <section className="mt-7 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">

            <SectionHeader
              icon="🛒"
              title="История заказов"
              description="Все заказы этого клиента"
              count={`${totalOrders} заказов`}
            />

            {user.orders.length === 0 ? (

              <EmptyState
                icon="🛒"
                title="Заказов пока нет"
                text="Этот пользователь ещё ничего не покупал."
              />

            ) : (

              <div className="divide-y divide-gray-100">

                {user.orders.map((order) => (

                  <div
                    key={order.id}
                    className="group p-6 transition hover:bg-gray-50 lg:p-7"
                  >

                    <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">

                      <div className="min-w-0 flex-1">

                        <div className="flex flex-wrap items-center gap-3">

                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-lg">
                            🛒
                          </div>

                          <div>

                            <div className="font-black text-gray-900">
                              Заказ #{order.id}
                            </div>

                            <div className="mt-0.5 text-xs text-gray-400">
                              {formatDateTime(
                                order.createdAt
                              )}
                            </div>

                          </div>

                          <OrderStatus
                            status={order.status}
                          />

                        </div>

                        <div className="mt-5 flex flex-wrap gap-2">

                          {order.items.map(
                            (item) => (

                              <span
                                key={item.id}
                                className="
                                  rounded-xl
                                  border
                                  border-gray-200
                                  bg-gray-50
                                  px-3
                                  py-2
                                  text-xs
                                  font-bold
                                  text-gray-700
                                "
                              >
                                {item.productName}

                                {item.quantity > 1 &&
                                  ` × ${item.quantity}`}
                              </span>

                            )
                          )}

                        </div>

                      </div>

                      <div className="flex items-center justify-between gap-6 border-t border-gray-100 pt-5 xl:min-w-[220px] xl:border-t-0 xl:pt-0 xl:text-right">

                        <div>

                          <div className="text-xs font-black uppercase tracking-wider text-gray-400">
                            Сумма заказа
                          </div>

                          <div className="mt-1 text-2xl font-black text-gray-900">
                            {formatPrice(
                              order.total
                            )}
                          </div>

                        </div>

                        <div className="text-right">

                          <div className="text-xs font-bold text-gray-400">
                            Позиции
                          </div>

                          <div className="mt-1 text-lg font-black text-gray-700">
                            {order.items.length}
                          </div>

                        </div>

                      </div>

                    </div>

                  </div>

                ))}

              </div>

            )}

          </section>

          {/* REPAIRS */}

          <section className="mt-7 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">

            <SectionHeader
              icon="🔧"
              title="История ремонтов"
              description="Все заявки клиента на ремонт"
              count={`${totalRepairs} заявок`}
            />

            {user.repairs.length === 0 ? (

              <EmptyState
                icon="🔧"
                title="Ремонтов пока нет"
                text="Этот пользователь ещё не создавал заявки на ремонт."
              />

            ) : (

              <div className="divide-y divide-gray-100">

                {user.repairs.map((repair) => (

                  <div
                    key={repair.id}
                    className="group p-6 transition hover:bg-gray-50 lg:p-7"
                  >

                    <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">

                      <div className="min-w-0 flex-1">

                        <div className="flex flex-wrap items-center gap-3">

                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-lg">
                            🔧
                          </div>

                          <div>

                            <div className="font-black text-gray-900">
                              Ремонт #{repair.id}
                            </div>

                            <div className="mt-0.5 text-xs text-gray-400">
                              {formatDateTime(
                                repair.createdAt
                              )}
                            </div>

                          </div>

                          <RepairStatus
                            status={repair.status}
                          />

                        </div>

                        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

                          <Detail
                            label="Устройство"
                            value={repair.deviceType}
                          />

                          <Detail
                            label="Бренд"
                            value={
                              repair.brand ||
                              "Не указан"
                            }
                          />

                          <Detail
                            label="Модель"
                            value={
                              repair.model ||
                              "Не указана"
                            }
                          />

                          <Detail
                            label="Проблема"
                            value={repair.problem}
                          />

                        </div>

                        {repair.description && (

                          <div className="mt-3 rounded-2xl border border-gray-100 bg-gray-50 p-4">

                            <div className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">
                              Дополнительное описание
                            </div>

                            <div className="mt-2 text-sm leading-6 text-gray-700">
                              {repair.description}
                            </div>

                          </div>

                        )}

                      </div>

                      {repair.price !== null && (

                        <div className="shrink-0 rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 xl:min-w-[170px] xl:text-right">

                          <div className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">
                            Стоимость
                          </div>

                          <div className="mt-1 text-xl font-black text-gray-900">
                            {formatPrice(
                              repair.price
                            )}
                          </div>

                        </div>

                      )}

                    </div>

                  </div>

                ))}

              </div>

            )}

          </section>

          {/* FOOTER ACTIONS */}

          <section className="mt-7 flex flex-col gap-4 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between lg:p-7">

            <div>

              <div className="font-black text-gray-900">
                Клиент #{user.id}
              </div>

              <div className="mt-1 text-sm text-gray-500">
                Зарегистрирован{" "}
                {formatDate(user.createdAt)}
              </div>

            </div>

            <div className="flex flex-wrap gap-3">

              <Link
                href="/admin/users"
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
                ← Пользователи
              </Link>

              <Link
                href="/admin/orders"
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
                Все заказы →
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
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">

      <div className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-500">
        {label}
      </div>

      <div className="mt-1 truncate text-sm font-black text-white">
        {value}
      </div>

    </div>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  icon,
  label,
  value,
  description,
  wideValue = false,
}: {
  icon: string;
  label: string;
  value: number | string;
  description: string;
  wideValue?: boolean;
}) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">

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

        <div className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">
          {label}
        </div>

      </div>

      <div
        className={`
          mt-5
          font-black
          text-gray-900
          ${
            wideValue
              ? "text-2xl"
              : "text-3xl"
          }
        `}
      >
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
   MINI STAT
========================================================= */

function MiniStat({
  icon,
  title,
  value,
  description,
}: {
  icon: string;
  title: string;
  value: number;
  description: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

      <div className="
        flex
        h-11
        w-11
        shrink-0
        items-center
        justify-center
        rounded-xl
        bg-green-50
        text-lg
        font-black
        text-green-600
      ">
        {icon}
      </div>

      <div className="min-w-0 flex-1">

        <div className="text-sm font-black text-gray-900">
          {title}
        </div>

        <div className="mt-1 text-xs text-gray-500">
          {description}
        </div>

      </div>

      <div className="text-2xl font-black text-gray-900">
        {value}
      </div>

    </div>
  );
}

/* =========================================================
   INFO CARD
========================================================= */

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">

      <div className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">
        {label}
      </div>

      <div className="mt-2 break-words text-sm font-bold text-gray-900">
        {value}
      </div>

    </div>
  );
}

/* =========================================================
   SECTION HEADER
========================================================= */

function SectionHeader({
  icon,
  title,
  description,
  count,
}: {
  icon: string;
  title: string;
  description: string;
  count: string;
}) {
  return (
    <div className="flex flex-col justify-between gap-4 border-b border-gray-100 px-6 py-5 md:flex-row md:items-center lg:px-7">

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
          {icon}
        </div>

        <div>

          <h3 className="font-black text-gray-900">
            {title}
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            {description}
          </p>

        </div>

      </div>

      <div className="w-fit rounded-full bg-gray-100 px-4 py-2 text-xs font-black text-gray-600">
        {count}
      </div>

    </div>
  );
}

/* =========================================================
   ORDER STATUS
========================================================= */

function OrderStatus({
  status,
}: {
  status: string;
}) {
  const styles: Record<string, string> = {
    Новый:
      "border-blue-200 bg-blue-50 text-blue-700",

    Подтверждён:
      "border-indigo-200 bg-indigo-50 text-indigo-700",

    Подтвержден:
      "border-indigo-200 bg-indigo-50 text-indigo-700",

    "В обработке":
      "border-yellow-200 bg-yellow-50 text-yellow-700",

    Доставляется:
      "border-purple-200 bg-purple-50 text-purple-700",

    Завершён:
      "border-green-200 bg-green-50 text-green-700",

    Завершен:
      "border-green-200 bg-green-50 text-green-700",

    Отменён:
      "border-red-200 bg-red-50 text-red-700",

    Отменен:
      "border-red-200 bg-red-50 text-red-700",
  };

  return (
    <span
      className={`
        inline-flex
        rounded-full
        border
        px-3
        py-1.5
        text-xs
        font-black
        ${
          styles[status] ??
          "border-gray-200 bg-gray-50 text-gray-700"
        }
      `}
    >
      {status}
    </span>
  );
}

/* =========================================================
   REPAIR STATUS
========================================================= */

function RepairStatus({
  status,
}: {
  status: string;
}) {
  const styles: Record<string, string> = {
    Новая:
      "border-blue-200 bg-blue-50 text-blue-700",

    Диагностика:
      "border-yellow-200 bg-yellow-50 text-yellow-700",

    Ремонт:
      "border-purple-200 bg-purple-50 text-purple-700",

    Готов:
      "border-green-200 bg-green-50 text-green-700",

    Выдан:
      "border-gray-200 bg-gray-100 text-gray-700",

    Отменена:
      "border-red-200 bg-red-50 text-red-700",
  };

  return (
    <span
      className={`
        inline-flex
        rounded-full
        border
        px-3
        py-1.5
        text-xs
        font-black
        ${
          styles[status] ??
          "border-gray-200 bg-gray-50 text-gray-700"
        }
      `}
    >
      {status}
    </span>
  );
}

/* =========================================================
   DETAIL
========================================================= */

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">

      <div className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">
        {label}
      </div>

      <div className="mt-1.5 line-clamp-2 text-sm font-bold text-gray-900">
        {value}
      </div>

    </div>
  );
}

/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyState({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div className="px-6 py-20 text-center lg:px-7">

      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-3xl">
        {icon}
      </div>

      <div className="mt-5 text-lg font-black text-gray-900">
        {title}
      </div>

      <div className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
        {text}
      </div>

    </div>
  );
}