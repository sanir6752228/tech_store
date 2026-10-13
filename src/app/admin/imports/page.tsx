"use client";

import AdminSidebar from "@/components/AdminSidebar";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileText,
  Loader2,
  PackageCheck,
  RefreshCw,
  ShieldCheck,
  X,
  XCircle,
} from "lucide-react";

/* ========================================================= */
/* TYPES */
/* ========================================================= */

interface ProductDraft {
  id: number;

  name: string;
  brand: string | null;
  model: string | null;
  category: string | null;
  condition: string | null;
  memory: string | null;
  color: string | null;
  battery: string | null;

  price: number | null;
  oldPrice: number | null;

  description: string | null;

  display: string | null;
  processor: string | null;
  camera: string | null;
  sim: string | null;
  year: number | null;

  images: string[];

  telegramVideo: string | null;

  sourceType: string | null;
  sourceUrl: string | null;

  ocrConfidence: number | null;

  researchVerified: boolean;
  researchSource: string | null;
  researchUrl: string | null;

  status: string;

  adminComment: string | null;

  createdAt: string;
  updatedAt: string;
}

type Filter =
  | "ALL"
  | "PENDING"
  | "APPROVED"
  | "REJECTED";

type ConfirmAction = {
  type: "approve" | "reject";
  draft: ProductDraft;
};

/* ========================================================= */
/* HELPERS */
/* ========================================================= */

function formatPrice(price: number | null) {
  if (price === null || price === undefined) {
    return "—";
  }

  return `${price.toLocaleString("ru-RU")} ₽`;
}

