import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MapPin, Phone } from "lucide-react";
import Layout from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { apiGet, resolveMediaUrl } from "@/lib/api";
import type { Product } from "@/lib/types";
import {
  AVAILABILITY_LABELS,
  GENDER_LABELS,
  PRICE_NOTE,
  PURITY_LABELS,
  priceLabel,
  productEnquiryMessage,
  telLink,
  useSeo,
  useSettings,
  waLink,
} from "@/lib/site";
import { cn } from "@/lib/utils";

export default function ProductDetail() {
  const { id = "" } = useParams();
  const s = useSettings();
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);

  const { data: product, isLoading, isError } = useQuery({
    queryKey: ["product", id],
    queryFn: () => apiGet<Product>(`/products/${id}`),
    enabled: Boolean(id),
  });

  useSeo(
    product
      ? `${product.name} | Maheshwari Jewellers, Modinagar`
      : "Product | Maheshwari Jewellers",
    product
      ? `${product.name} — ${PURITY_LABELS[product.purity] ?? product.purity}${product.weight ? `, ${product.weight}` : ""}. Enquire on WhatsApp with Maheshwari Jewellers, Modinagar.`
      : "Jewellery product details at Maheshwari Jewellers, Modinagar.",
  );

  const images = product?.images ?? [];
  const current = images[active] ? resolveMediaUrl(images[active].url) : undefined;

  const spec = (label: string, value?: string | null) =>
    value ? (
      <div className="flex justify-between gap-4 py-2.5 border-b border-[#EFE9DF] last:border-0">
        <dt className="text-sm text-stone-500">{label}</dt>
        <dd className="text-sm font-medium text-stone-900 text-right" data-testid={`spec-${label.toLowerCase().replace(/[^a-z]+/g, "-")}`}>
          {value}
        </dd>
      </div>
    ) : null;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Link
          to={product ? `/catalogue?metal=${product.metal}` : "/catalogue"}
          className="inline-flex items-center gap-1.5 text-sm text-[#8A5A00] hover:underline"
          data-testid="back-to-catalogue"
        >
          <ArrowLeft className="h-4 w-4" /> Back to catalogue
        </Link>

        {isLoading && <p className="mt-10 text-sm text-stone-500">Loading product…</p>}

        {isError && (
          <div className="mt-10 bg-white rounded-xl border border-[#E8E2D8] p-8 text-center" data-testid="product-error">
            <h1 className="font-heading text-2xl text-stone-900">Product not available</h1>
            <p className="mt-2 text-sm text-stone-600">
              This item may have been sold or hidden. Please contact us for current stock.
            </p>
            <Link to="/catalogue" className={cn(buttonVariants(), "mt-5 bg-[#996515] hover:bg-[#7A4D05]")}>
              Browse catalogue
            </Link>
          </div>
        )}

        {product && (
          <div className="mt-6 grid lg:grid-cols-2 gap-8 lg:gap-14">
            {/* Gallery */}
            <div data-testid="product-gallery">
              <div
                className={cn(
                  "relative aspect-square rounded-xl overflow-hidden bg-[#F5EFE6] border border-[#E8E2D8]",
                  current && "cursor-zoom-in",
                )}
                onClick={() => current && setZoom((z) => !z)}
                data-testid="product-main-image-wrapper"
              >
                {current ? (
                  <img
                    src={current}
                    alt={images[active]?.alt || `${product.name} at Maheshwari Jewellers, Modinagar`}
                    className={cn(
                      "h-full w-full object-cover transition-transform duration-500",
                      zoom && "scale-150",
                    )}
                    data-testid="product-main-image"
                  />
                ) : (
                  <div className="h-full w-full grid place-items-center font-heading text-[#B8860B]">
                    Photo coming soon
                  </div>
                )}
                {product.is_demo && (
                  <span className="absolute top-3 left-3 text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded bg-amber-100 text-amber-800 border border-amber-300">
                    Demo Product
                  </span>
                )}
              </div>

              {images.length > 1 && (
                <div className="mt-3 flex gap-2 overflow-x-auto snap-x pb-1" data-testid="product-thumbnails">
                  {images.map((img, i) => (
                    <button
                      key={img.url + i}
                      type="button"
                      onClick={() => {
                        setActive(i);
                        setZoom(false);
                      }}
                      className={cn(
                        "h-20 w-20 shrink-0 snap-start rounded-lg overflow-hidden border-2 transition-colors duration-200",
                        i === active ? "border-[#996515]" : "border-[#E8E2D8]",
                      )}
                      aria-label={`View image ${i + 1}`}
                      data-testid={`product-thumbnail-${i}`}
                    >
                      <img src={resolveMediaUrl(img.url)} alt={img.alt || `${product.name} view ${i + 1}`} className="h-full w-full object-cover" loading="lazy" />
                    </button>
                  ))}
                </div>
              )}
              {current && <p className="mt-2 text-xs text-stone-500">Tap the image to zoom in or out.</p>}
            </div>

            {/* Details */}
            <div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className={product.metal === "gold" ? "bg-[#FBF5E8] text-[#7A4D05] border-[#EADBBD]" : "bg-[#F1F5F9] text-[#334155] border-[#CBD5E1]"}>
                  {product.metal === "gold" ? "Gold" : "Silver"}
                </Badge>
                <Badge variant="outline" className="bg-[#FAF7F2]">{PURITY_LABELS[product.purity] ?? product.purity}</Badge>
                {product.new_arrival && <Badge className="bg-[#996515] text-white">New Arrival</Badge>}
              </div>

              <h1 className="mt-3 font-heading text-3xl sm:text-4xl text-stone-900 leading-tight" data-testid="product-detail-name">
                {product.name}
              </h1>
              {product.sku && (
                <p className="mt-1.5 text-sm text-stone-500" data-testid="product-detail-sku">
                  Product ID: {product.sku}
                </p>
              )}

              <p className="mt-4 text-2xl font-semibold text-[#996515]" data-testid="product-detail-price">
                {priceLabel(product)}
              </p>
              <p className="mt-1 text-sm text-stone-600" data-testid="product-detail-availability">
                {AVAILABILITY_LABELS[product.availability]}
              </p>

              <div className="mt-6 grid sm:grid-cols-3 gap-2">
                <a
                  href={waLink(s.whatsapp, productEnquiryMessage(product))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 items-center justify-center rounded-md bg-[#25D366] px-4 text-sm font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5"
                  data-testid="product-whatsapp-enquiry"
                >
                  WhatsApp Enquiry
                </a>
                <a
                  href={telLink(s.phone)}
                  className={cn(buttonVariants({ variant: "default" }), "h-11 bg-[#996515] hover:bg-[#7A4D05]")}
                  data-testid="product-call-button"
                >
                  <Phone className="h-4 w-4" /> Call Now
                </a>
                <a
                  href={s.maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(buttonVariants({ variant: "outline" }), "h-11")}
                  data-testid="product-directions-button"
                >
                  <MapPin className="h-4 w-4" /> Directions
                </a>
              </div>

              {product.description && (
                <p className="mt-7 text-sm text-stone-700 leading-relaxed whitespace-pre-line" data-testid="product-description">
                  {product.description}
                </p>
              )}

              <dl className="mt-7 bg-white rounded-xl border border-[#E8E2D8] p-5">
                {spec("Metal", product.metal === "gold" ? "Gold" : "Silver")}
                {spec("Purity", PURITY_LABELS[product.purity] ?? product.purity)}
                {spec("Weight", product.weight)}
                {spec("Category", product.category)}
                {spec("Subcategory", product.subcategory)}
                {spec("Size", product.size)}
                {spec("Finish", product.finish)}
                {spec("Stone", product.stone_details)}
                {spec("For", GENDER_LABELS[product.gender])}
              </dl>

              <p className="mt-6 text-xs text-stone-500 leading-relaxed">{PRICE_NOTE}</p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
