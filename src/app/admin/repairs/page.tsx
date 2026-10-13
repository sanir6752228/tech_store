"use client";

import { useEffect, useMemo, useState } from "react";

type Repair = {
  id: number;
  customerName: string;
  phone: string;
  contactMethod: string;
  city: string | null;
  address: string | null;
  deviceType: string;
  brand: string | null;
  model: string | null;
  problem: string;
  description: string | null;
  status: string;
  adminComment: string | null;
  price: number | null;
  photos: string[];
  createdAt: string;
  updatedAt: string;
};

type ApiResponse = {
  success?: boolean;
  repairs?: Repair[];
  error?: string;
};

const STATUSES = [
  "Новая",
  "Диагностика",
  "Ремонт",
  "Готов",
  "Выдан",
  "Отменена",
];

const STATUS_STYLES: Record<string, string> = {
  Новая: "bg-blue-100 text-blue-700 border-blue-200",
  Диагностика:
    "bg-yellow-100 text-yellow-700 border-yellow-200",
  Ремонт:
    "bg-orange-100 text-orange-700 border-orange-200",
  Готов:
    "bg-green-100 text-green-700 border-green-200",
  Выдан:
    "bg-gray-100 text-gray-700 border-gray-200",
  Отменена:
    "bg-red-100 text-red-700 border-red-200",
};

const STATUS_ICONS: Record<string, string> = {
  Новая: "🆕",
  Диагностика: "🔍",
  Ремонт: "🔧",
  Готов: "✅",
  Выдан: "📦",
  Отменена: "❌",
};

