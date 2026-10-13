"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import FavoriteButton from "@/components/FavoriteButton";

interface ProductGalleryProps {
  images: string[];
  productName: string;
  productId: number;
  condition: string;
  discount?: number | null;
}

function getConditionClass(condition: string) {
  switch (condition) {
    case "Новый":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    case "Б/У":
      return "bg-orange-50 text-orange-700 border-orange-200";

    case "После ремонта":
      return "bg-blue-50 text-blue-700 border-blue-200";

    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
}

export default function ProductGallery({
  images,
  productName,
  productId,
  condition,
  discount,
}: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const safeImages = images?.length ? images : [];

  const currentImage = safeImages[activeIndex];

  function previousImage() {
    if (safeImages.length <= 1) return;

    setActiveIndex((current) =>
      current === 0
        ? safeImages.length - 1
        : current - 1
    );
  }

  function nextImage() {
    if (safeImages.length <= 1) return;

    setActiveIndex((current) =>
      current === safeImages.length - 1
        ? 0
        : current + 1
    );
  }

  return (
    <div className="relative">
      {/* BADGES */}

      <div className="absolute left-4 top-4 z-20 flex flex-wrap gap-2">
        <span
          className={`
            inline-flex
            items-center
            rounded-lg
            border
            px-3
            py-1.5
            text-xs
            font-extrabold
            ${getConditionClass(condition)}
          `}
        >
          {condition}
        </span>

        {discount && discount > 0 && (
          <span className="inline-flex items-center rounded-lg bg-red-500 px-3 py-1.5 text-xs font-extrabold text-white">
            −{discount}%
          </span>
        )}
      </div>

      {/* FAVORITE */}

      <div className="absolute right-4 top-4 z-20">
        <FavoriteButton id={productId} />
      </div>

      {/* MAIN IMAGE */}

      <div className="group relative flex min-h-[420px] items-center justify-center overflow-hidden rounded-[22px] bg-[#f7f8f9] p-8 sm:min-h-[500px] lg:min-h-[620px]">
        {currentImage ? (
          <img
            key={currentImage}
            src={currentImage}
            alt={productName}
            className="
              h-[380px]
              w-full
              object-contain
              transition
              duration-300
              group-hover:scale-[1.025]
              sm:h-[460px]
              lg:h-[570px]
            "
          />
        ) : (
          <div className="flex h-[400px] w-full items-center justify-center text-8xl text-gray-300">
            📱
          </div>
        )}

        {/* LEFT ARROW */}

        {safeImages.length > 1 && (
          <button
            type="button"
            onClick={previousImage}
            aria-label="Предыдущее фото"
            className="
              absolute
              left-4
              top-1/2
              flex
              h-11
              w-11
              -translate-y-1/2
              items-center
              justify-center
              rounded-full
              border
              border-gray-200
              bg-white/95
              text-gray-700
              opacity-0
              shadow-lg
              transition
              hover:bg-white
              hover:text-green-600
              group-hover:opacity-100
            "
          >
            <ChevronLeft size={21} />
          </button>
        )}

        {/* RIGHT ARROW */}

        {safeImages.length > 1 && (
          <button
            type="button"
            onClick={nextImage}
            aria-label="Следующее фото"
            className="
              absolute
              right-4
              top-1/2
              flex
              h-11
              w-11
              -translate-y-1/2
              items-center
              justify-center
              rounded-full
              border
              border-gray-200
              bg-white/95
              text-gray-700
              opacity-0
              shadow-lg
              transition
              hover:bg-white
              hover:text-green-600
              group-hover:opacity-100
            "
          >
            <ChevronRight size={21} />
          </button>
        )}

        {/* FULLSCREEN ICON */}

        {currentImage && (
          <a
            href={currentImage}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Открыть фотографию"
            className="
              absolute
              bottom-4
              right-4
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-xl
              border
              border-gray-200
              bg-white/95
              text-gray-600
              opacity-0
              shadow-md
              transition
              hover:text-green-600
              group-hover:opacity-100
            "
          >
            <Maximize2 size={17} />
          </a>
        )}

        {/* COUNTER */}

        {safeImages.length > 1 && (
          <div
            className="
              absolute
              bottom-4
              left-1/2
              -translate-x-1/2
              rounded-full
              bg-black/65
              px-3
              py-1.5
              text-xs
              font-bold
              text-white
              backdrop-blur-sm
            "
          >
            {activeIndex + 1} / {safeImages.length}
          </div>
        )}
      </div>

      {/* THUMBNAILS */}

      {safeImages.length > 1 && (
        <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
          {safeImages.map((image, index) => {
            const isActive = index === activeIndex;

            return (
              <button
                key={`${image}-${index}`}
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`Открыть фото ${index + 1}`}
                className={`
                  relative
                  flex
                  h-[78px]
                  w-[78px]
                  shrink-0
                  items-center
                  justify-center
                  overflow-hidden
                  rounded-xl
                  border
                  bg-[#f7f8f9]
                  transition
                  ${
                    isActive
                      ? "border-green-500 ring-2 ring-green-500/15"
                      : "border-gray-200 hover:border-gray-400"
                  }
                `}
              >
                <img
                  src={image}
                  alt={`${productName} фото ${index + 1}`}
                  className="h-full w-full object-contain p-1"
                />

                {isActive && (
                  <span className="absolute inset-x-2 bottom-1 h-0.5 rounded-full bg-green-500" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}