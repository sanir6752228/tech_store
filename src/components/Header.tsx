"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  Search,
  ShoppingCart,
  User,
  Heart,
  Menu,
  ChevronDown,
  Wrench,
  Smartphone,
  Tablet,
  BatteryCharging,
  Headphones,
  Send,
  LogIn,
  UserPlus,
  X,
  MapPin,
  Truck,
  ShieldCheck,
  HelpCircle,
  Package,
} from "lucide-react";

type HeaderUser = {
  id: number;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
};

const catalogItems = [
  {
    href: "/catalog?category=phones",
    label: "Телефоны",
    description: "iPhone, Samsung и другие",
    icon: Smartphone,
  },
  {
    href: "/catalog?category=tablets",
    label: "Планшеты",
    description: "Для работы и развлечений",
    icon: Tablet,
  },
  {
    href: "/catalog?category=accessories",
    label: "Аксессуары",
    description: "Чехлы, кабели и другое",
    icon: Headphones,
  },
  {
    href: "/catalog?category=charging",
    label: "Зарядки",
    description: "Адаптеры и кабели",
    icon: BatteryCharging,
  },
];

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [catalogOpen, setCatalogOpen] = useState(false);

  const [cartCount, setCartCount] = useState(0);
  const [favoritesCount, setFavoritesCount] = useState(0);

  const [user, setUser] = useState<HeaderUser | null>(null);
  const [userLoading, setUserLoading] = useState(true);

  const [searchValue, setSearchValue] = useState(
    searchParams.get("search") || ""
  );

  /*
   * ============================================================
   * АВТОРИЗАЦИЯ
   * ============================================================
   */

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      try {
        setUserLoading(true);

        const response = await fetch("/api/auth/me", {
          cache: "no-store",
        });

        if (!response.ok) {
          if (!cancelled) {
            setUser(null);
          }

          return;
        }

        const data = await response.json();

        if (!cancelled) {
          setUser(data.user ?? null);
        }
      } catch {
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setUserLoading(false);
        }
      }
    }

    loadUser();

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  /*
   * ============================================================
   * КОРЗИНА + ИЗБРАННОЕ
   * ============================================================
   */

  useEffect(() => {
    function updateCart() {
      try {
        const cart = JSON.parse(
          localStorage.getItem("cart") || "[]"
        );

        setCartCount(
          Array.isArray(cart) ? cart.length : 0
        );
      } catch {
        setCartCount(0);
      }
    }

    function updateFavorites() {
      try {
        const favorites = JSON.parse(
          localStorage.getItem("favorites") || "[]"
        );

        setFavoritesCount(
          Array.isArray(favorites)
            ? favorites.length
            : 0
        );
      } catch {
        setFavoritesCount(0);
      }
    }

    updateCart();
    updateFavorites();

    window.addEventListener(
      "cartUpdated",
      updateCart
    );

    window.addEventListener(
      "favoritesUpdated",
      updateFavorites
    );

    return () => {
      window.removeEventListener(
        "cartUpdated",
        updateCart
      );

      window.removeEventListener(
        "favoritesUpdated",
        updateFavorites
      );
    };
  }, []);

  /*
   * ============================================================
   * СИНХРОНИЗАЦИЯ ПОИСКА
   * ============================================================
   */

  useEffect(() => {
    setSearchValue(
      searchParams.get("search") || ""
    );
  }, [searchParams]);

  /*
   * ============================================================
   * ПОИСК
   * ============================================================
   */

  function handleSearch(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const value = searchValue.trim();

    const params = new URLSearchParams(
      searchParams.toString()
    );

    if (value) {
      params.set("search", value);
    } else {
      params.delete("search");
    }

    if (pathname === "/catalog") {
      const query = params.toString();

      router.push(
        query
          ? `/catalog?${query}`
          : "/catalog"
      );
    } else {
      const query = new URLSearchParams();

      if (value) {
        query.set("search", value);
      }

      const queryString = query.toString();

      router.push(
        queryString
          ? `/catalog?${queryString}`
          : "/catalog"
      );
    }

    setCatalogOpen(false);
  }

  /*
   * ============================================================
   * ОЧИСТКА ПОИСКА
   * ============================================================
   */

  function clearSearch() {
    setSearchValue("");

    const params = new URLSearchParams(
      searchParams.toString()
    );

    params.delete("search");

    if (pathname === "/catalog") {
      const query = params.toString();

      router.push(
        query
          ? `/catalog?${query}`
          : "/catalog"
      );
    } else {
      router.push("/catalog");
    }
  }

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 shadow-[0_1px_12px_rgba(0,0,0,0.04)] backdrop-blur-xl">

      {/* ======================================================
          TOP BAR
      ====================================================== */}

      <div className="hidden border-b border-white/10 bg-[#0b0f0d] text-[13px] font-medium text-gray-300 lg:block">

        <div className="mx-auto flex h-10 max-w-[1600px] items-center justify-between px-6 xl:px-8">

          <div className="flex items-center gap-7">

            <div className="flex items-center gap-2.5 text-white">
              <MapPin
                size={15}
                strokeWidth={2}
                className="text-green-400"
              />

              Республика Крым
            </div>

            <div className="flex items-center gap-2.5">
              <Truck
                size={15}
                strokeWidth={2}
                className="text-green-400"
              />

              Быстрая доставка
            </div>

            <div className="flex items-center gap-2.5">
              <ShieldCheck
                size={15}
                strokeWidth={2}
                className="text-green-400"
              />

              Гарантия на товары
            </div>

          </div>

          <div className="flex items-center gap-7">

            <Link
              href="/repair"
              className="text-[13px] transition hover:text-white"
            >
              Ремонт техники
            </Link>

            <Link
              href="/"
              className="flex items-center gap-2 text-[13px] transition hover:text-white"
            >
              <HelpCircle
                size={15}
                strokeWidth={2}
              />

              Помощь
            </Link>

            <Link
              href="/"
              className="text-[13px] transition hover:text-white"
            >
              Контакты
            </Link>

          </div>

        </div>

      </div>

      {/* ======================================================
          MAIN HEADER
      ====================================================== */}

      <div className="bg-white">

        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 xl:px-8">

          <div className="flex min-h-[84px] items-center gap-4 lg:gap-6">

            {/* ==================================================
                LOGO
            ================================================== */}

            <Link
              href="/"
              className="group shrink-0"
            >

              <div className="text-[27px] font-black tracking-[-0.06em] text-[#0b0f0d] sm:text-[30px]">
                TECH
                <span className="text-green-500">
                  STORE
                </span>
              </div>

              <div className="mt-0.5 hidden text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 sm:block">
                Техника • Продажа • Сервис
              </div>

            </Link>

            {/* ==================================================
                CATALOG
            ================================================== */}

            <div className="relative hidden shrink-0 lg:block">

              <button
                type="button"
                onClick={() =>
                  setCatalogOpen(!catalogOpen)
                }
                className={`
                  flex
                  h-13
                  items-center
                  gap-3
                  rounded-xl
                  px-5
                  text-[15px]
                  font-black
                  transition-all
                  ${
                    catalogOpen
                      ? "bg-[#0b0f0d] text-white"
                      : "bg-green-500 text-black hover:bg-green-400"
                  }
                `}
              >

                <Menu
                  size={21}
                  strokeWidth={2}
                />

                <span>Каталог</span>

                <ChevronDown
                  size={17}
                  strokeWidth={2}
                  className={`transition-transform ${
                    catalogOpen
                      ? "rotate-180"
                      : ""
                  }`}
                />

              </button>

              {/* =================================================
                  CATALOG DROPDOWN
              ================================================= */}

              {catalogOpen && (
                <>

                  <button
                    type="button"
                    aria-label="Закрыть каталог"
                    onClick={() =>
                      setCatalogOpen(false)
                    }
                    className="fixed inset-0 top-[124px] z-40 cursor-default bg-transparent"
                  />

                  <div className="absolute left-0 top-[60px] z-50 w-[420px] overflow-hidden rounded-2xl border border-gray-200 bg-white p-3 shadow-[0_24px_70px_rgba(0,0,0,0.16)]">

                    <div className="px-3 pb-3 pt-2">

                      <div className="text-xs font-black uppercase tracking-[0.15em] text-gray-400">
                        Категории
                      </div>

                      <div className="mt-1 text-sm font-bold text-gray-900">
                        Выберите нужный раздел
                      </div>

                    </div>

                    <div className="grid grid-cols-2 gap-1">

                      {catalogItems.map(
                        (item) => {
                          const Icon =
                            item.icon;

                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() =>
                                setCatalogOpen(
                                  false
                                )
                              }
                              className="group rounded-xl p-3 transition hover:bg-gray-50"
                            >

                              <div className="flex items-start gap-3">

                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-700 transition group-hover:bg-green-100 group-hover:text-green-700">

                                  <Icon
                                    size={20}
                                    strokeWidth={2}
                                  />

                                </div>

                                <div className="min-w-0">

                                  <div className="text-sm font-black text-gray-900">
                                    {item.label}
                                  </div>

                                  <div className="mt-0.5 text-[11px] leading-4 text-gray-400">
                                    {item.description}
                                  </div>

                                </div>

                              </div>

                            </Link>
                          );
                        }
                      )}

                    </div>

                    <div className="my-2 border-t border-gray-100" />

                    <Link
                      href="/repair"
                      onClick={() =>
                        setCatalogOpen(false)
                      }
                      className="group flex items-center gap-3 rounded-xl p-3 transition hover:bg-green-50"
                    >

                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-700 transition group-hover:bg-green-100 group-hover:text-green-700">

                        <Wrench
                          size={20}
                          strokeWidth={2}
                        />

                      </div>

                      <div className="flex-1">

                        <div className="text-sm font-black text-gray-900">
                          Ремонт техники
                        </div>

                        <div className="text-[11px] text-gray-400">
                          Оставить заявку на ремонт
                        </div>

                      </div>

                      <span className="text-lg text-gray-300 transition group-hover:translate-x-1 group-hover:text-green-500">
                        →
                      </span>

                    </Link>

                  </div>

                </>
              )}

            </div>

            {/* ==================================================
                SEARCH
            ================================================== */}

            <form
              onSubmit={handleSearch}
              className="relative flex-1"
            >

              <Search
                size={21}
                strokeWidth={2}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                value={searchValue}
                onChange={(event) =>
                  setSearchValue(
                    event.target.value
                  )
                }
                placeholder="Поиск товаров..."
                className="
                  h-13
                  w-full
                  rounded-xl
                  border
                  border-gray-200
                  bg-gray-50
                  pl-12
                  pr-12
                  text-[15px]
                  font-medium
                  text-gray-900
                  outline-none
                  transition
                  placeholder:text-gray-400
                  hover:border-gray-300
                  focus:border-green-500
                  focus:bg-white
                  focus:ring-4
                  focus:ring-green-500/10
                "
              />

              {searchValue && (
                <button
                  type="button"
                  onClick={clearSearch}
                  aria-label="Очистить поиск"
                  className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-900"
                >
                  <X
                    size={18}
                    strokeWidth={2}
                  />
                </button>
              )}

            </form>

            {/* ==================================================
                RIGHT ACTIONS
            ================================================== */}

            <div className="flex shrink-0 items-center gap-1">

              {/* =================================================
                  FAVORITES
              ================================================= */}

              <Link
                href="/favorites"
                className="group relative flex h-13 w-13 items-center justify-center rounded-xl transition hover:bg-gray-100"
                aria-label="Избранное"
              >

                <Heart
                  size={24}
                  strokeWidth={1.8}
                  className="text-gray-700 transition group-hover:text-green-600"
                />

                {favoritesCount > 0 && (
                  <span className="absolute right-1 top-1 flex h-[19px] min-w-[19px] items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[9px] font-black text-white">
                    {favoritesCount > 99
                      ? "99+"
                      : favoritesCount}
                  </span>
                )}

              </Link>

              {/* =================================================
                  CART
              ================================================= */}

              <Link
                href="/cart"
                className="group relative flex h-13 w-13 items-center justify-center rounded-xl transition hover:bg-gray-100"
                aria-label="Корзина"
              >

                <ShoppingCart
                  size={24}
                  strokeWidth={1.8}
                  className="text-gray-700 transition group-hover:text-green-600"
                />

                {cartCount > 0 && (
                  <span className="absolute right-1 top-1 flex h-[19px] min-w-[19px] items-center justify-center rounded-full border-2 border-white bg-green-500 px-1 text-[9px] font-black text-black">
                    {cartCount > 99
                      ? "99+"
                      : cartCount}
                  </span>
                )}

              </Link>

              {/* =================================================
                  ACCOUNT
              ================================================= */}

              <div className="ml-1 border-l border-gray-200 pl-2">

                {userLoading ? (

                  <div className="flex h-13 w-13 items-center justify-center rounded-xl text-gray-300">
                    <User
                      size={22}
                      strokeWidth={2}
                    />
                  </div>

                ) : user ? (

                  <Link
                    href="/profile"
                    className="group flex h-13 items-center gap-2 rounded-xl px-2.5 transition hover:bg-gray-100"
                  >

                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-700 transition group-hover:bg-green-100 group-hover:text-green-700">

                      <User
                        size={19}
                        strokeWidth={2}
                      />

                    </div>

                    <div className="hidden xl:block">

                      <div className="max-w-[105px] truncate text-[13px] font-black text-gray-900">
                        {user.name}
                      </div>

                      <div className="text-[10px] font-medium text-gray-400">
                        Личный кабинет
                      </div>

                    </div>

                  </Link>

                ) : (

                  <div className="hidden items-center gap-2 xl:flex">

                    <Link
                      href="/login"
                      className="flex h-11 items-center gap-2 rounded-xl px-3 text-[13px] font-black text-gray-700 transition hover:bg-gray-100"
                    >

                      <LogIn
                        size={18}
                        strokeWidth={2}
                      />

                      Войти

                    </Link>

                    <Link
                      href="/register"
                      className="flex h-11 items-center gap-2 rounded-xl bg-green-500 px-4 text-[13px] font-black text-black transition hover:bg-green-400"
                    >

                      <UserPlus
                        size={18}
                        strokeWidth={2}
                      />

                      Регистрация

                    </Link>

                  </div>

                )}

              </div>

              {/* =================================================
                  TELEGRAM
              ================================================= */}

              <a
                href="#"
                aria-label="Telegram"
                className="ml-1 flex h-12 w-12 items-center justify-center rounded-xl bg-[#0b0f0d] text-white transition hover:bg-green-500 hover:text-black"
              >

                <Send
                  size={23}
                  strokeWidth={2}
                />

              </a>

            </div>

          </div>

        </div>

      </div>

      {/* ======================================================
          SECONDARY NAVIGATION
      ====================================================== */}

      <div className="hidden border-t border-gray-100 bg-white lg:block">

        <div className="mx-auto flex h-12 max-w-[1600px] items-center px-6 xl:px-8">

          <nav className="flex items-center gap-1">

            <Link
              href="/catalog?category=phones"
              className="rounded-lg px-3 py-2 text-[13px] font-bold text-gray-600 transition hover:bg-gray-50 hover:text-green-600"
            >
              Телефоны
            </Link>

            <Link
              href="/catalog?category=tablets"
              className="rounded-lg px-3 py-2 text-[13px] font-bold text-gray-600 transition hover:bg-gray-50 hover:text-green-600"
            >
              Планшеты
            </Link>

            <Link
              href="/catalog?category=accessories"
              className="rounded-lg px-3 py-2 text-[13px] font-bold text-gray-600 transition hover:bg-gray-50 hover:text-green-600"
            >
              Аксессуары
            </Link>

            <Link
              href="/catalog?category=charging"
              className="rounded-lg px-3 py-2 text-[13px] font-bold text-gray-600 transition hover:bg-gray-50 hover:text-green-600"
            >
              Зарядки
            </Link>

            <div className="mx-2 h-5 w-px bg-gray-200" />

            <Link
              href="/repair"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-bold text-gray-600 transition hover:bg-green-50 hover:text-green-700"
            >

              <Wrench
                size={15}
                strokeWidth={2}
              />

              Ремонт

            </Link>

            <Link
              href="/catalog"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-bold text-gray-600 transition hover:bg-gray-50 hover:text-green-600"
            >

              <Package
                size={15}
                strokeWidth={2}
              />

              Все товары

            </Link>

          </nav>

          <div className="ml-auto flex items-center gap-2 text-[12px] font-bold text-gray-400">

            <span className="h-2 w-2 rounded-full bg-green-500" />

            Магазин работает

          </div>

        </div>

      </div>

    </header>
  );
}