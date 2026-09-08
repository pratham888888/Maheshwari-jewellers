// Hand-written mirrors of backend/models/catalogue.py — keep both sides in sync in one edit.

export type PriceType = "exact" | "on_request" | "contact";
export type Metal = "gold" | "silver";
export type Gender = "women" | "men" | "unisex";
export type Availability = "in_stock" | "made_to_order" | "out_of_stock";

export interface ProductImage {
  url: string;
  alt: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  metal: Metal;
  purity: string;
  category: string;
  subcategory: string;
  weight: string;
  price: number | null;
  price_type: PriceType;
  description: string;
  gender: Gender;
  finish: string;
  stone_details: string;
  size: string;
  availability: Availability;
  featured: boolean;
  new_arrival: boolean;
  published: boolean;
  is_demo: boolean;
  images: ProductImage[];
  created_at: string;
  updated_at: string;
}

export type ProductInput = Omit<Product, "id" | "created_at" | "updated_at">;

export interface ProductPage {
  items: Product[];
  total: number;
  page: number;
  page_size: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  metal: "gold" | "silver" | "both";
}

export interface Rates {
  gold_24k: string;
  gold_22k: string;
  silver_999: string;
  silver_925: string;
  unit: string;
  updated_on: string;
}

export interface Settings {
  business_name: string;
  phone: string;
  whatsapp: string;
  maps_url: string;
  address: string;
  opening_hours: string;
  closed_days: string;
  about: string;
  description: string;
  instagram: string;
  facebook: string;
  other_social: string;
  logo_url: string;
  banner_url: string;
  rates: Rates;
}

export interface AdminUser {
  username: string;
}

export interface UploadResult {
  urls: string[];
}

export interface OkResponse {
  ok: boolean;
}

export const emptyProduct = (): ProductInput => ({
  name: "",
  sku: "",
  metal: "silver",
  purity: "925",
  category: "",
  subcategory: "",
  weight: "",
  price: null,
  price_type: "on_request",
  description: "",
  gender: "unisex",
  finish: "",
  stone_details: "",
  size: "",
  availability: "in_stock",
  featured: false,
  new_arrival: false,
  published: true,
  is_demo: false,
  images: [],
});
