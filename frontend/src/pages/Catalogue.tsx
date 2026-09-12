import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, SlidersHorizontal, X } from "lucide-react";
import Layout from "@/components/Layout";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { apiGet } from "@/lib/api";
import type { Category, ProductPage } from "@/lib/types";
import { PRICE_NOTE, useSeo } from "@/lib/site";
import { cn } from "@/lib/utils";

const METALS = [
  { value: "", label: "All Metals" },
  { value: "gold", label: "Gold" },
  { value: "silver", label: "Silver" },
];
const PURITIES = [
  { value: "", label: "All Purities" },
  { value: "regular", label: "Regular Silver" },
  { value: "925", label: "925 Sterling" },
  { value: "999", label: "999 Fine" },
  { value: "24K", label: "24K Gold" },
  { value: "22K", label: "22K Gold" },
  { value: "20K", label: "20K Gold" },
  { value: "18K", label: "18K Gold" },
  { value: "14K", label: "14K Gold" },
];
const GENDERS = [
  { value: "", label: "Everyone" },
  { value: "women", label: "Women" },
  { value: "men", label: "Men" },
  { value: "unisex", label: "Unisex" },
];
const SILVER_PURITIES = ["regular", "925", "999"];
const GOLD_PURITIES = ["24K", "22K", "20K", "18K", "14K"];
const AVAILABILITIES = [
  { value: "", label: "Any" },
  { value: "in_stock", label: "In Stock" },
  { value: "made_to_order", label: "Made to Order" },
  { value: "out_of_stock", label: "Unavailable" },
];

function titleFor(params: URLSearchParams): string {
  if (params.get("purity") === "925") return "925 Sterling Silver Jewellery";
  if (params.get("purity") === "999") return "999 Fine Silver Jewellery";
  if (params.get("metal") === "gold") return "Gold Jewellery";
  if (params.get("metal") === "silver") return "Silver Jewellery";
  if (params.get("gender") === "men") return "Men's Jewellery";
  if (params.get("gender") === "women") return "Women's Jewellery";
  if (params.get("new_arrival")) return "New Arrivals";
  return "Jewellery Catalogue";
}

