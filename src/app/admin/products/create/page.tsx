"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Category = {
  id: number;
  name: string;
};

type FormState = {
  name: string;
  brand: string;
  model: string;

  categoryId: string;

  condition: string;
  status: string;

  memory: string;
  color: string;
  battery: string;

  price: string;
  oldPrice: string;

  description: string;

  telegramVideo: string;

  rating: string;
  reviews: string;
  year: string;
  sales: string;

  display: string;
  processor: string;
  camera: string;
  sim: string;

  isNew: boolean;
  isHit: boolean;

  quantity: string;
};

const initialForm: FormState = {
  name: "",
  brand: "",
  model: "",

  categoryId: "",

  condition: "Новый",
  status: "В наличии",

  memory: "",
  color: "",
  battery: "",

  price: "",
  oldPrice: "",

  description: "",

  telegramVideo: "",

  rating: "5",
  reviews: "0",
  year: "",
  sales: "0",

  display: "",
  processor: "",
  camera: "",
  sim: "",

  isNew: false,
  isHit: false,

  quantity: "1",
};

export default function CreateProduct() {
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] =
    useState(true);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [images, setImages] = useState<string[]>([]);

  const [form, setForm] =
    useState<FormState>(initialForm);

  useEffect(() => {
    async function loadCategories() {
      try {
        const response = await fetch("/api/categories");

        if (!response.ok) {
          throw new Error(
            "Не удалось загрузить категории"
          );
        }

        const data = await response.json();

        setCategories(
          Array.isArray(data) ? data : []
        );
      } catch (error) {
        console.error(
          "Ошибка загрузки категорий:",
          error
        );
      } finally {
        setLoadingCategories(false);
      }
    }

    loadCategories();
  }, []);

  function updateField<K extends keyof FormState>(
    field: K,
    value: FormState[K]
  ) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function uploadImages(files: FileList) {
    if (!files.length) return;

    setUploading(true);

    try {
      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        const formData = new FormData();

        formData.append("file", file);

        const response = await fetch(
          "/api/upload",
          {
            method: "POST",
            body: formData,
          }
        );

        if (!response.ok) {
          continue;
        }

        const data = await response.json();

        if (data.url) {
          uploadedUrls.push(data.url);
        }
      }

      setImages((prev) => [
        ...prev,
        ...uploadedUrls,
      ]);
    } catch (error) {
      console.error(
        "Ошибка загрузки изображений:",
        error
      );

      alert(
        "Не удалось загрузить изображения."
      );
    } finally {
      setUploading(false);
    }
  }

  function removeImage(index: number) {
    setImages((prev) =>
      prev.filter((_, i) => i !== index)
    );
  }

  async function createProduct() {
    if (!form.name.trim()) {
      alert("Введите название товара.");
      return;
    }

    if (!form.categoryId) {
      alert("Выберите категорию.");
      return;
    }

    if (!form.price) {
      alert("Введите цену товара.");
      return;
    }

    const price = Number(form.price);

    if (!Number.isFinite(price) || price <= 0) {
      alert("Введите корректную цену.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "/api/products",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            ...form,

            name: form.name.trim(),
            brand: form.brand.trim(),
            model: form.model.trim(),

            memory: form.memory.trim(),
            color: form.color.trim(),
            battery: form.battery.trim(),

            description:
              form.description.trim(),

            telegramVideo:
              form.telegramVideo.trim(),

            display: form.display.trim(),
            processor:
              form.processor.trim(),
            camera: form.camera.trim(),
            sim: form.sim.trim(),

            images,

            price,

            oldPrice: form.oldPrice
              ? Number(form.oldPrice)
              : null,

            quantity: form.quantity
              ? Number(form.quantity)
              : 1,

            rating: form.rating
              ? Number(form.rating)
              : 0,

            reviews: form.reviews
              ? Number(form.reviews)
              : 0,

            year: form.year
              ? Number(form.year)
              : null,

            sales: form.sales
              ? Number(form.sales)
              : 0,
          }),
        }
      );

      if (!response.ok) {
        let message =
          "Ошибка создания товара.";

        try {
          const data =
            await response.json();

          if (data?.message) {
            message = data.message;
          }
        } catch {
          // ничего
        }

        throw new Error(message);
      }

      router.push("/admin/products");
      router.refresh();
    } catch (error) {
      console.error(
        "Ошибка создания товара:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Ошибка создания товара."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f6f7]">

      {/* TOP BAR */}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-6 py-4 lg:px-8">

          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-green-600">
              TECHSTORE ADMIN
            </div>

            <h1 className="mt-1 text-xl font-black text-gray-900">
              Добавление товара
            </h1>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push("/admin/products")
            }
            className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 transition hover:border-green-300 hover:text-green-700"
          >
            ← Назад к товарам
          </button>

        </div>
      </header>

      <div className="mx-auto max-w-[1400px] px-6 py-8 lg:px-8">

        {/* HERO */}
        <section className="relative overflow-hidden rounded-[28px] bg-[#0b0f0d] p-7 text-white shadow-xl lg:p-9">

          <div className="relative z-10 max-w-3xl">

            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-green-400/20 bg-green-400/10 px-3 py-1.5 text-xs font-black text-green-400">
              <span className="h-2 w-2 rounded-full bg-green-400" />
              НОВЫЙ ТОВАР
            </div>

            <h2 className="text-3xl font-black tracking-tight lg:text-4xl">
              Добавь товар в каталог
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-400 lg:text-base">
              Заполни информацию о товаре,
              добавь фотографии и характеристики.
              После публикации товар появится
              в магазине.
            </p>

          </div>

          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-green-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 right-20 h-64 w-64 rounded-full bg-green-400/10 blur-3xl" />

        </section>

        {/* MAIN GRID */}
        <div className="mt-7 grid gap-7 xl:grid-cols-[1fr_340px]">

          {/* LEFT */}
          <div className="space-y-7">

            {/* ОСНОВНАЯ ИНФОРМАЦИЯ */}
            <Section
              number="01"
              title="Основная информация"
              description="Название, бренд и модель товара."
            >

              <div className="grid gap-5 md:grid-cols-2">

                <Input
                  label="Название товара"
                  placeholder="iPhone 15 Pro 256GB"
                  value={form.name}
                  onChange={(value) =>
                    updateField(
                      "name",
                      value
                    )
                  }
                  required
                />

                <Input
                  label="Бренд"
                  placeholder="Apple"
                  value={form.brand}
                  onChange={(value) =>
                    updateField(
                      "brand",
                      value
                    )
                  }
                />

                <Input
                  label="Модель"
                  placeholder="iPhone 15 Pro"
                  value={form.model}
                  onChange={(value) =>
                    updateField(
                      "model",
                      value
                    )
                  }
                />

                <Input
                  label="Год выпуска"
                  placeholder="2025"
                  value={form.year}
                  onChange={(value) =>
                    updateField(
                      "year",
                      value
                    )
                  }
                  type="number"
                />

              </div>

            </Section>

            {/* КАТЕГОРИЯ */}
            <Section
              number="02"
              title="Категория и состояние"
              description="Определи, где и в каком состоянии будет продаваться товар."
            >

              <div className="grid gap-5 md:grid-cols-3">

                <Select
                  label="Категория"
                  value={form.categoryId}
                  loading={loadingCategories}
                  placeholder="Выберите категорию"
                  options={categories.map(
                    (category) => ({
                      value:
                        String(category.id),
                      label:
                        category.name,
                    })
                  )}
                  onChange={(value) =>
                    updateField(
                      "categoryId",
                      value
                    )
                  }
                />

                <Select
                  label="Состояние"
                  value={form.condition}
                  options={[
                    {
                      value: "Новый",
                      label: "Новый",
                    },
                    {
                      value: "Б/У",
                      label: "Б/У",
                    },
                    {
                      value:
                        "После ремонта",
                      label:
                        "После ремонта",
                    },
                  ]}
                  onChange={(value) =>
                    updateField(
                      "condition",
                      value
                    )
                  }
                />

                <Select
                  label="Статус"
                  value={form.status}
                  options={[
                    {
                      value:
                        "В наличии",
                      label:
                        "В наличии",
                    },
                    {
                      value:
                        "Под заказ",
                      label:
                        "Под заказ",
                    },
                    {
                      value: "Продан",
                      label: "Продан",
                    },
                  ]}
                  onChange={(value) =>
                    updateField(
                      "status",
                      value
                    )
                  }
                />

              </div>

            </Section>

            {/* ЦЕНА И ОСТАТОК */}
            <Section
              number="03"
              title="Цена и наличие"
              description="Укажи актуальную стоимость и количество товара."
            >

              <div className="grid gap-5 md:grid-cols-3">

                <Input
                  label="Цена"
                  placeholder="89000"
                  value={form.price}
                  onChange={(value) =>
                    updateField(
                      "price",
                      value
                    )
                  }
                  type="number"
                  suffix="₽"
                  required
                />

                <Input
                  label="Старая цена"
                  placeholder="99000"
                  value={form.oldPrice}
                  onChange={(value) =>
                    updateField(
                      "oldPrice",
                      value
                    )
                  }
                  type="number"
                  suffix="₽"
                />

                <Input
                  label="Количество"
                  placeholder="1"
                  value={form.quantity}
                  onChange={(value) =>
                    updateField(
                      "quantity",
                      value
                    )
                  }
                  type="number"
                  suffix="шт."
                />

              </div>

              <div className="mt-5 rounded-2xl border border-green-100 bg-green-50 p-4">

                <div className="flex gap-3">

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-green-500 text-sm">
                    ₽
                  </div>

                  <div>
                    <div className="text-sm font-black text-green-900">
                      Цена продажи
                    </div>

                    <div className="mt-1 text-xs leading-5 text-green-700">
                      Старая цена будет
                      отображаться как
                      зачёркнутая, если она
                      выше текущей.
                    </div>
                  </div>

                </div>

              </div>

            </Section>

            {/* ХАРАКТЕРИСТИКИ */}
            <Section
              number="04"
              title="Характеристики"
              description="Основные технические параметры товара."
            >

              <div className="grid gap-5 md:grid-cols-3">

                <Input
                  label="Память"
                  placeholder="256 GB"
                  value={form.memory}
                  onChange={(value) =>
                    updateField(
                      "memory",
                      value
                    )
                  }
                />

                <Input
                  label="Цвет"
                  placeholder="Titanium Black"
                  value={form.color}
                  onChange={(value) =>
                    updateField(
                      "color",
                      value
                    )
                  }
                />

                <Input
                  label="Батарея"
                  placeholder="98%"
                  value={form.battery}
                  onChange={(value) =>
                    updateField(
                      "battery",
                      value
                    )
                  }
                />

                <Input
                  label="Экран"
                  placeholder="6.1 OLED"
                  value={form.display}
                  onChange={(value) =>
                    updateField(
                      "display",
                      value
                    )
                  }
                />

                <Input
                  label="Процессор"
                  placeholder="Apple A17 Pro"
                  value={form.processor}
                  onChange={(value) =>
                    updateField(
                      "processor",
                      value
                    )
                  }
                />

                <Input
                  label="Камера"
                  placeholder="48 Мп"
                  value={form.camera}
                  onChange={(value) =>
                    updateField(
                      "camera",
                      value
                    )
                  }
                />

                <Input
                  label="SIM"
                  placeholder="eSIM"
                  value={form.sim}
                  onChange={(value) =>
                    updateField(
                      "sim",
                      value
                    )
                  }
                />

              </div>

            </Section>

            {/* ФОТО */}
            <Section
              number="05"
              title="Фотографии товара"
              description="Добавь несколько качественных фотографий товара."
            >

              <label
                className="
                  group
                  flex
                  min-h-[180px]
                  cursor-pointer
                  flex-col
                  items-center
                  justify-center
                  rounded-3xl
                  border-2
                  border-dashed
                  border-gray-200
                  bg-gray-50
                  px-6
                  text-center
                  transition
                  hover:border-green-400
                  hover:bg-green-50/40
                "
              >

                <div className="
                  flex
                  h-16
                  w-16
                  items-center
                  justify-center
                  rounded-2xl
                  bg-white
                  text-3xl
                  shadow-sm
                  transition
                  group-hover:scale-105
                ">
                  📷
                </div>

                <div className="mt-4 text-sm font-black text-gray-900">
                  {uploading
                    ? "Загрузка фотографий..."
                    : "Нажмите, чтобы добавить фотографии"}
                </div>

                <div className="mt-1 text-xs text-gray-500">
                  Можно выбрать несколько изображений
                </div>

                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  disabled={uploading}
                  onChange={(event) => {
                    if (event.target.files) {
                      uploadImages(
                        event.target.files
                      );

                      event.target.value = "";
                    }
                  }}
                  className="hidden"
                />

              </label>

              {images.length > 0 && (
                <div className="mt-6">

                  <div className="mb-3 text-sm font-black text-gray-900">
                    Загруженные фотографии:{" "}
                    <span className="text-green-600">
                      {images.length}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">

                    {images.map(
                      (image, index) => (
                        <div
                          key={`${image}-${index}`}
                          className="group relative aspect-square overflow-hidden rounded-2xl border border-gray-200 bg-gray-100"
                        >

                          <img
                            src={image}
                            alt={`Фото товара ${
                              index + 1
                            }`}
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                          />

                          {index === 0 && (
                            <div className="absolute left-2 top-2 rounded-lg bg-black/80 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wide text-white">
                              Главное
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              removeImage(
                                index
                              )
                            }
                            className="
                              absolute
                              right-2
                              top-2
                              flex
                              h-8
                              w-8
                              items-center
                              justify-center
                              rounded-full
                              bg-red-500
                              text-lg
                              font-black
                              text-white
                              opacity-0
                              shadow-lg
                              transition
                              group-hover:opacity-100
                              hover:bg-red-600
                            "
                          >
                            ×
                          </button>

                        </div>
                      )
                    )}

                  </div>

                </div>
              )}

            </Section>

            {/* ДОПОЛНИТЕЛЬНЫЕ ДАННЫЕ */}
            <Section
              number="06"
              title="Дополнительная информация"
              description="Данные, которые используются для карточки товара и аналитики."
            >

              <div className="grid gap-5 md:grid-cols-3">

                <Input
                  label="Рейтинг"
                  placeholder="5"
                  value={form.rating}
                  onChange={(value) =>
                    updateField(
                      "rating",
                      value
                    )
                  }
                  type="number"
                />

                <Input
                  label="Отзывы"
                  placeholder="0"
                  value={form.reviews}
                  onChange={(value) =>
                    updateField(
                      "reviews",
                      value
                    )
                  }
                  type="number"
                />

                <Input
                  label="Продажи"
                  placeholder="0"
                  value={form.sales}
                  onChange={(value) =>
                    updateField(
                      "sales",
                      value
                    )
                  }
                  type="number"
                />

              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">

                <Toggle
                  checked={form.isNew}
                  onChange={(value) =>
                    updateField(
                      "isNew",
                      value
                    )
                  }
                  icon="✨"
                  title="Новинка"
                  description="Показывать специальную метку «Новинка»."
                />

                <Toggle
                  checked={form.isHit}
                  onChange={(value) =>
                    updateField(
                      "isHit",
                      value
                    )
                  }
                  icon="🔥"
                  title="Хит продаж"
                  description="Показывать специальную метку «Хит»."
                />

              </div>

            </Section>

            {/* TELEGRAM */}
            <Section
              number="07"
              title="Telegram"
              description="При необходимости добавь ссылку на видео товара."
            >

              <Input
                label="Ссылка на видео"
                placeholder="https://t.me/..."
                value={form.telegramVideo}
                onChange={(value) =>
                  updateField(
                    "telegramVideo",
                    value
                  )
                }
              />

              <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4">

                <div className="flex gap-3">

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500 text-white">
                    ✈️
                  </div>

                  <div>
                    <div className="text-sm font-black text-blue-900">
                      Видео из Telegram
                    </div>

                    <div className="mt-1 text-xs leading-5 text-blue-700">
                      Ссылка будет сохранена
                      вместе с карточкой товара.
                    </div>
                  </div>

                </div>

              </div>

            </Section>

            {/* ОПИСАНИЕ */}
            <Section
              number="08"
              title="Описание"
              description="Расскажи покупателю подробнее о товаре."
            >

              <textarea
                value={form.description}
                onChange={(event) =>
                  updateField(
                    "description",
                    event.target.value
                  )
                }
                placeholder="Например: iPhone в отличном состоянии, полностью проверен..."
                className="
                  min-h-[180px]
                  w-full
                  resize-y
                  rounded-2xl
                  border
                  border-gray-200
                  bg-gray-50
                  px-5
                  py-4
                  text-sm
                  font-medium
                  text-gray-900
                  outline-none
                  transition
                  placeholder:text-gray-400
                  focus:border-green-500
                  focus:bg-white
                  focus:ring-4
                  focus:ring-green-500/10
                "
              />

            </Section>

          </div>

          {/* RIGHT SIDEBAR */}
          <aside className="space-y-5">

            {/* PREVIEW */}
            <div className="sticky top-24 space-y-5">

              <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">

                <div className="border-b border-gray-100 px-5 py-4">
                  <div className="text-xs font-black uppercase tracking-[0.16em] text-green-600">
                    Предпросмотр
                  </div>

                  <div className="mt-1 font-black text-gray-900">
                    Карточка товара
                  </div>
                </div>

                <div className="p-5">

                  <div className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-gray-100">

                    {images[0] ? (
                      <img
                        src={images[0]}
                        alt="Предпросмотр товара"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="text-center">

                        <div className="text-5xl">
                          📦
                        </div>

                        <div className="mt-3 text-xs font-bold text-gray-400">
                          Добавь фотографию
                        </div>

                      </div>
                    )}

                  </div>

                  <div className="mt-5">

                    <div className="text-xs font-bold text-gray-400">
                      {form.brand ||
                        "Бренд"}{" "}
                      {form.model}
                    </div>

                    <div className="mt-1 text-lg font-black text-gray-900">
                      {form.name ||
                        "Название товара"}
                    </div>

                    <div className="mt-3 flex items-end justify-between gap-3">

                      <div>
                        <div className="text-2xl font-black text-gray-900">
                          {form.price
                            ? Number(
                                form.price
                              ).toLocaleString(
                                "ru-RU"
                              )
                            : "0"}{" "}
                          ₽
                        </div>

                        {form.oldPrice && (
                          <div className="text-sm font-bold text-gray-400 line-through">
                            {Number(
                              form.oldPrice
                            ).toLocaleString(
                              "ru-RU"
                            )}{" "}
                            ₽
                          </div>
                        )}
                      </div>

                      {form.condition && (
                        <span className="rounded-full bg-gray-100 px-3 py-1.5 text-[10px] font-black text-gray-600">
                          {form.condition}
                        </span>
                      )}

                    </div>

                  </div>

                </div>

              </div>

              {/* INFO */}
              <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">

                <div className="text-sm font-black text-gray-900">
                  Перед публикацией
                </div>

                <div className="mt-4 space-y-3">

                  <CheckItem
                    done={Boolean(
                      form.name.trim()
                    )}
                    text="Название товара"
                  />

                  <CheckItem
                    done={Boolean(
                      form.categoryId
                    )}
                    text="Категория"
                  />

                  <CheckItem
                    done={Boolean(
                      form.price
                    )}
                    text="Цена"
                  />

                  <CheckItem
                    done={images.length > 0}
                    text="Фотография"
                  />

                </div>

              </div>

            </div>

          </aside>

        </div>

        {/* BOTTOM ACTIONS */}
        <div className="mt-7 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">

          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">

            <div>
              <div className="font-black text-gray-900">
                Готов опубликовать товар?
              </div>

              <div className="mt-1 text-sm text-gray-500">
                Проверь информацию и нажми
                кнопку публикации.
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">

              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/admin/products"
                  )
                }
                disabled={loading}
                className="
                  rounded-xl
                  border
                  border-gray-200
                  bg-white
                  px-6
                  py-3.5
                  text-sm
                  font-black
                  text-gray-700
                  transition
                  hover:border-gray-300
                  hover:bg-gray-50
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                Отмена
              </button>

              <button
                type="button"
                onClick={createProduct}
                disabled={
                  loading ||
                  uploading
                }
                className="
                  rounded-xl
                  bg-green-500
                  px-7
                  py-3.5
                  text-sm
                  font-black
                  text-black
                  shadow-lg
                  shadow-green-500/20
                  transition
                  hover:bg-green-400
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                {loading
                  ? "Сохранение..."
                  : uploading
                    ? "Загрузка фото..."
                    : "✓ Опубликовать товар"}
              </button>

            </div>

          </div>

        </div>

      </div>

    </main>
  );
}

