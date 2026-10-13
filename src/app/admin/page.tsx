import Link from "next/link";
import { redirect } from "next/navigation";

import AdminSidebar from "@/components/AdminSidebar";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

function formatPrice(value: number) {
  return `${new Intl.NumberFormat("ru-RU").format(value)} ₽`;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function orderStatusClass(status: string) {
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

function repairStatusClass(status: string) {
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

function importStatusClass(status: string) {
  switch (status) {
    case "APPROVED":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    case "REJECTED":
      return "bg-red-50 text-red-700 border-red-200";

    case "PENDING":
      return "bg-amber-50 text-amber-700 border-amber-200";

    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

function importStatusLabel(status: string) {
  switch (status) {
    case "APPROVED":
      return "Опубликован";

    case "REJECTED":
      return "Отклонён";

    case "PENDING":
      return "На проверке";

    default:
      return status;
  }
}

export default async function AdminPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  if (currentUser.role !== "ADMIN") {
    redirect("/");
  }

  const [
    productsCount,
    usersCount,
    ordersCount,
    repairsCount,

    importsCount,
    pendingImportsCount,
    approvedImportsCount,

    incomeResult,

    recentOrders,
    recentRepairs,
    recentImports,

    newOrdersCount,
    newRepairsCount,
  ] = await Promise.all([
    prisma.product.count(),

    prisma.user.count(),

    prisma.order.count(),

    prisma.repair.count(),

    // ВСЕ ИМПОРТЫ
    prisma.productDraft.count(),

    // ИМПОРТЫ НА ПРОВЕРКЕ
    prisma.productDraft.count({
      where: {
        status: "PENDING",
      },
    }),

    // ОПУБЛИКОВАННЫЕ ИМПОРТЫ
    prisma.productDraft.count({
      where: {
        status: "APPROVED",
      },
    }),

    // ОБОРОТ
    prisma.order.aggregate({
      _sum: {
        total: true,
      },
      where: {
        status: {
          not: "Отменён",
        },
      },
    }),

    // ПОСЛЕДНИЕ ЗАКАЗЫ
    prisma.order.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 6,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: true,
      },
    }),

    // ПОСЛЕДНИЕ РЕМОНТЫ
    prisma.repair.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 6,
    }),

    // ПОСЛЕДНИЕ ИМПОРТЫ
    prisma.productDraft.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    }),

    // НОВЫЕ ЗАКАЗЫ
    prisma.order.count({
      where: {
        status: "Новый",
      },
    }),

    // НОВЫЕ РЕМОНТЫ
    prisma.repair.count({
      where: {
        status: "Новая",
      },
    }),
  ]);

  const income = incomeResult._sum.total || 0;

  return (
    <div className="flex min-h-screen bg-[#f5f6f7] text-gray-900">
      <AdminSidebar />

      <main className="min-w-0 flex-1">
        {/* TOP BAR */}
        <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/90 backdrop-blur">
          <div className="flex items-center justify-between px-6 py-4 lg:px-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-green-600">
                TECHSTORE ADMIN
              </p>

              <h1 className="mt-1 text-xl font-black">
                Панель управления
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <div className="text-sm font-black">
                  {currentUser.name}
                </div>

                <div className="text-xs text-gray-400">
                  Администратор
                </div>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-900 text-sm font-black text-white">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <div className="p-6 lg:p-8">
          {/* WELCOME */}
          <section className="overflow-hidden rounded-[28px] bg-gray-900 p-7 text-white shadow-xl lg:p-9">
            <div className="relative">
              <div className="absolute -right-20 -top-32 h-80 w-80 rounded-full bg-green-500/20 blur-3xl" />

              <div className="relative max-w-3xl">
                <div className="text-sm font-bold uppercase tracking-[0.18em] text-green-400">
                  Добро пожаловать
                </div>

                <h2 className="mt-3 text-3xl font-black tracking-tight lg:text-4xl">
                  Управляйте магазином
                  <br />
                  из одного места.
                </h2>

                <p className="mt-4 max-w-2xl text-sm leading-6 text-gray-400">
                  Товары, заказы, ремонты, импорты и пользователи —
                  всё под контролем в одной административной панели.
                </p>
              </div>
            </div>
          </section>

          {/* STATS */}
          <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            <StatCard
              icon="📦"
              title="Товары"
              value={productsCount.toLocaleString("ru-RU")}
              href="/admin/products"
            />

            <StatCard
              icon="🛒"
              title="Заказы"
              value={ordersCount.toLocaleString("ru-RU")}
              badge={
                newOrdersCount > 0
                  ? `${newOrdersCount} новых`
                  : undefined
              }
              href="/admin/orders"
            />

            <StatCard
              icon="🔧"
              title="Ремонты"
              value={repairsCount.toLocaleString("ru-RU")}
              badge={
                newRepairsCount > 0
                  ? `${newRepairsCount} новых`
                  : undefined
              }
              href="/admin/repairs"
            />

            <StatCard
              icon="📥"
              title="Импорты"
              value={importsCount.toLocaleString("ru-RU")}
              badge={
                pendingImportsCount > 0
                  ? `${pendingImportsCount} на проверке`
                  : "Всё обработано"
              }
              href="/admin/imports"
            />

            <StatCard
              icon="👥"
              title="Пользователи"
              value={usersCount.toLocaleString("ru-RU")}
              href="/admin/users"
            />

            <StatCard
              icon="₽"
              title="Оборот"
              value={formatPrice(income)}
            />
          </section>

          {/* IMPORT SUMMARY */}
          <section className="mt-8 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-gray-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-black">
                  Импорты товаров
                </h2>

                <p className="mt-1 text-xs text-gray-400">
                  Товары, полученные из Telegram и других источников
                </p>
              </div>

              <Link
                href="/admin/imports"
                className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-green-600"
              >
                Открыть импорты →
              </Link>
            </div>

            <div className="grid border-b border-gray-100 sm:grid-cols-3">
              <ImportStat
                label="Всего импортов"
                value={importsCount}
              />

              <ImportStat
                label="На проверке"
                value={pendingImportsCount}
                highlight={pendingImportsCount > 0}
              />

              <ImportStat
                label="Опубликовано"
                value={approvedImportsCount}
              />
            </div>

            {recentImports.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {recentImports.map((draft) => (
                  <Link
                    key={draft.id}
                    href="/admin/imports"
                    className="flex items-center justify-between gap-4 px-6 py-4 transition hover:bg-gray-50"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-xl">
                        📱
                      </div>

                      <div className="min-w-0">
                        <div className="truncate font-black">
                          {draft.name}
                        </div>

                        <div className="mt-1 text-xs text-gray-400">
                          Импорт #{draft.id}
                          {draft.brand
                            ? ` • ${draft.brand}`
                            : ""}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0">
                      <span
                        className={`rounded-full border px-3 py-1.5 text-[11px] font-bold ${importStatusClass(
                          draft.status
                        )}`}
                      >
                        {importStatusLabel(draft.status)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="text-3xl">📥</div>

                <div className="mt-3 font-black">
                  Импортов пока нет
                </div>

                <p className="mt-1 text-sm text-gray-400">
                  Когда появятся новые товары, они будут отображаться здесь.
                </p>
              </div>
            )}
          </section>

          {/* QUICK ACTIONS */}
          <section className="mt-8">
            <div className="mb-4">
              <h2 className="text-xl font-black">
                Быстрые действия
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Часто используемые разделы
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <QuickAction
                href="/admin/products"
                icon="📦"
                title="Управление товарами"
                description="Добавление, редактирование и остатки"
              />

              <QuickAction
                href="/admin/orders"
                icon="🛒"
                title="Заказы"
                description={
                  newOrdersCount > 0
                    ? `${newOrdersCount} новых заказа требуют внимания`
                    : "Новых заказов сейчас нет"
                }
              />

              <QuickAction
                href="/admin/repairs"
                icon="🔧"
                title="Заявки на ремонт"
                description={
                  newRepairsCount > 0
                    ? `${newRepairsCount} новых заявки`
                    : "Новых заявок сейчас нет"
                }
              />

              <QuickAction
                href="/admin/imports"
                icon="📥"
                title="Импорты"
                description={
                  pendingImportsCount > 0
                    ? `${pendingImportsCount} импортов требуют проверки`
                    : "Новых импортов на проверке нет"
                }
              />
            </div>
          </section>

          {/* TWO COLUMNS */}
          <section className="mt-8 grid gap-6 xl:grid-cols-2">
            {/* ORDERS */}
            <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
                <div>
                  <h2 className="font-black">
                    Последние заказы
                  </h2>

                  <p className="mt-1 text-xs text-gray-400">
                    Последние операции магазина
                  </p>
                </div>

                <Link
                  href="/admin/orders"
                  className="text-sm font-bold text-green-600 hover:text-green-700"
                >
                  Все заказы →
                </Link>
              </div>

              <div className="divide-y divide-gray-100">
                {recentOrders.length === 0 ? (
                  <div className="p-8 text-center text-sm text-gray-400">
                    Заказов пока нет
                  </div>
                ) : (
                  recentOrders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between gap-4 px-6 py-5"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-black">
                            #{order.id}
                          </span>

                          <span
                            className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${orderStatusClass(
                              order.status
                            )}`}
                          >
                            {order.status}
                          </span>
                        </div>

                        <div className="mt-1 truncate text-sm text-gray-500">
                          {order.customerName}
                        </div>

                        <div className="mt-1 text-xs text-gray-400">
                          {formatDate(order.createdAt)}
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <div className="font-black">
                          {formatPrice(order.total)}
                        </div>

                        <div className="mt-1 text-xs text-gray-400">
                          {order.items.length} поз.
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* REPAIRS */}
            <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
                <div>
                  <h2 className="font-black">
                    Последние ремонты
                  </h2>

                  <p className="mt-1 text-xs text-gray-400">
                    Последние обращения клиентов
                  </p>
                </div>

                <Link
                  href="/admin/repairs"
                  className="text-sm font-bold text-green-600 hover:text-green-700"
                >
                  Все ремонты →
                </Link>
              </div>

              <div className="divide-y divide-gray-100">
                {recentRepairs.length === 0 ? (
                  <div className="p-8 text-center text-sm text-gray-400">
                    Заявок пока нет
                  </div>
                ) : (
                  recentRepairs.map((repair) => (
                    <div
                      key={repair.id}
                      className="flex items-center justify-between gap-4 px-6 py-5"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-black">
                            #{repair.id}
                          </span>

                          <span
                            className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${repairStatusClass(
                              repair.status
                            )}`}
                          >
                            {repair.status}
                          </span>
                        </div>

                        <div className="mt-1 truncate text-sm font-semibold text-gray-700">
                          {repair.deviceType}
                          {repair.brand
                            ? ` • ${repair.brand}`
                            : ""}
                        </div>

                        <div className="mt-1 truncate text-xs text-gray-400">
                          {repair.problem}
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <div className="text-sm font-black">
                          {repair.price
                            ? formatPrice(repair.price)
                            : "Уточняется"}
                        </div>

                        <div className="mt-1 text-xs text-gray-400">
                          {formatDate(repair.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          {/* SYSTEM INFO */}
          <section className="mt-8 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="font-black">
                  Система работает
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  TECHSTORE готов принимать заказы и заявки.
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Система онлайн
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  icon,
  title,
  value,
  badge,
  href,
}: {
  icon: string;
  title: string;
  value: string;
  badge?: string;
  href?: string;
}) {
  const content = (
    <div className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-xl transition group-hover:bg-green-50">
          {icon}
        </div>

        {badge && (
          <span className="max-w-[150px] rounded-full bg-green-50 px-2.5 py-1 text-center text-[11px] font-bold text-green-700">
            {badge}
          </span>
        )}
      </div>

      <div className="mt-5 text-xs font-bold uppercase tracking-wider text-gray-400">
        {title}
      </div>

      <div className="mt-1 text-2xl font-black tracking-tight">
        {value}
      </div>
    </div>
  );

  if (!href) {
    return content;
  }

  return <Link href={href}>{content}</Link>;
}

function ImportStat({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className="border-b border-gray-100 p-6 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
      <div className="text-xs font-bold uppercase tracking-wider text-gray-400">
        {label}
      </div>

      <div
        className={`mt-2 text-3xl font-black ${
          highlight && value > 0
            ? "text-green-600"
            : "text-gray-900"
        }`}
      >
        {value.toLocaleString("ru-RU")}
      </div>
    </div>
  );
}

function QuickAction({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-green-300 hover:shadow-md"
    >
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-xl transition group-hover:bg-green-50">
          {icon}
        </div>

        <div className="min-w-0">
          <h3 className="font-black">
            {title}
          </h3>

          <p className="mt-1 text-xs leading-5 text-gray-500">
            {description}
          </p>
        </div>
      </div>
    </Link>
  );
}