export default function Catalogue() {
  const [params, setParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(params.get("search") ?? "");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);

  const title = titleFor(params);
  useSeo(
    `${title} in Modinagar | Maheshwari Jewellers`,
    `Browse ${title.toLowerCase()} at Maheshwari Jewellers, a jewellery store in Modinagar. Enquire on WhatsApp for the latest prices and availability.`,
  );

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);

    // Metal and purity must stay compatible, otherwise the user lands on a
    // guaranteed-empty result set (e.g. metal=gold + purity=925).
    if (key === "metal" && value) {
      const purity = next.get("purity");
      const allowed = value === "gold" ? GOLD_PURITIES : SILVER_PURITIES;
      if (purity && !allowed.includes(purity)) next.delete("purity");
    }
    if (key === "purity" && value) {
      const metal = GOLD_PURITIES.includes(value) ? "gold" : "silver";
      next.set("metal", metal);
    }

    setParams(next);
    setPage(1);
  };

  const query = useMemo(() => {
    const q = new URLSearchParams(params);
    q.set("page", String(page));
    q.set("page_size", "24");
    return q.toString();
  }, [params, page]);

  const products = useQuery({
    queryKey: ["products", query],
    queryFn: () => apiGet<ProductPage>(`/products?${query}`),
  });

  const categories = useQuery({
    queryKey: ["categories", params.get("metal") ?? ""],
    queryFn: () =>
      apiGet<Category[]>(
        params.get("metal") ? `/categories?metal=${params.get("metal")}` : "/categories",
      ),
  });

  const activeCount = ["metal", "purity", "gender", "category", "availability", "min_price", "max_price"].filter(
    (k) => params.get(k),
  ).length;

  const pills = (
    key: string,
    options: { value: string; label: string }[],
    label: string,
    prefix: string,
  ) => (
    <div className="space-y-2">
      <Label className="text-xs font-semibold tracking-[0.14em] uppercase text-stone-500">{label}</Label>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const active = (params.get(key) ?? "") === o.value;
          return (
            <button
              key={o.value || "all"}
              type="button"
              onClick={() => setParam(key, o.value)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors duration-200 min-h-[36px]",
                active
                  ? "bg-[#996515] text-white border-[#996515]"
                  : "bg-white text-stone-700 border-[#E8E2D8] hover:border-[#B8860B]",
              )}
              data-testid={`${prefix}-${key}-${o.value || "all"}`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );

  // Rendered twice (desktop aside + mobile sheet), so every testid takes a prefix
  // to keep it unique while both copies are in the DOM.
  const renderFilters = (prefix: string) => (
    <div className="space-y-5" data-testid={`${prefix}-panel`}>
      {pills("metal", METALS, "Metal", prefix)}
      {pills("purity", PURITIES, "Purity", prefix)}
      {pills("gender", GENDERS, "For", prefix)}
      {pills("availability", AVAILABILITIES, "Availability", prefix)}

      <div className="space-y-2">
        <Label className="text-xs font-semibold tracking-[0.14em] uppercase text-stone-500">Category</Label>
        <select
          value={params.get("category") ?? ""}
          onChange={(e) => setParam("category", e.target.value)}
          className="w-full h-10 rounded-md border border-[#E8E2D8] bg-white px-3 text-sm"
          data-testid={`${prefix}-category-select`}
        >
          <option value="">All Categories</option>
          {categories.data?.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-semibold tracking-[0.14em] uppercase text-stone-500">Price Range (₹)</Label>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={params.get("min_price") ?? ""}
            onChange={(e) => setParam("min_price", e.target.value)}
            data-testid={`${prefix}-min-price`}
          />
          <Input
            type="number"
            placeholder="Max"
            value={params.get("max_price") ?? ""}
            onChange={(e) => setParam("max_price", e.target.value)}
            data-testid={`${prefix}-max-price`}
          />
        </div>
        <p className="text-[11px] text-stone-500">Only applies to products with a displayed price.</p>
      </div>

      {activeCount > 0 && (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            setParams(new URLSearchParams());
            setSearchInput("");
            setPage(1);
          }}
          data-testid={`${prefix}-clear-button`}
        >
          <X className="h-4 w-4" /> Clear all filters
        </Button>
      )}
    </div>
  );

  const total = products.data?.total ?? 0;
  const pageSize = products.data?.page_size ?? 24;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-[11px] tracking-[0.18em] uppercase font-semibold text-[#996515]">Maheshwari Jewellers</p>
        <h1 className="mt-1 font-heading text-3xl sm:text-4xl text-stone-900" data-testid="catalogue-title">
          {title}
        </h1>

        <form
          className="mt-5 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setParam("search", searchInput.trim());
          }}
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" aria-hidden />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search rings, chains, payal, SKU…"
              className="pl-9 bg-white h-11"
              aria-label="Search products"
              data-testid="catalogue-search-input"
            />
          </div>
          <Button type="submit" className="h-11 bg-[#996515] hover:bg-[#7A4D05]" data-testid="catalogue-search-button">
            Search
          </Button>
          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetTrigger
              render={
                <Button variant="outline" className="h-11 lg:hidden" data-testid="open-filters-button">
                  <SlidersHorizontal className="h-4 w-4" />
                  {activeCount > 0 && <span className="ml-1 text-xs">({activeCount})</span>}
                </Button>
              }
            />
            <SheetContent side="left" className="w-[88vw] sm:w-96 overflow-y-auto bg-[#FAF7F2]">
              <SheetTitle className="font-heading text-lg mb-4">Filters</SheetTitle>
              {renderFilters("mfilter")}
            </SheetContent>
          </Sheet>
        </form>

        <div className="mt-8 grid lg:grid-cols-[260px_1fr] gap-8">
          <aside className="hidden lg:block bg-white rounded-xl border border-[#E8E2D8] p-5 h-fit sticky top-24">
            {renderFilters("filter")}
          </aside>

          <div>
            <p className="text-sm text-stone-500" data-testid="results-count">
              {products.isLoading ? "Loading products…" : `${total} product${total === 1 ? "" : "s"} found`}
            </p>

            {products.isError && (
              <p className="mt-6 text-sm text-stone-600" data-testid="catalogue-error">
                We could not load the catalogue right now. Please WhatsApp or call us — we will gladly
                share photos and prices.
              </p>
            )}

            {!products.isError && total === 0 && !products.isLoading && (
              <div className="mt-10 text-center py-14 bg-white rounded-xl border border-[#E8E2D8]" data-testid="no-results">
                <p className="font-heading text-xl text-stone-800">No jewellery matches these filters</p>
                <p className="mt-2 text-sm text-stone-500">Try clearing a filter or searching a different term.</p>
              </div>
            )}

            <div className="mt-5 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6" data-testid="product-grid">
              {products.data?.items.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>

            {pageCount > 1 && (
              <div className="mt-10 flex items-center justify-center gap-3">
                <Button
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage((n) => n - 1)}
                  data-testid="prev-page-button"
                >
                  Previous
                </Button>
                <span className="text-sm text-stone-600" data-testid="page-indicator">
                  Page {page} of {pageCount}
                </span>
                <Button
                  variant="outline"
                  disabled={page >= pageCount}
                  onClick={() => setPage((n) => n + 1)}
                  data-testid="next-page-button"
                >
                  Next
                </Button>
              </div>
            )}

            <p className="mt-10 text-xs text-stone-500 leading-relaxed">{PRICE_NOTE}</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
