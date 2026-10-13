import Link from "next/link";
import { redirect } from "next/navigation";

import AdminSidebar from "@/components/AdminSidebar";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

export default async function AdminUsersPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/admin/login");
  }

  if (currentUser.role !== "ADMIN") {
    redirect("/");
  }

  const users = await prisma.user.findMany({
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,

      _count: {
        select: {
          orders: true,
          repairs: true,
        },
      },
    },
  });

  const adminCount = users.filter(
    (user) => user.role === "ADMIN"
  ).length;

  const customerCount = users.filter(
    (user) => user.role === "USER"
  ).length;

  return (
    <div className="flex min-h-screen bg-[#f5f6f7] text-gray-900">
      <AdminSidebar />

      <main className="min-w-0 flex-1">
        {/* HEADER */}
        <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/90 backdrop-blur">
          <div className="flex items-center justify-between px-6 py-4 lg:px-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-green-600">
                TECHSTORE ADMIN
              </p>

              <h1 className="mt-1 text-xl font-black">
                Пользователи
              </h1>
            </div>

            <Link
              href="/admin"
              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 transition hover:border-green-300 hover:text-green-700"
            >
              ← Dashboard
            </Link>
          </div>
        </header>

        <div className="p-6 lg:p-8">
          {/* TITLE */}
          <section className="mb-7">
            <h2 className="text-3xl font-black tracking-tight">
              Клиенты и администраторы
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Управление пользователями магазина
            </p>
          </section>

          {/* STATS */}
          <section className="grid gap-4 sm:grid-cols-3">
            <UserStat
              icon="👥"
              title="Всего пользователей"
              value={users.length}
            />

            <UserStat
              icon="🛍️"
              title="Клиенты"
              value={customerCount}
            />

            <UserStat
              icon="🛡️"
              title="Администраторы"
              value={adminCount}
            />
          </section>

          {/* TABLE */}
          <section className="mt-7 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-6 py-5">
              <h3 className="font-black">
                Все пользователи
              </h3>

              <p className="mt-1 text-xs text-gray-400">
                Пароли и секретные данные здесь не отображаются.
              </p>
            </div>

            {users.length === 0 ? (
              <div className="p-12 text-center text-sm text-gray-400">
                Пользователей пока нет.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px]">
                  <thead className="bg-gray-50">
                    <tr className="text-left text-xs font-bold uppercase tracking-wider text-gray-400">
                      <th className="px-6 py-4">
                        Пользователь
                      </th>

                      <th className="px-6 py-4">
                        Телефон
                      </th>

                      <th className="px-6 py-4">
                        Роль
                      </th>

                      <th className="px-6 py-4">
                        Заказы
                      </th>

                      <th className="px-6 py-4">
                        Ремонты
                      </th>

                      <th className="px-6 py-4">
                        Регистрация
                      </th>

                      <th className="px-6 py-4">
                        Действие
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {users.map((user) => (
                      <tr
                        key={user.id}
                        className="transition hover:bg-gray-50"
                      >
                        {/* USER */}
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-900 text-sm font-black text-white">
                              {user.name
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div className="min-w-0">
                              <Link
                                href={`/admin/users/${user.id}`}
                                className="font-black text-gray-900 transition hover:text-green-600"
                              >
                                {user.name}
                              </Link>

                              <div className="mt-1 text-sm text-gray-500">
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* PHONE */}
                        <td className="px-6 py-5 text-sm font-semibold text-gray-600">
                          {user.phone || "Не указан"}
                        </td>

                        {/* ROLE */}
                        <td className="px-6 py-5">
                          {user.role === "ADMIN" ? (
                            <span className="inline-flex rounded-full border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700">
                              🛡 Администратор
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full border border-gray-200 bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-700">
                              Клиент
                            </span>
                          )}
                        </td>

                        {/* ORDERS */}
                        <td className="px-6 py-5">
                          <span className="inline-flex min-w-8 items-center justify-center rounded-lg bg-gray-100 px-2.5 py-1.5 text-sm font-black">
                            {user._count.orders}
                          </span>
                        </td>

                        {/* REPAIRS */}
                        <td className="px-6 py-5">
                          <span className="inline-flex min-w-8 items-center justify-center rounded-lg bg-gray-100 px-2.5 py-1.5 text-sm font-black">
                            {user._count.repairs}
                          </span>
                        </td>

                        {/* DATE */}
                        <td className="px-6 py-5 text-sm text-gray-500">
                          {formatDate(user.createdAt)}
                        </td>

                        {/* ACTION */}
                        <td className="px-6 py-5">
                          <Link
                            href={`/admin/users/${user.id}`}
                            className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-xs font-black text-white transition hover:bg-green-500 hover:text-black"
                          >
                            Открыть →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function UserStat({
  icon,
  title,
  value,
}: {
  icon: string;
  title: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-xl">
        {icon}
      </div>

      <div className="mt-5 text-xs font-bold uppercase tracking-wider text-gray-400">
        {title}
      </div>

      <div className="mt-1 text-3xl font-black">
        {value.toLocaleString("ru-RU")}
      </div>
    </div>
  );
}