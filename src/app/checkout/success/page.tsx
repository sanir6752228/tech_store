import Link from "next/link";
import {
  ArrowRight,
  Check,
  ClipboardCheck,
  Home,
  PackageCheck,
  ShoppingBag,
  Truck,
} from "lucide-react";

interface SuccessPageProps {
  searchParams: Promise<{
    orderId?: string;
  }>;
}

export default async function SuccessPage({
  searchParams,
}: SuccessPageProps) {
  const params = await searchParams;
  const orderId = params.orderId;

  return (
    <main className="min-h-screen bg-[#f5f6f7] text-gray-950">
      <div className="mx-auto flex min-h-[calc(100vh-80px)] max-w-4xl items-center px-4 py-10 sm:px-6 lg:py-16">

        <div className="w-full overflow-hidden rounded-[32px] border border-gray-200 bg-white shadow-[0_24px_80px_rgba(0,0,0,0.07)]">

          {/* GREEN TOP */}

          <div className="h-2 bg-green-600" />

          <div className="p-6 sm:p-10 lg:p-14">

            {/* SUCCESS ICON */}

            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[24px] bg-green-50 text-green-600 sm:h-24 sm:w-24">
              <Check
                size={46}
                strokeWidth={3}
              />
            </div>

            {/* TITLE */}

            <div className="mt-7 text-center">
              <div className="text-sm font-extrabold uppercase tracking-[0.12em] text-green-600">
                Заказ принят
              </div>

              <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl lg:text-[42px]">
                Спасибо за покупку!
              </h1>

              <p className="mx-auto mt-4 max-w-xl text-[15px] leading-7 text-gray-500 sm:text-base">
                Ваш заказ успешно создан.
                Менеджер свяжется с вами,
                чтобы подтвердить заказ и
                согласовать детали доставки.
              </p>
            </div>

            {/* ORDER NUMBER */}

            {orderId && (
              <div className="mx-auto mt-8 max-w-md rounded-[24px] border border-gray-200 bg-[#f8f9fa] p-6 text-center">
                <div className="text-xs font-extrabold uppercase tracking-[0.1em] text-gray-400">
                  Номер заказа
                </div>

                <div className="mt-2 text-3xl font-black tracking-tight">
                  №{orderId}
                </div>
              </div>
            )}

            {/* STEPS */}

            <div className="mx-auto mt-10 max-w-2xl">
              <div className="grid gap-3 sm:grid-cols-3">

                <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-600 text-white">
                    <ClipboardCheck size={18} />
                  </div>

                  <div className="mt-3 text-sm font-black">
                    Заказ принят
                  </div>

                  <div className="mt-1 text-xs leading-5 text-gray-500">
                    Мы получили ваши
                    данные.
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-gray-600 shadow-sm">
                    <PhoneIcon />
                  </div>

                  <div className="mt-3 text-sm font-black">
                    Свяжемся с вами
                  </div>

                  <div className="mt-1 text-xs leading-5 text-gray-500">
                    Подтвердим заказ
                    по телефону.
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-gray-600 shadow-sm">
                    <Truck size={18} />
                  </div>

                  <div className="mt-3 text-sm font-black">
                    Доставка
                  </div>

                  <div className="mt-1 text-xs leading-5 text-gray-500">
                    Согласуем удобное
                    время.
                  </div>
                </div>

              </div>
            </div>

            {/* INFO */}

            <div className="mx-auto mt-6 max-w-2xl rounded-[24px] border border-gray-200 bg-white p-5">
              <div className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-600">
                  <PackageCheck size={21} />
                </div>

                <div>
                  <div className="text-sm font-black">
                    Что будет дальше?
                  </div>

                  <p className="mt-1 text-sm leading-6 text-gray-500">
                    Менеджер проверит наличие
                    товаров, свяжется с вами
                    и согласует способ и время
                    получения заказа.
                  </p>
                </div>
              </div>
            </div>

            {/* BUTTONS */}

            <div className="mx-auto mt-8 flex max-w-2xl flex-col gap-3 sm:flex-row">

              <Link
                href="/catalog"
                className="flex h-13 flex-1 items-center justify-center gap-2 rounded-2xl bg-green-600 px-6 text-sm font-black text-white shadow-lg shadow-green-600/15 transition hover:bg-green-700"
              >
                Продолжить покупки
                <ArrowRight size={18} />
              </Link>

              <Link
                href="/"
                className="flex h-13 flex-1 items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-6 text-sm font-black text-gray-900 transition hover:bg-gray-50"
              >
                <Home size={18} />
                На главную
              </Link>

            </div>

          </div>

          {/* BOTTOM */}

          <div className="border-t border-gray-100 bg-[#fafafa] px-6 py-5 text-center sm:px-10">
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-gray-400">
              <ShoppingBag size={15} />
              TECHSTORE
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}

function PhoneIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.62 2.63a2 2 0 0 1-.45 2.11L8 9.73a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.85.29 1.73.5 2.63.62A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}