import Link from "next/link";
import {
  ArrowUpRight,
  Smartphone,
  Tablet,
  BatteryCharging,
  Headphones,
} from "lucide-react";

interface CategoryProps {
  name: string;
  image: string;
  category: string;
}

const categoryInfo: Record<
  string,
  {
    description: string;
    icon: React.ElementType;
  }
> = {
  phones: {
    description: "Смартфоны и мобильные устройства",
    icon: Smartphone,
  },

  tablets: {
    description: "Планшеты для работы и отдыха",
    icon: Tablet,
  },

  charging: {
    description: "Зарядки, кабели и адаптеры",
    icon: BatteryCharging,
  },

  accessories: {
    description: "Чехлы, наушники и аксессуары",
    icon: Headphones,
  },
};

export default function CategoryCard({
  name,
  image,
  category,
}: CategoryProps) {
  const info = categoryInfo[category];

  const description =
    info?.description ??
    "Товары из категории TECHSTORE";

  const Icon = info?.icon ?? Smartphone;

  return (
    <Link
      href={`/catalog?category=${category}`}
      className="
        group
        relative
        block
        h-[330px]
        overflow-hidden
        rounded-[26px]
        border
        border-gray-200
        bg-gray-900
        shadow-sm
        transition-all
        duration-500
        hover:-translate-y-1
        hover:border-gray-300
        hover:shadow-[0_20px_50px_rgba(0,0,0,0.14)]
      "
    >

      {/* =====================================================
          IMAGE
      ===================================================== */}

      <img
        src={image}
        alt={name}
        className="
          absolute
          inset-0
          h-full
          w-full
          object-cover
          transition-transform
          duration-700
          ease-out
          group-hover:scale-105
        "
      />

      {/* =====================================================
          DARK OVERLAY
      ===================================================== */}

      <div
        className="
          absolute
          inset-0
          bg-gradient-to-t
          from-black/85
          via-black/25
          to-black/5
          transition
          duration-500
          group-hover:from-black/90
        "
      />

      {/* =====================================================
          TOP ICON
      ===================================================== */}

      <div className="absolute left-5 top-5">

        <div
          className="
            flex
            h-11
            w-11
            items-center
            justify-center
            rounded-2xl
            border
            border-white/20
            bg-black/20
            text-white
            backdrop-blur-md
            transition-all
            duration-300
            group-hover:border-green-400/50
            group-hover:bg-green-500
            group-hover:text-black
          "
        >
          <Icon size={19} strokeWidth={2} />
        </div>

      </div>

      {/* =====================================================
          ARROW
      ===================================================== */}

      <div className="absolute right-5 top-5">

        <div
          className="
            flex
            h-11
            w-11
            items-center
            justify-center
            rounded-full
            border
            border-white/20
            bg-black/20
            text-white
            backdrop-blur-md
            transition-all
            duration-300
            group-hover:rotate-45
            group-hover:border-green-400
            group-hover:bg-green-500
            group-hover:text-black
          "
        >
          <ArrowUpRight
            size={20}
            strokeWidth={2}
          />
        </div>

      </div>

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <div
        className="
          absolute
          inset-x-0
          bottom-0
          p-6
        "
      >

        <div
          className="
            mb-3
            h-1
            w-8
            rounded-full
            bg-green-500
            transition-all
            duration-300
            group-hover:w-14
          "
        />

        <h3
          className="
            text-2xl
            font-black
            tracking-tight
            text-white
          "
        >
          {name}
        </h3>

        <p
          className="
            mt-2
            max-w-[260px]
            text-sm
            leading-5
            text-white/65
          "
        >
          {description}
        </p>

        <div
          className="
            mt-5
            flex
            items-center
            gap-2
            text-xs
            font-black
            uppercase
            tracking-wider
            text-white/80
            transition
            group-hover:text-green-400
          "
        >
          Смотреть товары

          <span className="transition-transform duration-300 group-hover:translate-x-1">
            →
          </span>
        </div>

      </div>

    </Link>
  );
}