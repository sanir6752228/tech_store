import Header from "@/components/Header";
import CategoryCard from "@/components/CategoryCards";
import RepairBlock from "@/components/RepairBlock";
import Banner from "@/components/Banner";
import Benefits from "@/components/Benefits";
import PopularProducts from "@/components/PopularProducts";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f5f6f7] text-gray-950">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <Header />

      {/* =====================================================
          HERO / BANNER
      ===================================================== */}

      <section className="bg-white">
        <div className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-[28px]">
            <Banner />
          </div>
        </div>
      </section>

      {/* =====================================================
          BENEFITS
      ===================================================== */}

      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-[1600px] px-4 py-2 sm:px-6 lg:px-8">
          <Benefits />
        </div>
      </section>

      {/* =====================================================
          CATEGORIES
      ===================================================== */}

      <section className="bg-white">
        <div className="mx-auto max-w-[1600px] px-4 py-14 sm:px-6 lg:px-8 lg:py-16">

          {/* Заголовок */}

          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

            <div>
              <div className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-green-600">
                Каталог
              </div>

              <h2 className="text-3xl font-black tracking-tight text-gray-950 sm:text-4xl">
                Покупайте технику
                <br className="hidden sm:block" />
                <span className="text-gray-400">
                  {" "}для любых задач
                </span>
              </h2>
            </div>

            <p className="max-w-md text-sm leading-6 text-gray-500 sm:text-right">
              Смартфоны, планшеты, зарядные устройства и аксессуары —
              всё необходимое в одном месте.
            </p>

          </div>

          {/* Категории */}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <CategoryCard
              name="Телефоны"
              category="phones"
              image="/images/categories/phones.jpg"
            />

            <CategoryCard
              name="Планшеты"
              category="tablets"
              image="/images/categories/tablets.jpg"
            />

            <CategoryCard
              name="Зарядки"
              category="charging"
              image="/images/categories/charging.jpg"
            />

            <CategoryCard
              name="Аксессуары"
              category="accessories"
              image="/images/categories/accessories.jpg"
            />

          </div>

        </div>
      </section>

      {/* =====================================================
          POPULAR PRODUCTS
          
          ВАЖНО:
          PopularProducts уже содержит собственную секцию,
          заголовок и карточки.
          Поэтому здесь НЕ создаём второй заголовок.
      ===================================================== */}

      <PopularProducts />

      {/* =====================================================
          REPAIR
      ===================================================== */}

      <section className="bg-white">

        <div className="mx-auto max-w-[1600px] px-4 py-14 sm:px-6 lg:px-8 lg:py-20">

          {/* Заголовок */}

          <div className="mb-8">

            <div className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-green-600">
              Сервис TECHSTORE
            </div>

            <h2 className="text-3xl font-black tracking-tight text-gray-950 sm:text-4xl">
              Не покупка, а ремонт?
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500 sm:text-base">
              Оставьте заявку — разберёмся с проблемой устройства,
              проведём диагностику и сообщим стоимость ремонта.
            </p>

          </div>

          <RepairBlock />

        </div>

      </section>

      {/* =====================================================
          FINAL CTA
      ===================================================== */}

      <section className="bg-[#0b0f0d]">

        <div className="mx-auto max-w-[1600px] px-4 py-14 sm:px-6 lg:px-8 lg:py-16">

          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">

            {/* Текст */}

            <div>

              <div className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-green-400">
                TECHSTORE
              </div>

              <h2 className="max-w-2xl text-3xl font-black tracking-tight text-white sm:text-4xl">
                Техника, аксессуары
                <br />
                и сервис — в одном месте.
              </h2>

              <p className="mt-4 max-w-xl text-sm leading-6 text-gray-400 sm:text-base">
                Выбирайте нужный товар, оформляйте заказ
                или обращайтесь в сервисный центр.
              </p>

            </div>

            {/* Кнопки */}

            <div className="flex flex-col gap-3 sm:flex-row">

              <a
                href="/catalog"
                className="
                  inline-flex
                  items-center
                  justify-center
                  rounded-2xl
                  bg-green-500
                  px-7
                  py-4
                  text-sm
                  font-black
                  text-black
                  transition
                  hover:bg-green-400
                  hover:shadow-[0_10px_30px_rgba(34,197,94,0.20)]
                "
              >
                Перейти в каталог

                <span className="ml-2 text-lg">
                  →
                </span>
              </a>

              <a
                href="/repair"
                className="
                  inline-flex
                  items-center
                  justify-center
                  rounded-2xl
                  border
                  border-white/15
                  bg-white/5
                  px-7
                  py-4
                  text-sm
                  font-black
                  text-white
                  transition
                  hover:bg-white/10
                  hover:border-white/25
                "
              >
                Ремонт техники
              </a>

            </div>

          </div>

        </div>

      </section>

    </main>
  );
}