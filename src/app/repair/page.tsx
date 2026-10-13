"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useState,
} from "react";
import Link from "next/link";

type PhotoItem = {
  file: File;
  preview: string;
};

type ApiResponse = {
  success?: boolean;
  message?: string;
  error?: string;
  repair?: {
    id?: number;
    status?: string;
  };
};

const MAX_PHOTOS = 8;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export default function RepairPage() {
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [contactMethod, setContactMethod] =
    useState("Телефон");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");

  const [deviceType, setDeviceType] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");

  const [problem, setProblem] = useState("");
  const [description, setDescription] =
    useState("");

  const [photos, setPhotos] = useState<PhotoItem[]>(
    []
  );

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  /*
  |--------------------------------------------------------------------------
  | Очистка preview URL
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    return () => {
      photos.forEach((photo) => {
        URL.revokeObjectURL(photo.preview);
      });
    };
  }, [photos]);

  /*
  |--------------------------------------------------------------------------
  | Добавление фотографий
  |--------------------------------------------------------------------------
  */

  function handlePhotoChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    setError("");

    const selectedFiles = Array.from(
      event.target.files || []
    );

    if (!selectedFiles.length) {
      return;
    }

    if (
      photos.length + selectedFiles.length >
      MAX_PHOTOS
    ) {
      setError(
        `Можно загрузить максимум ${MAX_PHOTOS} фотографий.`
      );

      event.target.value = "";
      return;
    }

    const newPhotos: PhotoItem[] = [];

    for (const file of selectedFiles) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError(
          "Можно загружать только JPG, PNG или WEBP."
        );
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        setError(
          `Файл "${file.name}" превышает 10 МБ.`
        );
        continue;
      }

      newPhotos.push({
        file,
        preview: URL.createObjectURL(file),
      });
    }

    setPhotos((current) => [
      ...current,
      ...newPhotos,
    ]);

    event.target.value = "";
  }

  /*
  |--------------------------------------------------------------------------
  | Удаление фотографии
  |--------------------------------------------------------------------------
  */

  function removePhoto(index: number) {
    setPhotos((current) => {
      const photo = current[index];

      if (photo) {
        URL.revokeObjectURL(photo.preview);
      }

      return current.filter(
        (_, photoIndex) =>
          photoIndex !== index
      );
    });
  }

  /*
  |--------------------------------------------------------------------------
  | Отправка формы
  |--------------------------------------------------------------------------
  */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    try {
      if (!customerName.trim()) {
        throw new Error(
          "Введите ваше имя."
        );
      }

      if (!phone.trim()) {
        throw new Error(
          "Введите номер телефона."
        );
      }

      if (!deviceType) {
        throw new Error(
          "Выберите тип устройства."
        );
      }

      if (!problem) {
        throw new Error(
          "Выберите проблему."
        );
      }

      const formData = new FormData();

      formData.append(
        "customerName",
        customerName.trim()
      );

      formData.append(
        "phone",
        phone.trim()
      );

      formData.append(
        "contactMethod",
        contactMethod
      );

      formData.append(
        "city",
        city.trim()
      );

      formData.append(
        "address",
        address.trim()
      );

      formData.append(
        "deviceType",
        deviceType
      );

      formData.append(
        "brand",
        brand.trim()
      );

      formData.append(
        "model",
        model.trim()
      );

      formData.append(
        "problem",
        problem
      );

      formData.append(
        "description",
        description.trim()
      );

      /*
       * Добавляем фотографии.
       */
      photos.forEach((photo) => {
        formData.append(
          "photos",
          photo.file,
          photo.file.name
        );
      });

      const response = await fetch(
        "/api/repairs",
        {
          method: "POST",
          body: formData,
          cache: "no-store",
        }
      );

      const responseText =
        await response.text();

      console.log(
        "Ответ /api/repairs:",
        response.status,
        responseText
      );

      let data: ApiResponse = {};

      try {
        data =
          JSON.parse(responseText);
      } catch {
        throw new Error(
          responseText ||
            "Сервер вернул некорректный ответ."
        );
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Не удалось отправить заявку."
        );
      }

      setMessage(
        data.message ||
          "Заявка успешно отправлена!"
      );

      /*
       * Очищаем форму.
       */

      setCustomerName("");
      setPhone("");
      setContactMethod("Телефон");
      setCity("");
      setAddress("");
      setDeviceType("");
      setBrand("");
      setModel("");
      setProblem("");
      setDescription("");

      photos.forEach((photo) => {
        URL.revokeObjectURL(
          photo.preview
        );
      });

      setPhotos([]);

      /*
       * Прокручиваем страницу наверх,
       * чтобы пользователь увидел сообщение.
       */

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (err) {
      console.error(
        "Ошибка отправки заявки:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Произошла неизвестная ошибка."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* =========================================================
          HEADER
      ========================================================= */}

      <header className="bg-black text-white">
        <div className="border-b border-white/10">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 text-sm">
            <div className="text-gray-300">
              🇷🇺 Республика Крым
            </div>

            <div className="hidden items-center gap-6 md:flex">
              <span className="text-gray-300">
                🚚 Быстрая доставка
              </span>

              <span className="text-gray-300">
                🛡 Гарантия
              </span>

              <span className="text-gray-300">
                Помощь
              </span>
            </div>
          </div>
        </div>

        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5">
          <Link
            href="/"
            className="group"
          >
            <div className="text-2xl font-black tracking-tight">
              TECH
              <span className="text-green-500">
                STORE
              </span>
            </div>

            <div className="mt-1 text-xs text-gray-400">
              Техника • Продажа • Ремонт
            </div>
          </Link>

          <Link
            href="/"
            className="rounded-xl border border-white/10 px-4 py-2 text-sm font-bold text-gray-300 transition hover:border-green-500 hover:text-white"
          >
            ← В магазин
          </Link>
        </div>
      </header>

      {/* =========================================================
          HERO
      ========================================================= */}

      <section className="bg-black px-4 pb-14 pt-10 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-4 py-2 text-sm font-bold text-green-400">
              🔧 Сервис TECHSTORE
            </div>

            <h1 className="text-4xl font-black leading-tight md:text-6xl">
              Ремонт техники
              <span className="block text-green-500">
                без лишних проблем
              </span>
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-gray-400">
              Расскажите, что случилось с
              устройством. Мы изучим заявку,
              свяжемся с вами и согласуем
              дальнейшие действия.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================
          MAIN
      ========================================================= */}

      <section className="mx-auto max-w-7xl px-4 py-10 md:py-14">
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* =====================================================
              FORM
          ===================================================== */}

          <div className="rounded-3xl bg-white p-5 shadow-xl md:p-8">
            <div className="mb-8">
              <div className="mb-2 text-sm font-black uppercase tracking-wider text-green-600">
                Заявка на ремонт
              </div>

              <h2 className="text-3xl font-black text-gray-900">
                Расскажите о вашей технике
              </h2>

              <p className="mt-2 text-gray-500">
                Поля со звездочкой обязательны
                для заполнения.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
            >
              {/* =================================================
                  CONTACT
              ================================================= */}

              <div className="mb-10">
                <h3 className="mb-5 flex items-center gap-3 text-xl font-black text-gray-900">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-100 text-green-700">
                    1
                  </span>
                  Ваши данные
                </h3>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-bold text-gray-800">
                      Имя *
                    </label>

                    <input
                      value={customerName}
                      onChange={(event) =>
                        setCustomerName(
                          event.target.value
                        )
                      }
                      required
                      placeholder="Например, Алексей"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-gray-900 outline-none transition focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-gray-800">
                      Телефон *
                    </label>

                    <input
                      value={phone}
                      onChange={(event) =>
                        setPhone(
                          event.target.value
                        )
                      }
                      required
                      type="tel"
                      placeholder="+7 900 000-00-00"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-gray-900 outline-none transition focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-gray-800">
                      Как с вами связаться?
                    </label>

                    <select
                      value={contactMethod}
                      onChange={(event) =>
                        setContactMethod(
                          event.target.value
                        )
                      }
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-gray-900 outline-none transition focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10"
                    >
                      <option value="Телефон">
                        📞 Телефон
                      </option>

                      <option value="WhatsApp">
                        💬 WhatsApp
                      </option>

                      <option value="Telegram">
                        ✈️ Telegram
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-gray-800">
                      Город
                    </label>

                    <input
                      value={city}
                      onChange={(event) =>
                        setCity(
                          event.target.value
                        )
                      }
                      placeholder="Ваш город"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-gray-900 outline-none transition focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-bold text-gray-800">
                      Адрес
                    </label>

                    <input
                      value={address}
                      onChange={(event) =>
                        setAddress(
                          event.target.value
                        )
                      }
                      placeholder="Адрес для связи или доставки"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-gray-900 outline-none transition focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10"
                    />
                  </div>
                </div>
              </div>

              {/* =================================================
                  DEVICE
              ================================================= */}

              <div className="mb-10 border-t border-gray-100 pt-10">
                <h3 className="mb-5 flex items-center gap-3 text-xl font-black text-gray-900">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-100 text-green-700">
                    2
                  </span>
                  Устройство
                </h3>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-bold text-gray-800">
                      Тип устройства *
                    </label>

                    <select
                      value={deviceType}
                      onChange={(event) =>
                        setDeviceType(
                          event.target.value
                        )
                      }
                      required
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-gray-900 outline-none transition focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10"
                    >
                      <option value="">
                        Выберите устройство
                      </option>

                      <option value="Телефон">
                        📱 Телефон
                      </option>

                      <option value="Планшет">
                        📲 Планшет
                      </option>

                      <option value="Ноутбук">
                        💻 Ноутбук
                      </option>

                      <option value="Компьютер">
                        🖥️ Компьютер
                      </option>

                      <option value="Телевизор">
                        📺 Телевизор
                      </option>

                      <option value="Другое">
                        🔌 Другое
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-gray-800">
                      Бренд
                    </label>

                    <input
                      value={brand}
                      onChange={(event) =>
                        setBrand(
                          event.target.value
                        )
                      }
                      placeholder="Apple, Samsung, Xiaomi..."
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-gray-900 outline-none transition focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-bold text-gray-800">
                      Модель
                    </label>

                    <input
                      value={model}
                      onChange={(event) =>
                        setModel(
                          event.target.value
                        )
                      }
                      placeholder="Например, iPhone 15 Pro"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-gray-900 outline-none transition focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10"
                    />
                  </div>
                </div>
              </div>

              {/* =================================================
                  PROBLEM
              ================================================= */}

              <div className="mb-10 border-t border-gray-100 pt-10">
                <h3 className="mb-5 flex items-center gap-3 text-xl font-black text-gray-900">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-100 text-green-700">
                    3
                  </span>
                  Что произошло?
                </h3>

                <div>
                  <label className="mb-2 block text-sm font-bold text-gray-800">
                    Проблема *
                  </label>

                  <select
                    value={problem}
                    onChange={(event) =>
                      setProblem(
                        event.target.value
                      )
                    }
                    required
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-gray-900 outline-none transition focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10"
                  >
                    <option value="">
                      Выберите проблему
                    </option>

                    <option value="Разбит экран">
                      💥 Разбит экран
                    </option>

                    <option value="Не включается">
                      ⚡ Не включается
                    </option>

                    <option value="Не заряжается">
                      🔋 Не заряжается
                    </option>

                    <option value="Быстро разряжается">
                      🔋 Быстро разряжается
                    </option>

                    <option value="Проблемы с камерой">
                      📷 Проблемы с камерой
                    </option>

                    <option value="Проблемы со звуком">
                      🔊 Проблемы со звуком
                    </option>

                    <option value="Разбит корпус">
                      📱 Поврежден корпус
                    </option>

                    <option value="Попала вода">
                      💧 Попала вода
                    </option>

                    <option value="Проблемы с программой">
                      ⚙️ Проблемы с программой
                    </option>

                    <option value="Другая проблема">
                      ❓ Другая проблема
                    </option>
                  </select>
                </div>

                <div className="mt-5">
                  <label className="mb-2 block text-sm font-bold text-gray-800">
                    Подробное описание
                  </label>

                  <textarea
                    value={description}
                    onChange={(event) =>
                      setDescription(
                        event.target.value
                      )
                    }
                    rows={6}
                    placeholder="Опишите подробнее, что случилось с устройством..."
                    className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-gray-900 outline-none transition focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10"
                  />

                  <div className="mt-2 text-xs text-gray-400">
                    Чем подробнее описание, тем
                    проще предварительно оценить
                    проблему.
                  </div>
                </div>
              </div>

              {/* =================================================
                  PHOTOS
              ================================================= */}

              <div className="mb-10 border-t border-gray-100 pt-10">
                <h3 className="mb-5 flex items-center gap-3 text-xl font-black text-gray-900">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-100 text-green-700">
                    4
                  </span>
                  Фотографии
                </h3>

                <p className="mb-5 text-sm text-gray-500">
                  Можно добавить до{" "}
                  <b>8 фотографий</b>. Например,
                  фотографию устройства, экрана,
                  повреждения или разъема.
                </p>

                <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center transition hover:border-green-500 hover:bg-green-50">
                  <div className="mb-3 text-4xl">
                    📷
                  </div>

                  <div className="font-black text-gray-900">
                    Добавить фотографии
                  </div>

                  <div className="mt-1 text-sm text-gray-500">
                    JPG, PNG или WEBP · до 10 МБ
                    каждый
                  </div>

                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={
                      handlePhotoChange
                    }
                    className="hidden"
                  />
                </label>

                {photos.length > 0 && (
                  <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                    {photos.map(
                      (photo, index) => (
                        <div
                          key={`${photo.file.name}-${index}`}
                          className="group relative overflow-hidden rounded-2xl bg-gray-100"
                        >
                          <img
                            src={photo.preview}
                            alt={`Фото ${index + 1}`}
                            className="aspect-square w-full object-cover"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              removePhoto(
                                index
                              )
                            }
                            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white opacity-100 transition hover:bg-red-600"
                            aria-label="Удалить фотографию"
                          >
                            ×
                          </button>

                          <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1 text-xs text-white">
                            Фото {index + 1}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}

                {photos.length > 0 && (
                  <div className="mt-3 text-sm text-gray-500">
                    Добавлено фотографий:{" "}
                    <b>
                      {photos.length}/{MAX_PHOTOS}
                    </b>
                  </div>
                )}
              </div>

              {/* =================================================
                  MESSAGES
              ================================================= */}

              {error && (
                <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
                  ❌ {error}
                </div>
              )}

              {message && (
                <div className="mb-5 rounded-2xl border border-green-200 bg-green-50 p-5">
                  <div className="font-black text-green-800">
                    ✅ Заявка отправлена
                  </div>

                  <div className="mt-1 text-sm text-green-700">
                    {message}
                  </div>
                </div>
              )}

              {/* =================================================
                  SUBMIT
              ================================================= */}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-green-600 px-6 py-4 text-lg font-black text-white shadow-lg shadow-green-600/20 transition hover:bg-green-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "⏳ Отправляем заявку..."
                  : "🔧 Отправить заявку"}
              </button>

              <p className="mt-4 text-center text-xs leading-5 text-gray-400">
                Нажимая кнопку «Отправить
                заявку», вы отправляете данные
                для связи с вами по вопросу
                ремонта техники.
              </p>
            </form>
          </div>

          {/* =====================================================
              SIDEBAR
          ===================================================== */}

          <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
            {/* Steps */}

            <div className="rounded-3xl bg-black p-6 text-white shadow-xl">
              <div className="mb-6 text-xl font-black">
                Как это работает?
              </div>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-500 font-black">
                    1
                  </div>

                  <div>
                    <div className="font-bold">
                      Вы оставляете заявку
                    </div>

                    <div className="mt-1 text-sm leading-6 text-gray-400">
                      Описываете устройство и
                      проблему.
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-500 font-black">
                    2
                  </div>

                  <div>
                    <div className="font-bold">
                      Мы связываемся с вами
                    </div>

                    <div className="mt-1 text-sm leading-6 text-gray-400">
                      Уточняем детали и согласуем
                      дальнейшие действия.
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-500 font-black">
                    3
                  </div>

                  <div>
                    <div className="font-bold">
                      Диагностика
                    </div>

                    <div className="mt-1 text-sm leading-6 text-gray-400">
                      Определяем причину
                      неисправности.
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-500 font-black">
                    4
                  </div>

                  <div>
                    <div className="font-bold">
                      Ремонт
                    </div>

                    <div className="mt-1 text-sm leading-6 text-gray-400">
                      После согласования выполняем
                      ремонт.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Advantages */}

            <div className="rounded-3xl bg-white p-6 shadow-lg">
              <div className="mb-5 text-xl font-black text-gray-900">
                Почему TECHSTORE?
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="text-xl">
                    🛡️
                  </div>

                  <div>
                    <div className="font-bold text-gray-900">
                      Гарантия
                    </div>

                    <div className="text-sm text-gray-500">
                      Согласовываем условия
                      ремонта заранее.
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="text-xl">
                    🔍
                  </div>

                  <div>
                    <div className="font-bold text-gray-900">
                      Диагностика
                    </div>

                    <div className="text-sm text-gray-500">
                      Сначала определяем проблему,
                      затем ремонтируем.
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="text-xl">
                    📱
                  </div>

                  <div>
                    <div className="font-bold text-gray-900">
                      Разная техника
                    </div>

                    <div className="text-sm text-gray-500">
                      Телефоны, планшеты, ноутбуки
                      и другая электроника.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact */}

            <div className="rounded-3xl border border-green-200 bg-green-50 p-6">
              <div className="text-lg font-black text-gray-900">
                Остались вопросы?
              </div>

              <p className="mt-2 text-sm leading-6 text-gray-600">
                Оставьте заявку, и специалист
                свяжется с вами для уточнения
                деталей.
              </p>

              <Link
                href="/"
                className="mt-5 block text-center font-bold text-green-700 transition hover:text-green-800"
              >
                Вернуться в магазин →
              </Link>
            </div>
          </aside>
        </div>
      </section>

      {/* =========================================================
          FOOTER
      ========================================================= */}

      <footer className="border-t border-gray-200 bg-white px-4 py-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 text-sm text-gray-500 md:flex-row">
          <div>
            © {new Date().getFullYear()} TECHSTORE
          </div>

          <div>
            Техника • Продажа • Ремонт
          </div>
        </div>
      </footer>
    </main>
  );
}