export default function AdminRepairsPage() {
  const [repairs, setRepairs] = useState<Repair[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("Все");

  const [selectedRepair, setSelectedRepair] =
    useState<Repair | null>(null);

  const [changingStatus, setChangingStatus] =
    useState(false);

  /*
  |--------------------------------------------------------------------------
  | Загрузка заявок
  |--------------------------------------------------------------------------
  */

  async function loadRepairs() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/repairs", {
        method: "GET",
        cache: "no-store",
      });

      const data: Repair[] | ApiResponse =
        await response.json();

      if (!response.ok) {
        if (
          !Array.isArray(data) &&
          data.error
        ) {
          throw new Error(data.error);
        }

        throw new Error(
          "Не удалось загрузить заявки."
        );
      }

      /*
       * Сейчас твой API возвращает:
       *
       * [
       *   {
       *     id: 1,
       *     customerName: "Санир",
       *     ...
       *   }
       * ]
       *
       * Поэтому первым делом проверяем массив.
       */

      if (Array.isArray(data)) {
        setRepairs(data);
        return;
      }

      /*
       * Дополнительно поддерживаем формат:
       *
       * {
       *   success: true,
       *   repairs: [...]
       * }
       */

      if (Array.isArray(data.repairs)) {
        setRepairs(data.repairs);
        return;
      }

      setRepairs([]);

      throw new Error(
        "API вернул неожиданный формат данных."
      );
    } catch (err) {
      console.error(
        "Ошибка загрузки заявок:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Не удалось загрузить заявки."
      );

      setRepairs([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRepairs();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Изменение статуса
  |--------------------------------------------------------------------------
  */

  async function changeStatus(
    repairId: number,
    status: string
  ) {
    try {
      setChangingStatus(true);
      setError("");

      const response = await fetch(
        "/api/repairs",
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            id: repairId,
            status,
          }),
        }
      );

      const data: ApiResponse =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Не удалось изменить статус."
        );
      }

      /*
       * Обновляем список.
       */

      setRepairs((current) =>
        current.map((repair) =>
          repair.id === repairId
            ? {
                ...repair,
                status,
                updatedAt:
                  new Date().toISOString(),
              }
            : repair
        )
      );

      /*
       * Обновляем открытую заявку.
       */

      setSelectedRepair((current) =>
        current &&
        current.id === repairId
          ? {
              ...current,
              status,
              updatedAt:
                new Date().toISOString(),
            }
          : current
      );
    } catch (err) {
      console.error(
        "Ошибка изменения статуса:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Не удалось изменить статус."
      );
    } finally {
      setChangingStatus(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Статистика
  |--------------------------------------------------------------------------
  */

  const statistics = useMemo(() => {
    return {
      total: repairs.length,

      new: repairs.filter(
        (repair) =>
          repair.status === "Новая"
      ).length,

      diagnostics: repairs.filter(
        (repair) =>
          repair.status === "Диагностика"
      ).length,

      repair: repairs.filter(
        (repair) =>
          repair.status === "Ремонт"
      ).length,

      ready: repairs.filter(
        (repair) =>
          repair.status === "Готов"
      ).length,

      issued: repairs.filter(
        (repair) =>
          repair.status === "Выдан"
      ).length,
    };
  }, [repairs]);

  /*
  |--------------------------------------------------------------------------
  | Фильтрация
  |--------------------------------------------------------------------------
  */

  const filteredRepairs = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    return repairs.filter((repair) => {
      const matchesStatus =
        statusFilter === "Все" ||
        repair.status === statusFilter;

      if (!matchesStatus) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const text = [
        repair.customerName,
        repair.phone,
        repair.city || "",
        repair.address || "",
        repair.deviceType,
        repair.brand || "",
        repair.model || "",
        repair.problem,
        repair.description || "",
      ]
        .join(" ")
        .toLowerCase();

      return text.includes(
        normalizedSearch
      );
    });
  }, [
    repairs,
    search,
    statusFilter,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Формат даты
  |--------------------------------------------------------------------------
  */

  function formatDate(date: string) {
    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Дата неизвестна";
    }

    return parsedDate.toLocaleString(
      "ru-RU",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Стиль статуса
  |--------------------------------------------------------------------------
  */

  function getStatusClass(
    status: string
  ) {
    return (
      STATUS_STYLES[status] ||
      "bg-gray-100 text-gray-700 border-gray-200"
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <main className="min-h-screen bg-gray-100">
      {/* =========================================================
          HEADER
      ========================================================= */}

      <header className="sticky top-0 z-40 border-b border-white/10 bg-black text-white shadow-xl">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-4 md:px-8">
          <div>
            <div className="text-xl font-black tracking-tight">
              TECH
              <span className="text-green-500">
                STORE
              </span>
            </div>

            <div className="text-xs text-gray-400">
              Панель администратора
            </div>
          </div>

          <a
            href="/"
            className="rounded-xl border border-white/10 px-4 py-2 text-sm font-bold text-gray-300 transition hover:border-green-500 hover:text-white"
          >
            ← На сайт
          </a>
        </div>
      </header>

      <div className="mx-auto max-w-[1600px] px-4 py-8 md:px-8">
        {/* =======================================================
            TITLE
        ======================================================= */}

        <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <div className="mb-2 text-sm font-black uppercase tracking-wider text-green-600">
              Сервис
            </div>

            <h1 className="text-4xl font-black text-gray-900">
              Заявки на ремонт
            </h1>

            <p className="mt-2 text-gray-500">
              Управление заявками клиентов и
              статусами ремонта.
            </p>
          </div>

          <button
            type="button"
            onClick={loadRepairs}
            disabled={loading}
            className="rounded-xl bg-black px-5 py-3 font-bold text-white transition hover:bg-gray-800 disabled:opacity-50"
          >
            {loading
              ? "Загрузка..."
              : "↻ Обновить"}
          </button>
        </div>

        {/* =======================================================
            ERROR
        ======================================================= */}

        {error && (
          <div className="mb-6 flex items-start justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 p-4 font-bold text-red-700">
            <div>
              ❌ {error}
            </div>

            <button
              type="button"
              onClick={() => setError("")}
              className="shrink-0 text-xl leading-none text-red-400 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}

        {/* =======================================================
            STATISTICS
        ======================================================= */}

        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          <StatCard
            title="Всего"
            value={statistics.total}
            icon="📋"
          />

          <StatCard
            title="Новые"
            value={statistics.new}
            icon="🆕"
          />

          <StatCard
            title="Диагностика"
            value={statistics.diagnostics}
            icon="🔍"
          />

          <StatCard
            title="В ремонте"
            value={statistics.repair}
            icon="🔧"
          />

          <StatCard
            title="Готовы"
            value={statistics.ready}
            icon="✅"
          />

          <StatCard
            title="Выданы"
            value={statistics.issued}
            icon="📦"
          />
        </div>

        {/* =======================================================
            FILTERS
        ======================================================= */}

        <div className="mb-6 rounded-2xl bg-white p-4 shadow-sm md:p-5">
          <div className="grid gap-4 lg:grid-cols-[1fr_250px_auto]">
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                🔎
              </span>

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Поиск по имени, телефону, устройству..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 outline-none transition focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
              className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 font-bold outline-none focus:border-green-500"
            >
              <option value="Все">
                Все статусы
              </option>

              {STATUSES.map((status) => (
                <option
                  key={status}
                  value={status}
                >
                  {STATUS_ICONS[status]}{" "}
                  {status}
                </option>
              ))}
            </select>

            <div className="flex items-center justify-center rounded-xl bg-gray-100 px-5 py-3 text-sm font-bold text-gray-600">
              Найдено:
              <span className="ml-1 text-gray-900">
                {filteredRepairs.length}
              </span>
            </div>
          </div>
        </div>

        {/* =======================================================
            LOADING
        ======================================================= */}

        {loading &&
          repairs.length === 0 && (
            <div className="rounded-3xl bg-white p-16 text-center shadow-sm">
              <div className="mb-4 text-5xl">
                ⏳
              </div>

              <div className="text-xl font-black">
                Загружаем заявки...
              </div>
            </div>
          )}

        {/* =======================================================
            EMPTY
        ======================================================= */}

        {!loading &&
          filteredRepairs.length === 0 && (
            <div className="rounded-3xl bg-white p-16 text-center shadow-sm">
              <div className="mb-4 text-6xl">
                📭
              </div>

              <h2 className="text-2xl font-black text-gray-900">
                Заявок не найдено
              </h2>

              <p className="mt-2 text-gray-500">
                {repairs.length > 0
                  ? "Попробуйте изменить фильтры."
                  : "Новых заявок пока нет."}
              </p>

              {repairs.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("Все");
                  }}
                  className="mt-5 rounded-xl bg-black px-5 py-3 text-sm font-black text-white transition hover:bg-gray-800"
                >
                  Сбросить фильтры
                </button>
              )}
            </div>
          )}

        {/* =======================================================
            REPAIRS
        ======================================================= */}

        {filteredRepairs.length > 0 && (
          <div className="grid gap-5">
            {filteredRepairs.map(
              (repair) => (
                <div
                  key={repair.id}
                  className="overflow-hidden rounded-3xl bg-white shadow-sm transition hover:shadow-lg"
                >
                  <div className="p-5 md:p-6">
                    <div className="flex flex-col justify-between gap-5 lg:flex-row">
                      {/* LEFT */}

                      <div className="flex min-w-0 gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-green-100 text-2xl">
                          {repair.deviceType ===
                          "Телефон"
                            ? "📱"
                            : repair.deviceType ===
                              "Планшет"
                            ? "📲"
                            : repair.deviceType ===
                              "Ноутбук"
                            ? "💻"
                            : "🔧"}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-3">
                            <h2 className="text-xl font-black text-gray-900">
                              {
                                repair.customerName
                              }
                            </h2>

                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-black ${getStatusClass(
                                repair.status
                              )}`}
                            >
                              {STATUS_ICONS[
                                repair.status
                              ] || "📌"}{" "}
                              {repair.status}
                            </span>
                          </div>

                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                            <span>
                              📞{" "}
                              {
                                repair.phone
                              }
                            </span>

                            <span>
                              💬{" "}
                              {
                                repair.contactMethod
                              }
                            </span>

                            {repair.city && (
                              <span>
                                📍{" "}
                                {
                                  repair.city
                                }
                              </span>
                            )}
                          </div>

                          <div className="mt-3 font-bold text-gray-800">
                            {repair.brand
                              ? `${repair.brand} `
                              : ""}
                            {repair.model ||
                              repair.deviceType}
                          </div>

                          <div className="mt-1 text-sm text-gray-500">
                            Проблема:{" "}
                            <span className="font-semibold text-gray-700">
                              {
                                repair.problem
                              }
                            </span>
                          </div>

                          <div className="mt-3 text-xs text-gray-400">
                            Заявка №
                            {repair.id} •{" "}
                            {formatDate(
                              repair.createdAt
                            )}
                          </div>
                        </div>
                      </div>

                      {/* RIGHT */}

                      <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedRepair(
                              repair
                            )
                          }
                          className="rounded-xl bg-black px-5 py-3 text-sm font-black text-white transition hover:bg-gray-800"
                        >
                          Открыть заявку
                        </button>

                        <select
                          value={
                            repair.status
                          }
                          disabled={
                            changingStatus
                          }
                          onChange={(event) =>
                            changeStatus(
                              repair.id,
                              event.target
                                .value
                            )
                          }
                          className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold outline-none focus:border-green-500 disabled:opacity-50"
                        >
                          {STATUSES.map(
                            (status) => (
                              <option
                                key={
                                  status
                                }
                                value={
                                  status
                                }
                              >
                                {
                                  STATUS_ICONS[
                                    status
                                  ]
                                }{" "}
                                {status}
                              </option>
                            )
                          )}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* PREVIEW PHOTOS */}

                  {repair.photos?.length >
                    0 && (
                    <div className="border-t border-gray-100 bg-gray-50 px-5 py-4 md:px-6">
                      <div className="flex items-center gap-3 overflow-x-auto">
                        {repair.photos
                          .slice(0, 5)
                          .map(
                            (
                              photo,
                              index
                            ) => (
                              <img
                                key={`${photo}-${index}`}
                                src={photo}
                                alt={`Фото заявки ${repair.id}`}
                                className="h-16 w-16 shrink-0 rounded-xl object-cover"
                              />
                            )
                          )}

                        {repair.photos.length >
                          5 && (
                          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-black text-sm font-black text-white">
                            +
                            {repair.photos
                              .length -
                              5}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* =========================================================
          MODAL
      ========================================================= */}

      {selectedRepair && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setSelectedRepair(null);
            }
          }}
        >
          <div className="mx-auto my-8 max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            {/* MODAL HEADER */}

            <div className="flex items-start justify-between gap-5 bg-black p-6 text-white">
              <div>
                <div className="text-sm font-bold text-green-400">
                  Заявка №
                  {selectedRepair.id}
                </div>

                <h2 className="mt-1 text-2xl font-black">
                  {
                    selectedRepair.customerName
                  }
                </h2>

                <div className="mt-2 text-sm text-gray-400">
                  Создана{" "}
                  {formatDate(
                    selectedRepair.createdAt
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedRepair(
                    null
                  )
                }
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-xl transition hover:bg-white/20"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              <div className="grid gap-8 lg:grid-cols-2">
                {/* CUSTOMER */}

                <div>
                  <h3 className="mb-4 text-lg font-black text-gray-900">
                    👤 Клиент
                  </h3>

                  <div className="space-y-3 rounded-2xl bg-gray-50 p-5">
                    <InfoRow
                      label="Имя"
                      value={
                        selectedRepair.customerName
                      }
                    />

                    <InfoRow
                      label="Телефон"
                      value={
                        selectedRepair.phone
                      }
                    />

                    <InfoRow
                      label="Связь"
                      value={
                        selectedRepair.contactMethod
                      }
                    />

                    {selectedRepair.city && (
                      <InfoRow
                        label="Город"
                        value={
                          selectedRepair.city
                        }
                      />
                    )}

                    {selectedRepair.address && (
                      <InfoRow
                        label="Адрес"
                        value={
                          selectedRepair.address
                        }
                      />
                    )}
                  </div>
                </div>

                {/* DEVICE */}

                <div>
                  <h3 className="mb-4 text-lg font-black text-gray-900">
                    🔧 Устройство
                  </h3>

                  <div className="space-y-3 rounded-2xl bg-gray-50 p-5">
                    <InfoRow
                      label="Тип"
                      value={
                        selectedRepair.deviceType
                      }
                    />

                    <InfoRow
                      label="Бренд"
                      value={
                        selectedRepair.brand ||
                        "Не указан"
                      }
                    />

                    <InfoRow
                      label="Модель"
                      value={
                        selectedRepair.model ||
                        "Не указана"
                      }
                    />

                    <InfoRow
                      label="Проблема"
                      value={
                        selectedRepair.problem
                      }
                    />
                  </div>
                </div>
              </div>

              {/* DESCRIPTION */}

              {selectedRepair.description && (
                <div className="mt-8">
                  <h3 className="mb-4 text-lg font-black text-gray-900">
                    📝 Описание проблемы
                  </h3>

                  <div className="rounded-2xl bg-gray-50 p-5 leading-7 text-gray-700">
                    {
                      selectedRepair.description
                    }
                  </div>
                </div>
              )}

              {/* PHOTOS */}

              {selectedRepair.photos?.length >
                0 && (
                <div className="mt-8">
                  <h3 className="mb-4 text-lg font-black text-gray-900">
                    📷 Фотографии
                  </h3>

                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                    {selectedRepair.photos.map(
                      (
                        photo,
                        index
                      ) => (
                        <a
                          key={`${photo}-${index}`}
                          href={photo}
                          target="_blank"
                          rel="noreferrer"
                          className="group overflow-hidden rounded-2xl bg-gray-100"
                        >
                          <img
                            src={photo}
                            alt={`Фото ${index + 1}`}
                            className="aspect-square w-full object-cover transition duration-300 group-hover:scale-105"
                          />
                        </a>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* STATUS */}

              <div className="mt-8 border-t border-gray-100 pt-8">
                <h3 className="mb-4 text-lg font-black text-gray-900">
                  📌 Статус заявки
                </h3>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {STATUSES.map(
                    (status) => (
                      <button
                        key={status}
                        type="button"
                        disabled={
                          changingStatus
                        }
                        onClick={() =>
                          changeStatus(
                            selectedRepair.id,
                            status
                          )
                        }
                        className={`rounded-xl border px-4 py-3 text-sm font-black transition ${
                          selectedRepair.status ===
                          status
                            ? getStatusClass(
                                status
                              )
                            : "border-gray-200 bg-white text-gray-600 hover:border-gray-400"
                        } disabled:opacity-50`}
                      >
                        {
                          STATUS_ICONS[
                            status
                          ]
                        }{" "}
                        {status}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* PRICE */}

              {selectedRepair.price !==
                null && (
                <div className="mt-8 rounded-2xl bg-green-50 p-5">
                  <div className="text-sm font-bold text-green-700">
                    Стоимость ремонта
                  </div>

                  <div className="mt-1 text-3xl font-black text-gray-900">
                    {selectedRepair.price.toLocaleString(
                      "ru-RU"
                    )}{" "}
                    ₽
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

/*
|--------------------------------------------------------------------------
| STAT CARD
|--------------------------------------------------------------------------
*/

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-bold text-gray-500">
            {title}
          </div>

          <div className="mt-2 text-3xl font-black text-gray-900">
            {value}
          </div>
        </div>

        <div className="text-2xl">
          {icon}
        </div>
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| INFO ROW
|--------------------------------------------------------------------------
*/

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-1 border-b border-gray-200 pb-3 last:border-0 last:pb-0 sm:flex-row sm:justify-between sm:gap-5">
      <span className="text-sm font-bold text-gray-400">
        {label}
      </span>

      <span className="text-sm font-bold text-gray-900 sm:text-right">
        {value}
      </span>
    </div>
  );
}