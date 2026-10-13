"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function AdminSidebar() {
  const pathname = usePathname();

  const [pendingImportsCount, setPendingImportsCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadImportsCount() {
      try {
        const response = await fetch("/api/admin/imports", {
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json();

        if (!cancelled && Array.isArray(data)) {
          const pendingCount = data.filter(
            (item) => item.status === "PENDING"
          ).length;

          setPendingImportsCount(pendingCount);
        }
      } catch (error) {
        console.error("Не удалось загрузить количество импортов:", error);
      }
    }

    loadImportsCount();

    const interval = setInterval(loadImportsCount, 30000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }

    return pathname.startsWith(href);
  };

  const menuSections = [
    {
      title: "Обзор",
      items: [
        {
          href: "/admin",
          icon: "📊",
          label: "Панель управления",
        },
      ],
    },
    {
      title: "Магазин",
      items: [
        {
          href: "/admin/products",
          icon: "📦",
          label: "Товары",
        },
        {
          href: "/admin/categories",
          icon: "📂",
          label: "Категории",
        },
        {
          href: "/admin/orders",
          icon: "🛒",
          label: "Заказы",
        },
        {
          href: "/admin/imports",
          icon: "📥",
          label: "Импорты",
          badge: pendingImportsCount,
        },
      ],
    },
    {
      title: "Сервис",
      items: [
        {
          href: "/admin/repairs",
          icon: "🔧",
          label: "Ремонты",
        },
        {
          href: "/admin/portfolio",
          icon: "📸",
          label: "Портфолио",
        },
      ],
    },
    {
      title: "Клиенты",
      items: [
        {
          href: "/admin/users",
          icon: "👥",
          label: "Пользователи",
        },
      ],
    },
  ];

  return (
    <aside className="sticky top-0 flex h-screen w-72 shrink-0 flex-col border-r border-gray-800 bg-[#0b0f0d] text-white">
      {/* LOGO */}
      <div className="border-b border-white/10 px-6 py-6">
        <Link href="/admin" className="group block">
          <div className="text-2xl font-black tracking-tight">
            TECH<span className="text-green-400">STORE</span>
          </div>

          <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.22em] text-gray-500">
            Administration
          </div>
        </Link>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 overflow-y-auto px-4 py-6">
        <div className="space-y-7">
          {menuSections.map((section) => (
            <div key={section.title}>
              <div className="mb-2 px-3 text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">
                {section.title}
              </div>

              <div className="space-y-1">
                {section.items.map((item) => {
                  const active = isActive(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`
                        group
                        flex
                        items-center
                        gap-3
                        rounded-xl
                        px-3
                        py-3
                        text-sm
                        font-bold
                        transition-all
                        duration-200
                        ${
                          active
                            ? "bg-green-500 text-black shadow-lg shadow-green-500/10"
                            : "text-gray-400 hover:bg-white/5 hover:text-white"
                        }
                      `}
                    >
                      <span
                        className={`
                          flex
                          h-8
                          w-8
                          shrink-0
                          items-center
                          justify-center
                          rounded-lg
                          text-base
                          ${
                            active
                              ? "bg-black/10"
                              : "bg-white/5 group-hover:bg-white/10"
                          }
                        `}
                      >
                        {item.icon}
                      </span>

                      <span className="truncate">
                        {item.label}
                      </span>

                      {/* IMPORTS BADGE */}
                      {"badge" in item &&
                        typeof item.badge === "number" &&
                        item.badge > 0 && (
                          <span
                            className={`
                              ml-auto
                              flex
                              min-w-6
                              h-6
                              items-center
                              justify-center
                              rounded-full
                              px-2
                              text-[11px]
                              font-black
                              ${
                                active
                                  ? "bg-black text-green-400"
                                  : "bg-green-500 text-black"
                              }
                            `}
                          >
                            {item.badge > 99 ? "99+" : item.badge}
                          </span>
                        )}

                      {active && (
                        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-black" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* BOTTOM */}
      <div className="border-t border-white/10 p-4">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-gray-400 transition hover:bg-white/5 hover:text-white"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
            ←
          </span>

          <span>Вернуться в магазин</span>
        </Link>

        <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500 font-black text-black">
              A
            </div>

            <div className="min-w-0">
              <div className="truncate text-sm font-black text-white">
                Администратор
              </div>

              <div className="mt-0.5 text-xs text-gray-500">
                TECHSTORE
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 text-[11px] font-bold text-green-400">
            <span className="h-2 w-2 rounded-full bg-green-400" />
            Система онлайн
          </div>
        </div>
      </div>
    </aside>
  );
}