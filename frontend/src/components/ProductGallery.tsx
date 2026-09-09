import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { resolveMediaUrl } from "@/lib/api";
import type { ProductImage } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function ProductGallery({
  images,
  productName,
  isDemo,
}: {
  images: ProductImage[];
  productName: string;
  isDemo?: boolean;
}) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    setActive(0);
    setZoom(false);
  }, [images]);

  const count = images.length;
  const current = count > 0 ? resolveMediaUrl(images[active]?.url ?? "") : undefined;

  const go = (index: number) => {
    if (count === 0) return;
    const next = ((index % count) + count) % count;
    setActive(next);
    setZoom(false);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.changedTouches[0]?.clientX ?? null;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null || count < 2) return;
    const dx = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 40) return;
    go(active + (dx < 0 ? 1 : -1));
  };

  return (
    <div data-testid="product-gallery">
      <div
        ref={trackRef}
        className={cn(
          "relative aspect-square rounded-xl overflow-hidden bg-[#F5EFE6] border border-[#E8E2D8]",
          current && "cursor-zoom-in",
        )}
        onClick={() => current && setZoom((z) => !z)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        data-testid="product-main-image-wrapper"
      >
        {current ? (
          <img
            src={current}
            alt={images[active]?.alt || `${productName} at Maheshwari Jewellers, Modinagar`}
            className={cn(
              "h-full w-full object-cover transition-transform duration-500 select-none",
              zoom && "scale-150",
            )}
            draggable={false}
            data-testid="product-main-image"
          />
        ) : (
          <div className="h-full w-full grid place-items-center font-heading text-[#B8860B]">
            Photo coming soon
          </div>
        )}

        {isDemo && (
          <span className="absolute top-3 left-3 text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded bg-amber-100 text-amber-800 border border-amber-300">
            Demo Product
          </span>
        )}

        {count > 1 && (
          <>
            <button
              type="button"
              className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 border border-[#E8E2D8] grid place-items-center shadow-sm hover:bg-white"
              aria-label="Previous image"
              data-testid="gallery-prev"
              onClick={(e) => {
                e.stopPropagation();
                go(active - 1);
              }}
            >
              <ChevronLeft className="h-5 w-5 text-stone-800" />
            </button>
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 border border-[#E8E2D8] grid place-items-center shadow-sm hover:bg-white"
              aria-label="Next image"
              data-testid="gallery-next"
              onClick={(e) => {
                e.stopPropagation();
                go(active + 1);
              }}
            >
              <ChevronRight className="h-5 w-5 text-stone-800" />
            </button>
            <div className="absolute bottom-3 inset-x-0 flex justify-center gap-1.5" data-testid="gallery-dots">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Go to image ${i + 1}`}
                  className={cn(
                    "h-2 w-2 rounded-full transition-colors",
                    i === active ? "bg-[#996515]" : "bg-white/80 border border-[#E8E2D8]",
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    go(i);
                  }}
                />
              ))}
            </div>
            <span className="absolute top-3 right-3 text-[11px] font-medium px-2 py-1 rounded bg-black/45 text-white">
              {active + 1} / {count}
            </span>
          </>
        )}
      </div>

      {count > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto snap-x pb-1" data-testid="product-thumbnails">
          {images.map((img, i) => (
            <button
              key={img.url + i}
              type="button"
              onClick={() => go(i)}
              className={cn(
                "h-20 w-20 shrink-0 snap-start rounded-lg overflow-hidden border-2 transition-colors duration-200",
                i === active ? "border-[#996515]" : "border-[#E8E2D8]",
              )}
              aria-label={`View image ${i + 1}`}
              data-testid={`product-thumbnail-${i}`}
            >
              <img
                src={resolveMediaUrl(img.url)}
                alt={img.alt || `${productName} view ${i + 1}`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
      {current && (
        <p className="mt-2 text-xs text-stone-500">
          {count > 1
            ? "Swipe or use arrows to browse images. Tap the photo to zoom."
            : "Tap the image to zoom in or out."}
        </p>
      )}
    </div>
  );
}