function formatDate(date: string) {
  return new Date(date).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getCategoryName(category: string | null) {
  if (!category) {
    return "Без категории";
  }

  const categories: Record<string, string> = {
    phones: "Телефоны",
    phone: "Телефоны",

    tablets: "Планшеты",
    tablet: "Планшеты",

    accessories: "Аксессуары",
    accessory: "Аксессуары",

    charging: "Зарядка",

    chargers: "Зарядки",
    charger: "Зарядки",

    laptops: "Ноутбуки",
    laptop: "Ноутбуки",

    headphones: "Наушники",

    watches: "Смарт-часы",
    smartwatches: "Смарт-часы",

    cases: "Чехлы",

    cables: "Кабели",

    other: "Другое",
  };

  return categories[category.toLowerCase()] || category;
}

function getStatusInfo(status: string) {
  switch (status) {
    case "APPROVED":
      return {
        label: "Опубликован",
        className:
          "border-emerald-200 bg-emerald-50 text-emerald-700",
        icon: CheckCircle2,
      };

    case "REJECTED":
      return {
        label: "Отклонён",
        className:
          "border-red-200 bg-red-50 text-red-700",
        icon: XCircle,
      };

    default:
      return {
        label: "Ожидает проверки",
        className:
          "border-amber-200 bg-amber-50 text-amber-700",
        icon: Clock3,
      };
  }
}

function getConditionClass(condition: string | null) {
  switch (condition) {
    case "Новый":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "Б/У":
      return "border-orange-200 bg-orange-50 text-orange-700";

    case "После ремонта":
      return "border-blue-200 bg-blue-50 text-blue-700";

    default:
      return "border-gray-200 bg-gray-50 text-gray-700";
  }
}

/* ========================================================= */
/* PAGE */
/* ========================================================= */

export default function AdminImportsPage() {
  const [drafts, setDrafts] = useState<ProductDraft[]>([]);

  const [loading, setLoading] = useState(true);

  const [actionId, setActionId] =
    useState<number | null>(null);

  const [filter, setFilter] =
    useState<Filter>("ALL");

  const [error, setError] = useState("");

  const [selectedDraft, setSelectedDraft] =
    useState<ProductDraft | null>(null);

  /*
   * Отдельное состояние красивого окна подтверждения.
   * Здесь уже хранится полноценный объект товара,
   * поэтому null-проблем с selectedDraft нет.
   */
  const [confirmAction, setConfirmAction] =
    useState<ConfirmAction | null>(null);

  /*
   * Сообщение об успешном действии.
   */
  const [successMessage, setSuccessMessage] =
    useState("");

  /*
   * Ошибка непосредственно внутри окна подтверждения.
   */
  const [confirmError, setConfirmError] =
    useState("");

  /* ======================================================= */
  /* LOAD DRAFTS */
  /* ======================================================= */

  async function loadDrafts() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/admin/imports",
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Не удалось загрузить импорты"
        );
      }

      setDrafts(data.drafts || []);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Не удалось загрузить импорты"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDrafts();
  }, []);

  /* ======================================================= */
  /* OPEN CONFIRMATION */
  /* ======================================================= */

  function openApproveConfirmation(
    draft: ProductDraft
  ) {
    setConfirmError("");

    setConfirmAction({
      type: "approve",
      draft,
    });
  }

  function openRejectConfirmation(
    draft: ProductDraft
  ) {
    setConfirmError("");

    setConfirmAction({
      type: "reject",
      draft,
    });
  }

  /* ======================================================= */
  /* CONFIRM ACTION */
  /* ======================================================= */

  async function handleConfirmAction(
    action: ConfirmAction
  ) {
    const { draft, type } = action;

    try {
      setActionId(draft.id);
      setConfirmError("");
      setError("");

      const endpoint =
        type === "approve"
          ? `/api/admin/imports/${draft.id}/approve`
          : `/api/admin/imports/${draft.id}/reject`;

      const response = await fetch(endpoint, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            (type === "approve"
              ? "Не удалось опубликовать товар"
              : "Не удалось отклонить импорт")
        );
      }

      /*
       * Закрываем окно подтверждения
       * только после успешного ответа сервера.
       */
      setConfirmAction(null);

      /*
       * Если открыты детали этого товара —
       * закрываем их тоже.
       */
      setSelectedDraft((current) => {
        if (current?.id === draft.id) {
          return null;
        }

        return current;
      });

      await loadDrafts();

      /*
       * Красивое уведомление вместо window.alert().
       */
      if (type === "approve") {
        const productId =
          data?.product?.id;

        setSuccessMessage(
          productId
            ? `Товар опубликован в каталоге. ID товара: ${productId}`
            : "Товар успешно опубликован в каталоге."
        );
      } else {
        setSuccessMessage(
          "Импорт успешно отклонён."
        );
      }

      /*
       * Убираем уведомление автоматически.
       */
      window.setTimeout(() => {
        setSuccessMessage("");
      }, 4500);
    } catch (error) {
      console.error(error);

      const message =
        error instanceof Error
          ? error.message
          : type === "approve"
          ? "Не удалось опубликовать товар"
          : "Не удалось отклонить импорт";

      /*
       * Ошибка показывается непосредственно
       * внутри красивого окна.
       */
      setConfirmError(message);
    } finally {
      setActionId(null);
    }
  }

  /* ======================================================= */
  /* FILTERS */
  /* ======================================================= */

  const filteredDrafts = drafts.filter(
    (draft) => {
      if (filter === "ALL") {
        return true;
      }

      return draft.status === filter;
    }
  );

  const pendingCount = drafts.filter(
    (draft) => draft.status === "PENDING"
  ).length;

  const approvedCount = drafts.filter(
    (draft) => draft.status === "APPROVED"
  ).length;

  const rejectedCount = drafts.filter(
    (draft) => draft.status === "REJECTED"
  ).length;

  /* ======================================================= */
  /* RENDER */
  /* ======================================================= */

  return (
    <div className="flex min-h-screen bg-[#f5f6f7] text-gray-900">
      {/* ================================================= */}
      {/* SIDEBAR */}
      {/* ================================================= */}

      <AdminSidebar />

      <main className="min-w-0 flex-1">
        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/90 backdrop-blur">
          <div className="flex items-center justify-between gap-4 px-6 py-4 lg:px-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-green-600">
                TECHSTORE ADMIN
              </p>

              <h1 className="mt-1 text-xl font-black">
                Импорт товаров
              </h1>
            </div>

            <Link
              href="/admin"
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
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>
          </div>
        </header>

        <div className="p-6 lg:p-8">
          {/* ================================================= */}
          {/* TITLE */}
          {/* ================================================= */}

          <section className="mb-7">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
              <div>
                <h2 className="text-3xl font-black tracking-tight">
                  Импорт товаров
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
                  Управление товарами, полученными
                  из Telegram Stories. Проверяй данные
                  перед публикацией в основном
                  каталоге.
                </p>
              </div>

              <button
                type="button"
                onClick={loadDrafts}
                disabled={loading}
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
                  shadow-sm
                  transition
                  hover:border-green-300
                  hover:text-green-700
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                <RefreshCw
                  className={`h-4 w-4 ${
                    loading
                      ? "animate-spin"
                      : ""
                  }`}
                />

                Обновить
              </button>
            </div>
          </section>

          {/* ================================================= */}
          {/* STATS */}
          {/* ================================================= */}

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <ImportStat
              icon="📥"
              title="Всего импортов"
              value={drafts.length}
              description="Получено системой"
            />

            <ImportStat
              icon="⏳"
              title="На проверке"
              value={pendingCount}
              description="Требуют решения"
              accent="amber"
            />

            <ImportStat
              icon="✅"
              title="Опубликовано"
              value={approvedCount}
              description="Добавлено в каталог"
              accent="green"
            />

            <ImportStat
              icon="✕"
              title="Отклонено"
              value={rejectedCount}
              description="Не опубликовано"
              accent="red"
            />
          </section>

          {/* ================================================= */}
          {/* PIPELINE */}
          {/* ================================================= */}

          <section className="mt-7 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-6 py-5">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-black text-lg text-green-400">
                  <PackageCheck className="h-5 w-5" />
                </div>

                <div>
                  <h3 className="font-black text-gray-900">
                    Система импорта
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    Telegram → распознавание →
                    проверка → публикация
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 p-6 md:grid-cols-4">
              <PipelineStep
                number="01"
                title="Telegram"
                description="Получение Stories"
                active
              />

              <PipelineStep
                number="02"
                title="OCR"
                description="Распознавание текста"
                active
              />

              <PipelineStep
                number="03"
                title="Проверка"
                description="Контроль данных"
                active
              />

              <PipelineStep
                number="04"
                title="Каталог"
                description="Публикация товара"
              />
            </div>
          </section>

          {/* ================================================= */}
          {/* IMPORTS */}
          {/* ================================================= */}

          <section className="mt-7 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
            {/* FILTER HEADER */}

            <div className="flex flex-col justify-between gap-4 border-b border-gray-100 px-6 py-5 md:flex-row md:items-center">
              <div>
                <h3 className="font-black text-gray-900">
                  Все импорты
                </h3>

                <p className="mt-1 text-xs text-gray-400">
                  Управление импортированными товарами
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <FilterButton
                  active={filter === "ALL"}
                  onClick={() =>
                    setFilter("ALL")
                  }
                >
                  Все

                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">
                    {drafts.length}
                  </span>
                </FilterButton>

                <FilterButton
                  active={filter === "PENDING"}
                  onClick={() =>
                    setFilter("PENDING")
                  }
                >
                  На проверке

                  {pendingCount > 0 && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                      {pendingCount}
                    </span>
                  )}
                </FilterButton>

                <FilterButton
                  active={filter === "APPROVED"}
                  onClick={() =>
                    setFilter("APPROVED")
                  }
                >
                  Опубликованные
                </FilterButton>

                <FilterButton
                  active={filter === "REJECTED"}
                  onClick={() =>
                    setFilter("REJECTED")
                  }
                >
                  Отклонённые
                </FilterButton>
              </div>
            </div>

            {/* ERROR */}

            {error && (
              <div className="m-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <XCircle className="mt-0.5 h-5 w-5 shrink-0" />

                <div>
                  <p className="font-black">
                    Произошла ошибка
                  </p>

                  <p className="mt-1">
                    {error}
                  </p>
                </div>
              </div>
            )}

            {/* LOADING */}

            {loading && (
              <div className="flex min-h-[300px] items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-gray-500">
                  <Loader2 className="h-8 w-8 animate-spin text-green-600" />

                  <span className="text-sm font-semibold">
                    Загружаем импорты...
                  </span>
                </div>
              </div>
            )}

            {/* EMPTY */}

            {!loading &&
              filteredDrafts.length === 0 && (
                <div className="px-6 py-20 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
                    <FileText className="h-7 w-7 text-gray-400" />
                  </div>

                  <h3 className="mt-5 text-xl font-black">
                    Импортов пока нет
                  </h3>

                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
                    Здесь появятся товары, которые
                    система получит из Telegram Stories.
                  </p>
                </div>
              )}

            {/* TABLE */}

            {!loading &&
              filteredDrafts.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1100px]">
                    <thead className="bg-gray-50">
                      <tr className="text-left text-xs font-black uppercase tracking-wider text-gray-400">
                        <th className="px-6 py-4">
                          Товар
                        </th>

                        <th className="px-6 py-4">
                          Категория
                        </th>

                        <th className="px-6 py-4">
                          Цена
                        </th>

                        <th className="px-6 py-4">
                          OCR
                        </th>

                        <th className="px-6 py-4">
                          Проверка
                        </th>

                        <th className="px-6 py-4">
                          Статус
                        </th>

                        <th className="px-6 py-4">
                          Дата
                        </th>

                        <th className="px-6 py-4 text-right">
                          Действия
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                      {filteredDrafts.map(
                        (draft) => {
                          const status =
                            getStatusInfo(
                              draft.status
                            );

                          const StatusIcon =
                            status.icon;

                          const isActionLoading =
                            actionId === draft.id;

                          const confidence =
                            draft.ocrConfidence !==
                            null
                              ? Math.round(
                                  draft.ocrConfidence *
                                    100
                                )
                              : null;

                          return (
                            <tr
                              key={draft.id}
                              className="group transition hover:bg-gray-50"
                            >
                              {/* PRODUCT */}

                              <td className="px-6 py-5">
                                <div className="flex items-center gap-4">
                                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100">
                                    {draft.images?.[0] ? (
                                      <img
                                        src={
                                          draft.images[0]
                                        }
                                        alt={
                                          draft.name
                                        }
                                        className="h-full w-full object-contain p-2"
                                      />
                                    ) : (
                                      <span className="text-2xl">
                                        📱
                                      </span>
                                    )}
                                  </div>

                                  <div className="min-w-0">
                                    <div className="max-w-[260px] truncate font-black text-gray-900">
                                      {
                                        draft.name
                                      }
                                    </div>

                                    <div className="mt-1 max-w-[260px] truncate text-xs text-gray-400">
                                      {[
                                        draft.brand,
                                        draft.model,
                                        draft.memory,
                                      ]
                                        .filter(
                                          Boolean
                                        )
                                        .join(
                                          " · "
                                        ) ||
                                        "Данные отсутствуют"}
                                    </div>

                                    {draft.condition && (
                                      <span
                                        className={`mt-2 inline-flex rounded-lg border px-2 py-1 text-[10px] font-black ${getConditionClass(
                                          draft.condition
                                        )}`}
                                      >
                                        {
                                          draft.condition
                                        }
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>

                              {/* CATEGORY */}

                              <td className="px-6 py-5">
                                <span className="inline-flex rounded-xl bg-gray-100 px-3 py-2 text-xs font-black text-gray-700">
                                  {getCategoryName(
                                    draft.category
                                  )}
                                </span>
                              </td>

                              {/* PRICE */}

                              <td className="px-6 py-5">
                                <div className="font-black text-gray-900">
                                  {formatPrice(
                                    draft.price
                                  )}
                                </div>

                                {draft.oldPrice && (
                                  <div className="mt-1 text-xs text-gray-400 line-through">
                                    {formatPrice(
                                      draft.oldPrice
                                    )}
                                  </div>
                                )}
                              </td>

                              {/* OCR */}

                              <td className="px-6 py-5">
                                <div className="font-black text-gray-900">
                                  {confidence !==
                                  null
                                    ? `${confidence}%`
                                    : "—"}
                                </div>

                                <div className="mt-1 text-xs text-gray-400">
                                  распознавание
                                </div>
                              </td>

                              {/* RESEARCH */}

                              <td className="px-6 py-5">
                                {draft.researchVerified ? (
                                  <span className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-black text-green-700">
                                    <ShieldCheck className="h-3.5 w-3.5" />
                                    Проверено
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-500">
                                    Не проверено
                                  </span>
                                )}
                              </td>

                              {/* STATUS */}

                              <td className="px-6 py-5">
                                <span
                                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-black ${status.className}`}
                                >
                                  <StatusIcon className="h-3.5 w-3.5" />

                                  {
                                    status.label
                                  }
                                </span>
                              </td>

                              {/* DATE */}

                              <td className="px-6 py-5">
                                <div className="text-xs font-bold text-gray-700">
                                  {formatDate(
                                    draft.createdAt
                                  )}
                                </div>
                              </td>

                              {/* ACTIONS */}

                              <td className="px-6 py-5">
                                <div className="flex justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setSelectedDraft(
                                        draft
                                      )
                                    }
                                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs font-black text-gray-700 transition hover:border-green-300 hover:text-green-700"
                                  >
                                    <FileText className="h-4 w-4" />
                                    Открыть
                                  </button>

                                  {draft.status ===
                                    "PENDING" && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        openApproveConfirmation(
                                          draft
                                        )
                                      }
                                      disabled={
                                        isActionLoading
                                      }
                                      className="inline-flex items-center justify-center rounded-xl bg-green-600 px-3.5 py-2.5 text-xs font-black text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                                      title="Опубликовать"
                                    >
                                      {isActionLoading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <Check className="h-4 w-4" />
                                      )}
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        }
                      )}
                    </tbody>
                  </table>
                </div>
              )}
          </section>
        </div>
      </main>

      {/* ===================================================== */}
      {/* DETAILS MODAL */}
      {/* ===================================================== */}

      {selectedDraft && (
        <ImportDetailsModal
          draft={selectedDraft}
          actionId={actionId}
          onClose={() =>
            setSelectedDraft(null)
          }
          onApprove={() =>
            openApproveConfirmation(
              selectedDraft
            )
          }
          onReject={() =>
            openRejectConfirmation(
              selectedDraft
            )
          }
        />
      )}

      {/* ===================================================== */}
      {/* CONFIRMATION MODAL */}
      {/* ===================================================== */}

      {confirmAction && (
        <ConfirmationModal
          action={confirmAction}
          loading={
            actionId === confirmAction.draft.id
          }
          error={confirmError}
          onClose={() => {
            if (actionId === null) {
              setConfirmAction(null);
              setConfirmError("");
            }
          }}
          onConfirm={handleConfirmAction}
        />
      )}

      {/* ===================================================== */}
      {/* SUCCESS TOAST */}
      {/* ===================================================== */}

      {successMessage && (
        <div className="fixed bottom-6 right-6 z-[300] w-[min(420px,calc(100vw-32px))]">
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-white p-4 shadow-2xl shadow-black/10">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="font-black text-gray-900">
                Готово
              </p>

              <p className="mt-1 text-sm leading-5 text-gray-600">
                {successMessage}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setSuccessMessage("")
              }
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-900"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ========================================================= */
/* IMPORT STAT */
/* ========================================================= */

function ImportStat({
  icon,
  title,
  value,
  description,
  accent = "gray",
}: {
  icon: string;
  title: string;
  value: number;
  description: string;
  accent?: "gray" | "green" | "amber" | "red";
}) {
  const iconClass = {
    gray: "bg-gray-100",
    green: "bg-green-50",
    amber: "bg-amber-50",
    red: "bg-red-50",
  };

  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl text-xl ${iconClass[accent]}`}
        >
          {icon}
        </div>

        <span className="text-xs font-black uppercase tracking-wider text-gray-400">
          {title}
        </span>
      </div>

      <div className="mt-5 text-3xl font-black tracking-tight text-gray-900">
        {value.toLocaleString("ru-RU")}
      </div>

      <div className="mt-1 text-sm font-medium text-gray-500">
        {description}
      </div>
    </div>
  );
}

/* ========================================================= */
/* PIPELINE */
/* ========================================================= */

function PipelineStep({
  number,
  title,
  description,
  active = false,
}: {
  number: string;
  title: string;
  description: string;
  active?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        active
          ? "border-green-200 bg-green-50/50"
          : "border-gray-200 bg-gray-50"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-black ${
            active
              ? "bg-green-600 text-white"
              : "bg-gray-200 text-gray-500"
          }`}
        >
          {number}
        </div>

        <div>
          <div className="text-sm font-black text-gray-900">
            {title}
          </div>

          <div className="mt-0.5 text-xs text-gray-500">
            {description}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ========================================================= */
/* FILTER BUTTON */
/* ========================================================= */

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-black transition ${
        active
          ? "bg-gray-900 text-white shadow-sm"
          : "border border-gray-200 bg-white text-gray-600 hover:border-green-300 hover:text-green-700"
      }`}
    >
      {children}
    </button>
  );
}

/* ========================================================= */
/* DETAIL ITEM */
/* ========================================================= */

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
      <p className="text-xs font-black uppercase tracking-wider text-gray-400">
        {label}
      </p>

      <p className="mt-1.5 break-words text-sm font-bold text-gray-900">
        {value || "—"}
      </p>
    </div>
  );
}

