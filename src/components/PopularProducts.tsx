import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { prisma } from "@/lib/prisma";
import { ArrowRight, Sparkles } from "lucide-react";

export default async function PopularProducts() {
  const popularProducts = await prisma.product.findMany({
    include: {
      category: true,
    },

    where: {
      status: {
        not: "Продан",
      },
    },

    orderBy: [
      {
        quantity: "desc",
      },
      {
        createdAt: "desc",
      },
    ],

    take: 4,
  });

  return (
    <section className="bg-[#f5f6f7]">

      <div className="mx-auto max-w-[1600px] px-4 py-14 sm:px-6 lg:px-8 lg:py-16">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

          <div>

            <div className="mb-3 flex items-center gap-2">

              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-100 text-green-600">
                <Sparkles size={14} />
              </div>

              <span className="text-xs font-black uppercase tracking-[0.18em] text-green-600">
                TECHSTORE
              </span>

            </div>

            <h2 className="text-3xl font-black tracking-tight text-gray-950 sm:text-4xl">
              Популярные товары
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-6 text-gray-500">
              Техника и аксессуары, которые сейчас
              особенно популярны среди покупателей.
            </p>

          </div>

          {/* =================================================
              ALL PRODUCTS
          ================================================= */}

          <Link
            href="/catalog"
            className="
              group
              inline-flex
              shrink-0
              items-center
              gap-2
              self-start
              rounded-xl
              border
              border-gray-200
              bg-white
              px-4
              py-3
              text-sm
              font-black
              text-gray-700
              shadow-sm
              transition
              hover:border-green-300
              hover:text-green-700
              sm:self-auto
            "
          >

            Все товары

            <ArrowRight
              size={17}
              className="
                transition-transform
                duration-300
                group-hover:translate-x-1
              "
            />

          </Link>

        </div>

        {/* =====================================================
            PRODUCTS
        ===================================================== */}

        {popularProducts.length === 0 ? (

          <div className="overflow-hidden rounded-[26px] border border-gray-200 bg-white">

            <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">

              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-2xl">
                📦
              </div>

              <h3 className="mt-5 text-lg font-black text-gray-900">
                Пока нет товаров
              </h3>

              <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">
                Как только товары появятся в каталоге,
                они будут отображаться здесь.
              </p>

              <Link
                href="/catalog"
                className="
                  mt-6
                  inline-flex
                  items-center
                  gap-2
                  rounded-xl
                  bg-green-500
                  px-5
                  py-3
                  text-sm
                  font-black
                  text-black
                  transition
                  hover:bg-green-400
                "
              >
                Перейти в каталог
                <ArrowRight size={16} />
              </Link>

            </div>

          </div>

        ) : (

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

            {popularProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
              />
            ))}

          </div>

        )}

        {/* =====================================================
            BOTTOM LINK
        ===================================================== */}

        {popularProducts.length > 0 && (
          <div className="mt-8 flex justify-center">

            <Link
              href="/catalog"
              className="
                group
                inline-flex
                items-center
                gap-2
                rounded-xl
                px-5
                py-3
                text-sm
                font-black
                text-gray-600
                transition
                hover:bg-white
                hover:text-green-600
              "
            >

              Смотреть весь каталог

              <ArrowRight
                size={16}
                className="
                  transition-transform
                  duration-300
                  group-hover:translate-x-1
                "
              />

            </Link>

          </div>
        )}

      </div>

    </section>
  );
}