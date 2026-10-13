
import Link from "next/link";

export default function RepairBlock() {
  return (
    <section className="relative overflow-hidden rounded-[32px] bg-black px-8 py-12 text-white shadow-2xl md:px-12 md:py-16">

      {/* Декоративные элементы */}
      <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-green-500/10" />
      <div className="absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-green-500/5" />

      <div className="relative z-10 grid items-center gap-10 md:grid-cols-2">

        {/* Левая часть */}
        <div>

          <div className="mb-5 inline-flex items-center rounded-full border border-green-500/30 bg-green-500/10 px-4 py-2 text-sm font-bold text-green-400">
            🔧 РЕМОНТ ТЕХНИКИ
          </div>

          <h2 className="text-3xl font-black leading-tight md:text-5xl">
            Сломалась техника?
            <br />
            <span className="text-green-500">
              Мы поможем!
            </span>
          </h2>

          <p className="mt-5 max-w-xl text-base leading-7 text-gray-400 md:text-lg">
            Оставьте заявку на ремонт телефона, планшета, ноутбука
            или другой техники. Опишите проблему — мы свяжемся с вами
            и обсудим дальнейшие действия.
          </p>

          {/* Кнопки */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">

            <Link
              href="/repair"
              className="
                inline-flex
                items-center
                justify-center
                rounded-2xl
                bg-green-500
                px-7
                py-4
                text-base
                font-black
                text-black
                shadow-lg
                shadow-green-500/20
                transition
                duration-200
                hover:-translate-y-0.5
                hover:bg-green-400
                hover:shadow-xl
                hover:shadow-green-500/30
              "
            >
              🔧 Оставить заявку
            </Link>

            <Link
              href="/repair"
              className="
                inline-flex
                items-center
                justify-center
                rounded-2xl
                border
                border-white/10
                bg-white/5
                px-7
                py-4
                text-base
                font-bold
                text-white
                transition
                duration-200
                hover:border-green-500/40
                hover:bg-white/10
              "
            >
              Узнать подробнее →
            </Link>

          </div>
        </div>

        {/* Правая часть */}
        <div className="hidden md:flex md:justify-end">

          <div className="relative flex h-72 w-72 items-center justify-center rounded-[40px] border border-white/10 bg-white/[0.03] shadow-2xl">

            {/* Центральная иконка */}
            <div className="flex h-48 w-48 items-center justify-center rounded-full border border-green-500/20 bg-green-500/10">

              <span className="text-8xl drop-shadow-[0_0_25px_rgba(34,197,94,0.25)]">
                🔧
              </span>

            </div>

            {/* Карточки */}
            <div className="absolute -left-5 top-10 rounded-2xl border border-white/10 bg-[#111] px-4 py-3 text-sm font-black text-white shadow-xl">
              📱 Телефоны
            </div>

            <div className="absolute -bottom-4 right-0 rounded-2xl border border-white/10 bg-[#111] px-4 py-3 text-sm font-black text-white shadow-xl">
              💻 Ноутбуки
            </div>

            <div className="absolute -right-5 top-24 rounded-2xl border border-white/10 bg-[#111] px-4 py-3 text-sm font-black text-white shadow-xl">
              📱 Планшеты
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