/* ========================================================= */
/* SECTION TITLE */
/* ========================================================= */

function SectionTitle({
  title,
}: {
  title: string;
}) {
  return (
    <h3 className="mb-4 text-base font-black text-gray-950">
      {title}
    </h3>
  );
}

/* ========================================================= */
/* DETAILS MODAL */
/* ========================================================= */

function ImportDetailsModal({
  draft,
  actionId,
  onClose,
  onApprove,
  onReject,
}: {
  draft: ProductDraft;
  actionId: number | null;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const isLoading = actionId === draft.id;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !isLoading
        ) {
          onClose();
        }
      }}
    >
      <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        {/* HEADER */}

        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white/95 px-6 py-5 backdrop-blur">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-green-600">
              ProductDraft #{draft.id}
            </p>

            <h2 className="mt-1 text-xl font-black">
              {draft.name}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-7 p-6 lg:p-8">
          {/* IMAGES */}

          {draft.images?.length > 0 && (
            <section>
              <SectionTitle title="Изображения" />

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {draft.images.map(
                  (image, index) => (
                    <div
                      key={`${image}-${index}`}
                      className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50"
                    >
                      <img
                        src={image}
                        alt={`${draft.name} ${
                          index + 1
                        }`}
                        className="aspect-square h-full w-full object-contain p-3"
                      />
                    </div>
                  )
                )}
              </div>
            </section>
          )}

          {/* PRODUCT */}

          <section>
            <SectionTitle title="Данные товара" />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <DetailItem
                label="Название"
                value={draft.name}
              />

              <DetailItem
                label="Бренд"
                value={draft.brand}
              />

              <DetailItem
                label="Модель"
                value={draft.model}
              />

              <DetailItem
                label="Категория"
                value={getCategoryName(
                  draft.category
                )}
              />

              <DetailItem
                label="Состояние"
                value={draft.condition}
              />

              <DetailItem
                label="Память"
                value={draft.memory}
              />

              <DetailItem
                label="Цвет"
                value={draft.color}
              />

              <DetailItem
                label="Аккумулятор"
                value={draft.battery}
              />

              <DetailItem
                label="Цена"
                value={formatPrice(
                  draft.price
                )}
              />

              <DetailItem
                label="Старая цена"
                value={formatPrice(
                  draft.oldPrice
                )}
              />

              <DetailItem
                label="Год"
                value={
                  draft.year
                    ? String(draft.year)
                    : null
                }
              />
            </div>
          </section>

          {/* SPECS */}

          <section>
            <SectionTitle title="Характеристики" />

            <div className="grid gap-4 sm:grid-cols-2">
              <DetailItem
                label="Дисплей"
                value={draft.display}
              />

              <DetailItem
                label="Процессор"
                value={draft.processor}
              />

              <DetailItem
                label="Камера"
                value={draft.camera}
              />

              <DetailItem
                label="SIM"
                value={draft.sim}
              />
            </div>
          </section>

          {/* DESCRIPTION */}

          <section>
            <SectionTitle title="Описание" />

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 text-sm leading-7 text-gray-700">
              {draft.description ||
                "Описание отсутствует."}
            </div>
          </section>

          {/* VERIFICATION */}

          <section>
            <SectionTitle title="Проверка данных" />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                <p className="text-xs font-black uppercase tracking-wider text-gray-400">
                  OCR confidence
                </p>

                <p className="mt-2 text-3xl font-black text-gray-950">
                  {draft.ocrConfidence !==
                  null
                    ? `${Math.round(
                        draft.ocrConfidence *
                          100
                      )}%`
                    : "—"}
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                <p className="text-xs font-black uppercase tracking-wider text-gray-400">
                  Web research
                </p>

                <div className="mt-3 flex items-center gap-2">
                  {draft.researchVerified ? (
                    <>
                      <ShieldCheck className="h-5 w-5 text-emerald-600" />

                      <span className="font-black text-emerald-700">
                        Проверено
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-gray-400" />

                      <span className="font-bold text-gray-600">
                        Не проверено
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {draft.researchSource && (
              <div className="mt-4 rounded-2xl border border-gray-200 p-5">
                <p className="text-xs font-black uppercase tracking-wider text-gray-400">
                  Источник
                </p>

                <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <span className="font-black text-gray-900">
                    {draft.researchSource}
                  </span>

                  {draft.researchUrl && (
                    <a
                      href={
                        draft.researchUrl
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-black text-green-600 hover:text-green-700 hover:underline"
                    >
                      Открыть источник

                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* SOURCE */}

          <section>
            <SectionTitle title="Источник импорта" />

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <DetailItem
                  label="Тип"
                  value={draft.sourceType}
                />

                <DetailItem
                  label="Видео"
                  value={
                    draft.telegramVideo ||
                    "—"
                  }
                />
              </div>
            </div>
          </section>

          {/* ACTIONS */}

          {draft.status === "PENDING" && (
            <div className="flex flex-col gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onReject}
                disabled={isLoading}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-red-200 px-5 text-sm font-black text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X className="h-4 w-4" />

                Отклонить
              </button>

              <button
                type="button"
                onClick={onApprove}
                disabled={isLoading}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-green-600 px-6 text-sm font-black text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}

                Опубликовать в каталог
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ========================================================= */
/* CONFIRMATION MODAL */
/* ========================================================= */

function ConfirmationModal({
  action,
  loading,
  error,
  onClose,
  onConfirm,
}: {
  action: ConfirmAction;
  loading: boolean;
  error: string;
  onClose: () => void;
  onConfirm: (
    action: ConfirmAction
  ) => void;
}) {
  const isApprove =
    action.type === "approve";

  const draft = action.draft;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !loading
        ) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-md overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-[0_30px_100px_rgba(0,0,0,0.25)]">
        {/* TOP */}

        <div
          className={`relative px-6 pb-5 pt-7 ${
            isApprove
              ? "bg-gradient-to-b from-green-50 to-white"
              : "bg-gradient-to-b from-red-50 to-white"
          }`}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition hover:bg-white hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <X className="h-5 w-5" />
          </button>

          <div
            className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
              isApprove
                ? "bg-green-600 text-white shadow-lg shadow-green-600/20"
                : "bg-red-600 text-white shadow-lg shadow-red-600/20"
            }`}
          >
            {isApprove ? (
              <PackageCheck className="h-7 w-7" />
            ) : (
              <XCircle className="h-7 w-7" />
            )}
          </div>

          <div className="mt-5">
            <p
              className={`text-xs font-black uppercase tracking-[0.18em] ${
                isApprove
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              TECHSTORE ADMIN
            </p>

            <h2 className="mt-1 text-2xl font-black tracking-tight text-gray-950">
              {isApprove
                ? "Опубликовать товар?"
                : "Отклонить импорт?"}
            </h2>
          </div>
        </div>

        {/* PRODUCT */}

        <div className="px-6 pb-6">
          <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-white">
              {draft.images?.[0] ? (
                <img
                  src={draft.images[0]}
                  alt={draft.name}
                  className="h-full w-full object-contain p-2"
                />
              ) : (
                <span className="text-2xl">
                  📱
                </span>
              )}
            </div>

            <div className="min-w-0">
              <p className="truncate text-base font-black text-gray-950">
                {draft.name}
              </p>

              <p className="mt-1 truncate text-xs font-medium text-gray-500">
                {[
                  draft.brand,
                  draft.model,
                  draft.memory,
                ]
                  .filter(Boolean)
                  .join(" · ") ||
                  "Товар"}
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="rounded-lg bg-white px-2 py-1 text-xs font-black text-gray-700 shadow-sm">
                  {getCategoryName(
                    draft.category
                  )}
                </span>

                <span className="rounded-lg bg-white px-2 py-1 text-xs font-black text-gray-900 shadow-sm">
                  {formatPrice(
                    draft.price
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* ERROR */}

          {error && (
            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
                <XCircle className="h-4 w-4" />
              </div>

              <div>
                <p className="text-sm font-black text-red-800">
                  Не удалось выполнить действие
                </p>

                <p className="mt-1 text-xs leading-5 text-red-700">
                  {error}
                </p>
              </div>
            </div>
          )}

          {/* MESSAGE */}

          {!error && (
            <div className="mt-4 rounded-2xl border border-gray-100 bg-white">
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    isApprove
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {isApprove ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                </div>

                <p className="text-sm leading-6 text-gray-600">
                  {isApprove
                    ? "Товар будет добавлен в основной каталог и станет доступен покупателям."
                    : "Импорт будет отмечен как отклонённый и не попадёт в основной каталог."}
                </p>
              </div>
            </div>
          )}

          {/* BUTTONS */}

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="h-12 rounded-xl border border-gray-200 bg-white px-4 text-sm font-black text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Отмена
            </button>

            <button
              type="button"
              onClick={() =>
                onConfirm(action)
              }
              disabled={loading}
              className={`inline-flex h-12 items-center justify-center gap-2 rounded-xl px-4 text-sm font-black text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                isApprove
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />

                  Выполняем...
                </>
              ) : isApprove ? (
                <>
                  <Check className="h-4 w-4" />

                  Опубликовать
                </>
              ) : (
                <>
                  <X className="h-4 w-4" />

                  Отклонить
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}