"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
  RotateCcw,
  SlidersHorizontal,
  Check,
} from "lucide-react";

const categories = [
  {
    name: "Телефоны",
    value: "phones",
  },
  {
    name: "Планшеты",
    value: "tablets",
  },
  {
    name: "Аксессуары",
    value: "accessories",
  },
  {
    name: "Зарядки",
    value: "charging",
  },
];

const brands = [
  "Apple",
  "Samsung",
  "Xiaomi",
];

const conditions = [
  {
    name: "Новый",
    value: "Новый",
  },
  {
    name: "Б/У",
    value: "Б/У",
  },
  {
    name: "После ремонта",
    value: "После ремонта",
  },
];

const memories = [
  {
    name: "128 GB",
    value: "128 GB",
  },
  {
    name: "256 GB",
    value: "256 GB",
  },
  {
    name: "512 GB",
    value: "512 GB",
  },
  {
    name: "1 TB",
    value: "1 TB",
  },
];

export default function ProductFilters() {
  const router = useRouter();
  const params = useSearchParams();

  const [openSections, setOpenSections] = useState({
    category: true,
    brand: true,
    condition: true,
    storage: true,
    battery: true,
  });

  function clearFilters() {
    router.push("/catalog");
  }

  function toggleSection(
    section: keyof typeof openSections
  ) {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  }

  function toggleFilter(
    name: string,
    value: string
  ) {
    const newParams = new URLSearchParams(
      params.toString()
    );

    const currentValue = newParams.get(name);

    let values = currentValue
      ? currentValue.split(",").filter(Boolean)
      : [];

    if (values.includes(value)) {
      values = values.filter(
        (item) => item !== value
      );
    } else {
      values.push(value);
    }

    if (values.length > 0) {
      newParams.set(
        name,
        values.join(",")
      );
    } else {
      newParams.delete(name);
    }

    const query = newParams.toString();

    router.push(
      query
        ? `/catalog?${query}`
        : "/catalog",
      {
        scroll: false,
      }
    );
  }

  function checked(
    name: string,
    value: string
  ) {
    const selected =
      params.get(name)?.split(",") || [];

    return selected.includes(value);
  }

  const activeCount = [
    "category",
    "brand",
    "condition",
    "storage",
    "battery",
  ].reduce((count, name) => {
    const value = params.get(name);

    if (!value) return count;

    return (
      count +
      value
        .split(",")
        .filter(Boolean).length
    );
  }, 0);

  return (
    <aside className="lg:sticky lg:top-28">
      <div
        className="
          overflow-hidden
          rounded-2xl
          border
          border-gray-200
          bg-white
          shadow-[0_8px_30px_rgba(0,0,0,0.04)]
        "
      >
        {/* HEADER */}

        <div
          className="
            border-b
            border-gray-100
            px-5
            py-5
          "
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-xl
                  bg-green-50
                  text-green-600
                "
              >
                <SlidersHorizontal size={19} />
              </div>

              <div>
                <h2
                  className="
                    text-[17px]
                    font-extrabold
                    tracking-tight
                    text-gray-950
                  "
                >
                  Фильтры
                </h2>

                {activeCount > 0 && (
                  <p className="mt-0.5 text-xs font-semibold text-green-600">
                    Выбрано: {activeCount}
                  </p>
                )}
              </div>
            </div>

            {activeCount > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="
                  flex
                  items-center
                  gap-1
                  text-xs
                  font-bold
                  text-gray-400
                  transition
                  hover:text-red-500
                "
              >
                <RotateCcw size={13} />
                Сбросить
              </button>
            )}
          </div>
        </div>

        {/* CATEGORY */}

        <FilterSection
          title="Категория"
          open={openSections.category}
          onClick={() =>
            toggleSection("category")
          }
        >
          <div className="space-y-1">
            {categories.map((item) => (
              <FilterCheckbox
                key={item.value}
                label={item.name}
                active={checked(
                  "category",
                  item.value
                )}
                onClick={() =>
                  toggleFilter(
                    "category",
                    item.value
                  )
                }
              />
            ))}
          </div>
        </FilterSection>

        {/* BRAND */}

        <FilterSection
          title="Бренд"
          open={openSections.brand}
          onClick={() =>
            toggleSection("brand")
          }
        >
          <div className="space-y-1">
            {brands.map((item) => (
              <FilterCheckbox
                key={item}
                label={item}
                active={checked(
                  "brand",
                  item
                )}
                onClick={() =>
                  toggleFilter(
                    "brand",
                    item
                  )
                }
              />
            ))}
          </div>
        </FilterSection>

        {/* CONDITION */}

        <FilterSection
          title="Состояние"
          open={openSections.condition}
          onClick={() =>
            toggleSection("condition")
          }
        >
          <div className="space-y-1">
            {conditions.map((item) => (
              <FilterCheckbox
                key={item.value}
                label={item.name}
                active={checked(
                  "condition",
                  item.value
                )}
                onClick={() =>
                  toggleFilter(
                    "condition",
                    item.value
                  )
                }
              />
            ))}
          </div>
        </FilterSection>

        {/* MEMORY */}

        <FilterSection
          title="Память"
          open={openSections.storage}
          onClick={() =>
            toggleSection("storage")
          }
        >
          <div className="grid grid-cols-2 gap-2">
            {memories.map((item) => {
              const active = checked(
                "storage",
                item.value
              );

              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() =>
                    toggleFilter(
                      "storage",
                      item.value
                    )
                  }
                  className={`
                    rounded-lg
                    border
                    px-3
                    py-2.5
                    text-xs
                    font-bold
                    transition
                    ${
                      active
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-gray-200 bg-white text-gray-600 hover:border-green-300 hover:bg-green-50/40 hover:text-green-700"
                    }
                  `}
                >
                  {item.name}
                </button>
              );
            })}
          </div>
        </FilterSection>

        {/* BATTERY */}

        <FilterSection
          title="Аккумулятор"
          open={openSections.battery}
          onClick={() =>
            toggleSection("battery")
          }
        >
          <FilterCheckbox
            label="90% и выше"
            active={
              params.get("battery") === "90"
            }
            onClick={() =>
              toggleFilter(
                "battery",
                "90"
              )
            }
          />
        </FilterSection>

        {/* ACTIVE FILTERS */}

        {activeCount > 0 && (
          <div
            className="
              border-t
              border-gray-100
              bg-gray-50/70
              px-5
              py-4
            "
          >
            <div
              className="
                mb-2
                text-[10px]
                font-extrabold
                uppercase
                tracking-[0.12em]
                text-gray-400
              "
            >
              Активные фильтры
            </div>

            <div className="flex flex-wrap gap-1.5">
              {params
                .get("category")
                ?.split(",")
                .filter(Boolean)
                .map((value) => (
                  <ActiveTag
                    key={`category-${value}`}
                    label={
                      categories.find(
                        (item) =>
                          item.value === value
                      )?.name || value
                    }
                    onRemove={() =>
                      toggleFilter(
                        "category",
                        value
                      )
                    }
                  />
                ))}

              {params
                .get("brand")
                ?.split(",")
                .filter(Boolean)
                .map((value) => (
                  <ActiveTag
                    key={`brand-${value}`}
                    label={value}
                    onRemove={() =>
                      toggleFilter(
                        "brand",
                        value
                      )
                    }
                  />
                ))}

              {params
                .get("condition")
                ?.split(",")
                .filter(Boolean)
                .map((value) => (
                  <ActiveTag
                    key={`condition-${value}`}
                    label={value}
                    onRemove={() =>
                      toggleFilter(
                        "condition",
                        value
                      )
                    }
                  />
                ))}

              {params
                .get("storage")
                ?.split(",")
                .filter(Boolean)
                .map((value) => (
                  <ActiveTag
                    key={`storage-${value}`}
                    label={value}
                    onRemove={() =>
                      toggleFilter(
                        "storage",
                        value
                      )
                    }
                  />
                ))}

              {params.get("battery") && (
                <ActiveTag
                  label="90%+"
                  onRemove={() =>
                    toggleFilter(
                      "battery",
                      "90"
                    )
                  }
                />
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

/* =========================================================
   СЕКЦИЯ ФИЛЬТРА
========================================================= */

function FilterSection({
  title,
  open,
  onClick,
  children,
}: {
  title: string;
  open: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="
        border-b
        border-gray-100
        px-5
        py-4
      "
    >
      <button
        type="button"
        onClick={onClick}
        className="
          flex
          w-full
          items-center
          justify-between
          text-left
        "
      >
        <span
          className="
            text-sm
            font-extrabold
            text-gray-900
          "
        >
          {title}
        </span>

        <span className="text-gray-400">
          {open ? (
            <ChevronUp size={17} />
          ) : (
            <ChevronDown size={17} />
          )}
        </span>
      </button>

      {open && (
        <div className="mt-3">
          {children}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   ЧЕКБОКС
========================================================= */

function FilterCheckbox({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        group
        flex
        w-full
        items-center
        gap-3
        rounded-lg
        px-2
        py-2
        text-left
        transition
        hover:bg-gray-50
      "
    >
      <span
        className={`
          flex
          h-[18px]
          w-[18px]
          shrink-0
          items-center
          justify-center
          rounded-[5px]
          border
          transition
          ${
            active
              ? "border-green-600 bg-green-600"
              : "border-gray-300 bg-white group-hover:border-green-400"
          }
        `}
      >
        {active && (
          <Check
            size={12}
            strokeWidth={3}
            className="text-white"
          />
        )}
      </span>

      <span
        className={`
          text-sm
          transition
          ${
            active
              ? "font-bold text-gray-950"
              : "font-medium text-gray-600 group-hover:text-gray-950"
          }
        `}
      >
        {label}
      </span>
    </button>
  );
}

/* =========================================================
   АКТИВНЫЙ ФИЛЬТР
========================================================= */

function ActiveTag({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="
        flex
        items-center
        gap-1.5
        rounded-lg
        bg-green-50
        px-2.5
        py-1.5
        text-xs
        font-bold
        text-green-700
        transition
        hover:bg-green-100
      "
    >
      {label}

      <span className="text-green-500">
        ×
      </span>
    </button>
  );
}