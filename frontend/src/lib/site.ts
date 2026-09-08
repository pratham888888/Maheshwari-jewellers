import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import type { Product, Settings } from "@/lib/types";

export const FALLBACK_SETTINGS: Settings = {
  business_name: "Maheshwari Jewellers",
  phone: "9837149835",
  whatsapp: "919837149835",
  maps_url: "https://maps.app.goo.gl/oWX8MP7Jm5HNGFD56?g_st=ac",
  address: "Modinagar, Uttar Pradesh",
  opening_hours: "10:00 AM – 8:00 PM",
  closed_days: "Tuesday",
  about: "",
  description: "",
  instagram: "",
  facebook: "",
  other_social: "",
  logo_url: "",
  banner_url: "",
  rates: { gold_24k: "—", gold_22k: "—", silver_999: "—", silver_925: "—", unit: "per 10 gram", updated_on: "" },
};

export const PRICE_NOTE =
  "Jewellery prices may vary according to current metal rates, product weight, making charges, GST and other specifications. Please contact us for the latest price.";

export const RATE_NOTE =
  "Rates are indicative and may change. Please confirm the current rate with Maheshwari Jewellers.";

/** Settings never gate a page: a failed fetch falls back to verified static business info. */
export function useSettings(): Settings {
  const { data } = useQuery({
    queryKey: ["settings"],
    queryFn: () => apiGet<Settings>("/settings"),
    staleTime: 60_000,
  });
  return data ?? FALLBACK_SETTINGS;
}

export const waLink = (whatsapp: string, message: string) =>
  `https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;

export const telLink = (phone: string) => `tel:+91${phone.replace(/\D/g, "").slice(-10)}`;

export function productEnquiryMessage(p: Product): string {
  const bits = [
    `Hello Maheshwari Jewellers, I am interested in ${p.name}`,
    p.sku ? `Product ID ${p.sku}` : "",
    p.weight ? `Weight ${p.weight}` : "",
  ].filter(Boolean);
  return `${bits.join(", ")}. Please share the latest price and availability.`;
}

export const PURITY_LABELS: Record<string, string> = {
  "925": "925 Sterling Silver",
  "999": "999 Fine Silver",
  regular: "Regular Silver",
  "24K": "24K Gold",
  "22K": "22K Gold",
  "18K": "18K Gold",
  "14K": "14K Gold",
};

export const AVAILABILITY_LABELS: Record<string, string> = {
  in_stock: "In Stock",
  made_to_order: "Made to Order",
  out_of_stock: "Currently Unavailable",
};

export const GENDER_LABELS: Record<string, string> = {
  women: "Women",
  men: "Men",
  unisex: "Unisex",
};

export const PRICE_TYPE_LABELS: Record<string, string> = {
  exact: "Display exact price",
  on_request: "Price on Request",
  contact: "Contact for Current Price",
};

export function priceLabel(p: Product): string {
  if (p.price_type === "exact" && p.price != null) {
    return `₹${p.price.toLocaleString("en-IN")}`;
  }
  return p.price_type === "contact" ? "Contact for Current Price" : "Price on Request";
}

/** Sets document title + meta description + og tags for local SEO. */
export function useSeo(title: string, description: string) {
  if (typeof document !== "undefined") {
    document.title = title;
    const set = (selector: string, attr: string, key: string, value: string) => {
      let el = document.head.querySelector<HTMLMetaElement>(selector);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", value);
    };
    set('meta[name="description"]', "name", "description", description);
    set('meta[property="og:title"]', "property", "og:title", title);
    set('meta[property="og:description"]', "property", "og:description", description);
    set('meta[property="og:type"]', "property", "og:type", "website");
  }
}