/* ========================================================= */
/* SECTION */
/* ========================================================= */

function Section({
  number,
  title,
  description,
  children,
}: {
  number: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm lg:p-7">

      <div className="mb-6 flex gap-4">

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0b0f0d] text-xs font-black text-green-400">
          {number}
        </div>

        <div>
          <h2 className="text-xl font-black text-gray-900">
            {title}
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            {description}
          </p>
        </div>

      </div>

      {children}

    </section>
  );
}

/* ========================================================= */
/* INPUT */
/* ========================================================= */

function Input({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
  suffix,
  required = false,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  suffix?: string;
  required?: boolean;
}) {
  return (
    <div>

      <label className="mb-2 block text-sm font-black text-gray-800">

        {label}

        {required && (
          <span className="ml-1 text-green-600">
            *
          </span>
        )}

      </label>

      <div className="relative">

        <input
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
          className={`
            w-full
            rounded-2xl
            border
            border-gray-200
            bg-gray-50
            px-4
            py-3.5
            text-sm
            font-medium
            text-gray-900
            outline-none
            transition
            placeholder:text-gray-400
            focus:border-green-500
            focus:bg-white
            focus:ring-4
            focus:ring-green-500/10
            ${suffix ? "pr-16" : ""}
          `}
        />

        {suffix && (
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-black text-gray-400">
            {suffix}
          </span>
        )}

      </div>

    </div>
  );
}

