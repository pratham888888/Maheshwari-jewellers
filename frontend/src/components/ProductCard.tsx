import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  AVAILABILITY_LABELS,
  PURITY_LABELS,
  priceLabel,
  productEnquiryMessage,
  useSettings,
  waLink,
} from "@/lib/site";
import type { Product } from "@/lib/types";
import { resolveMediaUrl } from "@/lib/api";
import { cn } from "@/lib/utils";

const PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="#F5EFE6"/><text x="50%" y="50%" font-family="serif" font-size="20" fill="#B8860B" text-anchor="middle">Maheshwari Jewellers</text></svg>`,
  );

export default function ProductCard({ product }: { product: Product }) {
  const s = useSettings();
  const image = resolveMediaUrl(product.images[0]?.url ?? "") || PLACEHOLDER;
  const purity = PURITY_LABELS[product.purity] ?? product.purity;

  return (
    <article
      className="group bg-white rounded-xl border border-[#E8E2D8] shadow-xs hover:shadow-md hover:-translate-y-1 transition-[transform,box-shadow] duration-200 overflow-hidden flex flex-col"
      data-testid={`product-card-${product.id}`}
    >
      <Link to={`/product/${product.id}`} className="block relative aspect-square bg-[#F5EFE6] overflow-hidden">
        <img
          src={image}
          alt={product.images[0]?.alt || `${product.name} — ${purity} at Maheshwari Jewellers, Modinagar`}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          data-testid={`product-image-${product.id}`}
        />
        <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
          {product.is_demo && (
            <span className="inline-flex items-center text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300" data-testid={`demo-badge-${product.id}`}>
              Demo
            </span>
          )}
          {product.new_arrival && (
            <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-[#996515] text-white">
              New
            </span>
          )}
        </div>
      </Link>

      <div className="p-3 sm:p-4 flex flex-col gap-1.5 flex-1">
        <h3 className="font-heading text-sm sm:text-base leading-snug text-stone-900 line-clamp-2">
          <Link to={`/product/${product.id}`} data-testid={`product-name-${product.id}`}>
            {product.name}
          </Link>
        </h3>

        <div className="flex flex-wrap gap-1">
          <Badge variant="outline" className={product.metal === "gold" ? "bg-[#FBF5E8] text-[#7A4D05] border-[#EADBBD]" : "bg-[#F1F5F9] text-[#334155] border-[#CBD5E1]"} data-testid={`product-purity-${product.id}`}>
            {purity}
          </Badge>
          {product.weight && (
            <Badge variant="outline" className="bg-[#FAF7F2] text-stone-700" data-testid={`product-weight-${product.id}`}>
              {product.weight}
            </Badge>
          )}
        </div>

        <p className="text-sm font-semibold text-[#996515] mt-0.5" data-testid={`product-price-${product.id}`}>
          {priceLabel(product)}
        </p>
        <p className="text-xs text-stone-500" data-testid={`product-availability-${product.id}`}>
          {AVAILABILITY_LABELS[product.availability]}
        </p>

        <div className="mt-auto pt-3 grid grid-cols-2 gap-2">
          <Link
            to={`/product/${product.id}`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full text-xs")}
            data-testid={`view-details-${product.id}`}
          >
            View Details
          </Link>
          <a
            href={waLink(s.whatsapp, productEnquiryMessage(product))}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-md bg-[#25D366] px-2 py-2 text-xs font-semibold text-white transition-opacity duration-200 hover:opacity-90"
            data-testid={`whatsapp-enquiry-${product.id}`}
          >
            WhatsApp
          </a>
        </div>
      </div>
    </article>
  );
}
