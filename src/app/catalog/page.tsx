import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import ProductFilters from "@/components/ProductFilters";
import { prisma } from "@/lib/prisma";

function normalize(value: string | null | undefined) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/ё/g, "е");
}

function normalizeMemory(value: string | null | undefined) {
  return normalize(value).replace(/\s+/g, "");
}

function levenshtein(a: string, b: string) {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b[i - 1] === a[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

const searchAliases: Record<string, string[]> = {
  айфон: ["iphone", "apple"],
  айфона: ["iphone", "apple"],
  айфону: ["iphone", "apple"],
  айфоны: ["iphone", "apple"],
  эпл: ["apple", "iphone"],
  яблоко: ["apple", "iphone"],

  самсунг: ["samsung"],
  самсунга: ["samsung"],
  самсунги: ["samsung"],
  самсун: ["samsung"],
  сансунг: ["samsung"],

  сяоми: ["xiaomi"],
  ксиаоми: ["xiaomi"],
  ксиоми: ["xiaomi"],
  ми: ["xiaomi"],

  редми: ["redmi", "xiaomi"],

  хуавей: ["huawei"],
  хуавэй: ["huawei"],

  хонор: ["honor"],

  гугл: ["google", "pixel"],
  пиксель: ["pixel", "google"],

  ванплас: ["oneplus"],
  ванплюс: ["oneplus"],

  зарядка: [
    "зарядка",
    "зарядки",
    "charger",
    "charging",
  ],

  зарядки: [
    "зарядка",
    "зарядки",
    "charger",
    "charging",
  ],

  зарядник: [
    "зарядка",
    "зарядки",
    "charger",
    "charging",
  ],

  зарядное: [
    "зарядка",
    "зарядки",
    "charger",
    "charging",
  ],

  зарядноеустройство: [
    "зарядка",
    "зарядки",
    "charger",
    "charging",
  ],

  кабель: ["кабель", "cable"],
  кабели: ["кабель", "cable"],
  провод: ["кабель", "cable"],

  наушники: [
    "наушники",
    "headphones",
    "earphones",
    "airpods",
  ],

  наушник: [
    "наушники",
    "headphones",
    "earphones",
    "airpods",
  ],

  чехол: ["чехол", "case"],
  чехлы: ["чехол", "case"],

  телефон: [
    "телефон",
    "телефоны",
    "phone",
    "phones",
    "смартфон",
    "смартфоны",
    "smartphone",
  ],

  телефоны: [
    "телефон",
    "телефоны",
    "phone",
    "phones",
    "смартфон",
    "смартфоны",
    "smartphone",
  ],

  смартфон: [
    "телефон",
    "телефоны",
    "phone",
    "phones",
    "смартфон",
    "смартфоны",
    "smartphone",
  ],

  смартфоны: [
    "телефон",
    "телефоны",
    "phone",
    "phones",
    "смартфон",
    "смартфоны",
    "smartphone",
  ],

  планшет: [
    "планшет",
    "планшеты",
    "tablet",
    "tablets",
    "ipad",
  ],

  планшеты: [
    "планшет",
    "планшеты",
    "tablet",
    "tablets",
    "ipad",
  ],

  аксессуар: [
    "аксессуар",
    "аксессуары",
    "accessory",
    "accessories",
  ],

  аксессуары: [
    "аксессуар",
    "аксессуары",
    "accessory",
    "accessories",
  ],
};

function getSearchVariants(word: string): string[] {
  const normalized = normalize(word);
  const variants = new Set<string>();

  variants.add(normalized);

  const direct = searchAliases[normalized];

  if (direct) {
    direct.forEach((item) => {
      variants.add(normalize(item));
    });
  }

  for (const alias of Object.keys(searchAliases)) {
    const distance = levenshtein(normalized, alias);

    const maxDistance =
      normalized.length <= 4 ? 1 : 2;

    if (distance <= maxDistance) {
      variants.add(alias);

      searchAliases[alias].forEach((item) => {
        variants.add(normalize(item));
      });
    }
  }

  return Array.from(variants);
}

function tokenizeSearch(value: string): string[] {
  return normalize(value)
    .replace(/[,./\\()[\]{}]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function wordMatches(
  searchWord: string,
  productWords: string[]
) {
  const variants = getSearchVariants(searchWord);

  for (const variant of variants) {
    for (const productWord of productWords) {
      if (productWord === variant) {
        return true;
      }

      if (
        productWord.includes(variant) ||
        variant.includes(productWord)
      ) {
        return true;
      }

      const isNumeric =
        /^\d+$/.test(variant) ||
        /^\d+$/.test(productWord);

      if (!isNumeric) {
        const distance = levenshtein(
          variant,
          productWord
        );

        const maxDistance =
          variant.length <= 4 ? 1 : 2;

        if (distance <= maxDistance) {
          return true;
        }
      }
    }
  }

  return false;
}

function productMatchesSearch(
  product: {
    name: string;
    brand: string;
    model: string;
    description: string | null;
    memory: string | null;
    color: string | null;
  },
  search: string
) {
  const searchWords = tokenizeSearch(search);

  if (!searchWords.length) {
    return true;
  }

  const searchableText = [
    product.name,
    product.brand,
    product.model,
    product.description || "",
    product.memory || "",
    product.color || "",
  ]
    .map(normalize)
    .join(" ");

  const productWords =
    tokenizeSearch(searchableText);

  return searchWords.every((searchWord) =>
    wordMatches(searchWord, productWords)
  );
}

function categoryMatches(
  selectedCategory: string,
  categorySlug: string,
  categoryName: string
) {
  const selected = normalize(selectedCategory);
  const slug = normalize(categorySlug);
  const name = normalize(categoryName);

  const aliases: Record<string, string[]> = {
    phones: [
      "phones",
      "phone",
      "телефоны",
      "телефон",
    ],

    tablets: [
      "tablets",
      "tablet",
      "планшеты",
      "планшет",
    ],

    accessories: [
      "accessories",
      "accessory",
      "аксессуары",
      "аксессуар",
    ],

    charging: [
      "charging",
      "charger",
      "chargers",
      "зарядки",
      "зарядка",
      "zaryadki",
    ],
  };

  const possibleValues =
    aliases[selected] || [selected];

  return (
    possibleValues.includes(slug) ||
    possibleValues.includes(name)
  );
}

function normalizeCondition(value: string) {
  const normalized = normalize(value);

  if (
    normalized === "new" ||
    normalized === "новый"
  ) {
    return "Новый";
  }

  if (
    normalized === "used" ||
    normalized === "б/у" ||
    normalized === "бу"
  ) {
    return "Б/У";
  }

  if (
    normalized === "refurbished" ||
    normalized === "после ремонта"
  ) {
    return "После ремонта";
  }

  return value;
}

export default async function Catalog({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    category?: string;
    brand?: string;
    condition?: string;
    storage?: string;
    battery?: string;
    sort?: string;
  }>;
}) {
  const filters = await searchParams;

  const products =
    await prisma.product.findMany({
      include: {
        category: true,
      },

      orderBy: {
        createdAt: "desc",
      },
    });

  let filteredProducts = products.filter(
    (product) => {
      if (
        filters.search &&
        !productMatchesSearch(
          product,
          filters.search
        )
      ) {
        return false;
      }

      if (filters.category) {
        const categories =
          filters.category
            .split(",")
            .filter(Boolean);

        const categoryFound =
          categories.some(
            (selectedCategory) =>
              categoryMatches(
                selectedCategory,
                product.category.slug,
                product.category.name
              )
          );

        if (!categoryFound) {
          return false;
        }
      }

      if (filters.brand) {
        const brands =
          filters.brand
            .split(",")
            .filter(Boolean)
            .map(normalize);

        if (
          !brands.includes(
            normalize(product.brand)
          )
        ) {
          return false;
        }
      }

      if (filters.condition) {
        const conditions =
          filters.condition
            .split(",")
            .filter(Boolean)
            .map(normalizeCondition)
            .map(normalize);

        const productCondition =
          normalize(product.condition);

        if (
          !conditions.includes(
            productCondition
          )
        ) {
          return false;
        }
      }

      if (filters.storage) {
        const storages =
          filters.storage
            .split(",")
            .filter(Boolean)
            .map(normalizeMemory);

        const productMemory =
          normalizeMemory(product.memory);

        if (
          !productMemory ||
          !storages.includes(productMemory)
        ) {
          return false;
        }
      }

      if (filters.battery) {
        const minimumBattery =
          Number(filters.battery);

        const productBattery =
          product.battery
            ? Number(
                String(product.battery)
                  .replace("%", "")
                  .trim()
              )
            : 0;

        if (
          Number.isNaN(minimumBattery) ||
          productBattery < minimumBattery
        ) {
          return false;
        }
      }

      return true;
    }
  );

  if (filters.sort === "cheap") {
    filteredProducts.sort(
      (a, b) => a.price - b.price
    );
  }

  if (filters.sort === "expensive") {
    filteredProducts.sort(
      (a, b) => b.price - a.price
    );
  }

  /*
   * ============================================
   * СТРОИМ URL С ФИЛЬТРАМИ
   * ============================================
   */

  function buildUrl(
    overrides: Record<string, string | null>
  ) {
    const params = new URLSearchParams();

    const values = {
      search: filters.search,
      category: filters.category,
      brand: filters.brand,
      condition: filters.condition,
      storage: filters.storage,
      battery: filters.battery,
      sort: filters.sort,
      ...overrides,
    };

    Object.entries(values).forEach(
      ([key, value]) => {
        if (value) {
          params.set(key, value);
        }
      }
    );

    const query = params.toString();

    return query
      ? `/catalog?${query}`
      : "/catalog";
  }

  return (
    <main className="min-h-screen bg-[#f4f5f6] text-gray-950">

      {/* =====================================================
          CATALOG HEADER
      ===================================================== */}

      <section className="border-b border-gray-200 bg-white">

        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">

          <div className="py-7 sm:py-9 lg:py-10">

            {/* BREADCRUMB */}

            <div className="mb-5 flex items-center gap-2 text-xs font-semibold text-gray-400">
              <Link
                href="/"
                className="transition hover:text-green-600"
              >
                Главная
              </Link>

              <span>/</span>

              <span className="text-gray-700">
                Каталог
              </span>
            </div>

            {/* TITLE */}

            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

              <div>

                <div className="mb-2 text-[11px] font-black uppercase tracking-[0.22em] text-green-600">
                  TECHSTORE
                </div>

                <h1 className="text-[34px] font-black leading-[1.05] tracking-[-0.035em] text-gray-950 sm:text-[42px] lg:text-[48px]">
                  Каталог техники
                </h1>

                <p className="mt-3 max-w-2xl text-[14px] leading-6 text-gray-500 sm:text-[15px]">
                  Смартфоны, планшеты, аксессуары
                  и зарядные устройства.
                  Найдите нужный товар среди
                  актуальных предложений.
                </p>

              </div>

              {/* COUNT */}

              <div className="hidden shrink-0 rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 sm:block">

                <div className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">
                  Товаров найдено
                </div>

                <div className="mt-1 text-[26px] font-black leading-none text-gray-950">
                  {filteredProducts.length}
                </div>

              </div>

            </div>

            {/* =================================================
                SEARCH
            ================================================= */}

            <form
              method="GET"
              className="mt-7"
            >

              {/* Сохраняем фильтры */}

              {filters.category && (
                <input
                  type="hidden"
                  name="category"
                  value={filters.category}
                />
              )}

              {filters.brand && (
                <input
                  type="hidden"
                  name="brand"
                  value={filters.brand}
                />
              )}

              {filters.condition && (
                <input
                  type="hidden"
                  name="condition"
                  value={filters.condition}
                />
              )}

              {filters.storage && (
                <input
                  type="hidden"
                  name="storage"
                  value={filters.storage}
                />
              )}

              {filters.battery && (
                <input
                  type="hidden"
                  name="battery"
                  value={filters.battery}
                />
              )}

              {filters.sort && (
                <input
                  type="hidden"
                  name="sort"
                  value={filters.sort}
                />
              )}

              <div className="relative flex items-center">

                {/* SEARCH ICON */}

                <div className="pointer-events-none absolute left-4 flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600 sm:left-5">
                  <svg
                    width="19"
                    height="19"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle
                      cx="11"
                      cy="11"
                      r="7"
                    />
                    <path d="m20 20-4-4" />
                  </svg>
                </div>

                <input
                  type="search"
                  name="search"
                  defaultValue={
                    filters.search || ""
                  }
                  placeholder="Найти товар, бренд или модель..."
                  className="
                    h-[62px]
                    w-full
                    rounded-2xl
                    border
                    border-gray-200
                    bg-gray-50
                    pl-[70px]
                    pr-[125px]
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
                    sm:h-[68px]
                    sm:text-[16px]
                  "
                />

                <button
                  type="submit"
                  className="
                    absolute
                    right-2
                    top-2
                    h-[46px]
                    rounded-xl
                    bg-[#0b0f0d]
                    px-5
                    text-sm
                    font-black
                    text-white
                    transition
                    hover:bg-green-500
                    hover:text-black
                    sm:h-[52px]
                    sm:px-7
                  "
                >
                  Найти
                </button>

              </div>

            </form>

            {/* QUICK CATEGORIES */}

            <div className="mt-4 flex flex-wrap gap-2">

              <Link
                href={buildUrl({
                  category: null,
                })}
                className={`rounded-full border px-4 py-2 text-xs font-bold transition ${
                  !filters.category
                    ? "border-gray-950 bg-gray-950 text-white"
                    : "border-gray-200 bg-white text-gray-600 hover:border-green-300 hover:text-green-600"
                }`}
              >
                Все товары
              </Link>

              <Link
                href={buildUrl({
                  category: "phones",
                })}
                className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-600 transition hover:border-green-300 hover:text-green-600"
              >
                Телефоны
              </Link>

              <Link
                href={buildUrl({
                  category: "tablets",
                })}
                className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-600 transition hover:border-green-300 hover:text-green-600"
              >
                Планшеты
              </Link>

              <Link
                href={buildUrl({
                  category: "accessories",
                })}
                className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-600 transition hover:border-green-300 hover:text-green-600"
              >
                Аксессуары
              </Link>

              <Link
                href={buildUrl({
                  category: "charging",
                })}
                className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-600 transition hover:border-green-300 hover:text-green-600"
              >
                Зарядки
              </Link>

            </div>

          </div>

        </div>

      </section>

      {/* =====================================================
          MAIN CATALOG
      ===================================================== */}

      <section>

        <div className="mx-auto max-w-[1600px] px-4 py-7 sm:px-6 lg:px-8 lg:py-9">

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">

            {/* =================================================
                SIDEBAR
            ================================================= */}

            <aside>

              <div className="sticky top-4">

                <ProductFilters />

              </div>

            </aside>

            {/* =================================================
                PRODUCTS
            ================================================= */}

            <section className="min-w-0">

              {/* TOOLBAR */}

              <div className="mb-5 rounded-2xl border border-gray-200 bg-white shadow-sm">

                <div className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">

                  <div>

                    <div className="text-[15px] font-black text-gray-950">
                      {filteredProducts.length === 0
                        ? "Товары не найдены"
                        : `${filteredProducts.length} ${filteredProducts.length === 1 ? "товар" : filteredProducts.length < 5 ? "товара" : "товаров"}`}
                    </div>

                    {filters.search && (
                      <div className="mt-1 text-xs font-medium text-gray-400">
                        По запросу{" "}
                        <span className="font-bold text-gray-700">
                          «{filters.search}»
                        </span>
                      </div>
                    )}

                  </div>

                  <div className="flex items-center gap-2">

                    <span className="hidden text-xs font-bold text-gray-400 sm:block">
                      Сортировка:
                    </span>

                    <form
                      method="GET"
                      className="flex items-center gap-2"
                    >

                      {filters.search && (
                        <input
                          type="hidden"
                          name="search"
                          value={filters.search}
                        />
                      )}

                      {filters.category && (
                        <input
                          type="hidden"
                          name="category"
                          value={filters.category}
                        />
                      )}

                      {filters.brand && (
                        <input
                          type="hidden"
                          name="brand"
                          value={filters.brand}
                        />
                      )}

                      {filters.condition && (
                        <input
                          type="hidden"
                          name="condition"
                          value={filters.condition}
                        />
                      )}

                      {filters.storage && (
                        <input
                          type="hidden"
                          name="storage"
                          value={filters.storage}
                        />
                      )}

                      {filters.battery && (
                        <input
                          type="hidden"
                          name="battery"
                          value={filters.battery}
                        />
                      )}

                      <select
                        name="sort"
                        defaultValue={
                          filters.sort || ""
                        }
                        className="
                          h-10
                          rounded-xl
                          border
                          border-gray-200
                          bg-gray-50
                          px-3
                          text-xs
                          font-bold
                          text-gray-700
                          outline-none
                          transition
                          hover:border-gray-300
                          focus:border-green-500
                          focus:bg-white
                        "
                      >
                        <option value="">
                          Популярные
                        </option>

                        <option value="cheap">
                          Сначала дешевле
                        </option>

                        <option value="expensive">
                          Сначала дороже
                        </option>
                      </select>

                      <button
                        type="submit"
                        className="
                          h-10
                          rounded-xl
                          border
                          border-gray-200
                          bg-white
                          px-4
                          text-xs
                          font-black
                          text-gray-700
                          transition
                          hover:border-green-300
                          hover:text-green-600
                        "
                      >
                        Применить
                      </button>

                    </form>

                  </div>

                </div>

              </div>

              {/* =================================================
                  ACTIVE FILTERS
              ================================================= */}

              {(filters.search ||
                filters.category ||
                filters.brand ||
                filters.condition ||
                filters.storage ||
                filters.battery) && (

                <div className="mb-5 flex flex-wrap items-center gap-2">

                  <span className="mr-1 text-xs font-bold text-gray-400">
                    Фильтры:
                  </span>

                  {filters.search && (
                    <Link
                      href={buildUrl({
                        search: null,
                      })}
                      className="group inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 transition hover:border-red-200 hover:text-red-500"
                    >
                      Поиск: {filters.search}
                      <span className="text-gray-300 group-hover:text-red-400">
                        ×
                      </span>
                    </Link>
                  )}

                  {filters.category && (
                    <Link
                      href={buildUrl({
                        category: null,
                      })}
                      className="group inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-bold text-green-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-500"
                    >
                      Категория
                      <span className="text-green-400 group-hover:text-red-400">
                        ×
                      </span>
                    </Link>
                  )}

                  {filters.brand && (
                    <Link
                      href={buildUrl({
                        brand: null,
                      })}
                      className="group inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-bold text-green-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-500"
                    >
                      Бренд
                      <span className="text-green-400 group-hover:text-red-400">
                        ×
                      </span>
                    </Link>
                  )}

                  {filters.condition && (
                    <Link
                      href={buildUrl({
                        condition: null,
                      })}
                      className="group inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-bold text-green-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-500"
                    >
                      Состояние
                      <span className="text-green-400 group-hover:text-red-400">
                        ×
                      </span>
                    </Link>
                  )}

                  {filters.storage && (
                    <Link
                      href={buildUrl({
                        storage: null,
                      })}
                      className="group inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-bold text-green-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-500"
                    >
                      Память
                      <span className="text-green-400 group-hover:text-red-400">
                        ×
                      </span>
                    </Link>
                  )}

                  {filters.battery && (
                    <Link
                      href={buildUrl({
                        battery: null,
                      })}
                      className="group inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-bold text-green-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-500"
                    >
                      Аккумулятор
                      <span className="text-green-400 group-hover:text-red-400">
                        ×
                      </span>
                    </Link>
                  )}

                  <Link
                    href="/catalog"
                    className="ml-1 text-xs font-bold text-gray-400 transition hover:text-red-500"
                  >
                    Сбросить всё
                  </Link>

                </div>
              )}

              {/* =================================================
                  PRODUCT GRID
              ================================================= */}

              {filteredProducts.length === 0 ? (

                <div className="rounded-[26px] border border-gray-200 bg-white px-6 py-20 text-center shadow-sm">

                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-2xl">
                    🔎
                  </div>

                  <h2 className="mt-5 text-2xl font-black tracking-tight text-gray-950">
                    Ничего не нашли
                  </h2>

                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
                    Попробуйте изменить запрос
                    или убрать некоторые фильтры.
                  </p>

                  <Link
                    href="/catalog"
                    className="
                      mt-6
                      inline-flex
                      items-center
                      justify-center
                      rounded-xl
                      bg-green-500
                      px-6
                      py-3
                      text-sm
                      font-black
                      text-black
                      transition
                      hover:bg-green-400
                    "
                  >
                    Сбросить фильтры
                  </Link>

                </div>

              ) : (

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3">

                  {filteredProducts.map(
                    (product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                      />
                    )
                  )}

                </div>

              )}

            </section>

          </div>

        </div>

      </section>

    </main>
  );
}