/* ========================================================= */
/* SELECT */
/* ========================================================= */

function Select({
  label,
  value,
  options,
  onChange,
  loading = false,
  placeholder,
}: {
  label: string;
  value: string;
  options: {
    value: string;
    label: string;
  }[];
  onChange: (value: string) => void;
  loading?: boolean;
  placeholder?: string;
}) {
  return (
    <div>

      <label className="mb-2 block text-sm font-black text-gray-800">
        {label}
      </label>

      <select
        value={value}
        disabled={loading}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="
          w-full
          rounded-2xl
          border
          border-gray-200
          bg-gray-50
          px-4
          py-3.5
          text-sm
          font-bold
          text-gray-700
          outline-none
          transition
          focus:border-green-500
          focus:bg-white
          focus:ring-4
          focus:ring-green-500/10
          disabled:cursor-not-allowed
          disabled:opacity-60
        "
      >

        {placeholder && (
          <option value="">
            {loading
              ? "Загрузка..."
              : placeholder}
          </option>
        )}

        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}

      </select>

    </div>
  );
}

/* ========================================================= */
/* TOGGLE */
/* ========================================================= */

function Toggle({
  checked,
  onChange,
  icon,
  title,
  description,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <label
      className={`
        flex
        cursor-pointer
        items-center
        gap-4
        rounded-2xl
        border
        p-4
        transition
        ${
          checked
            ? "border-green-300 bg-green-50"
            : "border-gray-200 bg-gray-50 hover:bg-white"
        }
      `}
    >

      <input
        type="checkbox"
        checked={checked}
        onChange={(event) =>
          onChange(
            event.target.checked
          )
        }
        className="sr-only"
      />

      <div
        className={`
          flex
          h-12
          w-12
          shrink-0
          items-center
          justify-center
          rounded-xl
          text-xl
          ${
            checked
              ? "bg-green-500"
              : "bg-white"
          }
        `}
      >
        {icon}
      </div>

      <div className="min-w-0 flex-1">

        <div className="font-black text-gray-900">
          {title}
        </div>

        <div className="mt-1 text-xs leading-5 text-gray-500">
          {description}
        </div>

      </div>

      <div
        className={`
          flex
          h-6
          w-11
          shrink-0
          items-center
          rounded-full
          p-1
          transition
          ${
            checked
              ? "bg-green-500"
              : "bg-gray-300"
          }
        `}
      >

        <div
          className={`
            h-4
            w-4
            rounded-full
            bg-white
            shadow
            transition
            ${
              checked
                ? "translate-x-5"
                : "translate-x-0"
            }
          `}
        />

      </div>

    </label>
  );
}

/* ========================================================= */
/* CHECK ITEM */
/* ========================================================= */

function CheckItem({
  done,
  text,
}: {
  done: boolean;
  text: string;
}) {
  return (
    <div className="flex items-center gap-3">

      <div
        className={`
          flex
          h-6
          w-6
          items-center
          justify-center
          rounded-full
          text-xs
          font-black
          ${
            done
              ? "bg-green-500 text-black"
              : "bg-gray-100 text-gray-400"
          }
        `}
      >
        {done ? "✓" : "—"}
      </div>

      <span
        className={`
          text-sm
          font-bold
          ${
            done
              ? "text-gray-900"
              : "text-gray-400"
          }
        `}
      >
        {text}
      </span>

    </div>
  );
}