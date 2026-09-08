import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MapPin, ArrowRight } from "lucide-react";
import Layout from "@/components/Layout";
import ProductCard from "@/components/ProductCard";
import { buttonVariants } from "@/components/ui/button";
import { apiGet, resolveMediaUrl } from "@/lib/api";
import type { ProductPage } from "@/lib/types";
import { PRICE_NOTE, useSeo, useSettings, waLink } from "@/lib/site";
import { cn } from "@/lib/utils";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1744822220368-c380740bfc7f?crop=entropy&cs=srgb&fm=jpg&w=1400&q=80";

const CATEGORIES = [
  { label: "Gold Jewellery", to: "/catalogue?metal=gold", img: "https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?crop=entropy&cs=srgb&fm=jpg&w=600&q=75" },
  { label: "Silver Jewellery", to: "/catalogue?metal=silver", img: "https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?crop=entropy&cs=srgb&fm=jpg&w=600&q=75" },
  { label: "925 Sterling Silver", to: "/catalogue?purity=925", img: "https://images.unsplash.com/photo-1583937443566-6fe1a1c6e400?crop=entropy&cs=srgb&fm=jpg&w=600&q=75" },
  { label: "999 Fine Silver", to: "/catalogue?purity=999", img: "https://images.unsplash.com/photo-1720637594911-fb18f28eb913?crop=entropy&cs=srgb&fm=jpg&w=600&q=75" },
  { label: "Men's Jewellery", to: "/catalogue?gender=men", img: "https://images.unsplash.com/photo-1721807644561-9efcabee5c42?crop=entropy&cs=srgb&fm=jpg&w=600&q=75" },
  { label: "Women's Jewellery", to: "/catalogue?gender=women", img: "https://images.unsplash.com/photo-1697713465161-d872b22723a2?crop=entropy&cs=srgb&fm=jpg&w=600&q=75" },
];

export default function Home() {
  const s = useSettings();
  useSeo(
    "Maheshwari Jewellers – Gold & Silver Jewellery Store in Modinagar",
    "Maheshwari Jewellers, a jewellery store in Modinagar offering gold jewellery and silver jewellery including Regular Silver, 925 Sterling Silver and 999 Fine Silver. Call or WhatsApp for prices.",
  );

  const featured = useQuery({
    queryKey: ["products", "featured"],
    queryFn: () => apiGet<ProductPage>("/products?featured=true&page_size=8"),
  });
  const newArrivals = useQuery({
    queryKey: ["products", "new"],
    queryFn: () => apiGet<ProductPage>("/products?new_arrival=true&page_size=4"),
  });

  return (
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden" data-testid="hero-section">
        <img
          src={s.banner_url ? resolveMediaUrl(s.banner_url) : HERO_IMAGE}
          alt="Silver and gold jewellery at Maheshwari Jewellers, Modinagar"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1C1917]/90 via-[#1C1917]/70 to-[#1C1917]/35" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
          <div className="max-w-xl animate-[fade-up_0.6s_ease-out_both]">
            <p className="text-[11px] tracking-[0.28em] uppercase text-[#E5C07B] font-semibold">
              Modinagar, Uttar Pradesh
            </p>
            <h1 className="mt-3 font-heading text-4xl sm:text-5xl lg:text-6xl text-white tracking-tight leading-[1.05]">
              MAHESHWARI JEWELLERS
            </h1>
            <p className="mt-4 font-heading text-lg sm:text-2xl text-[#F3E5AB] italic">
              Gold &amp; Silver Jewellery for Every Occasion
            </p>
            <p className="mt-4 text-sm sm:text-base text-stone-200 leading-relaxed">
              Explore a carefully selected range of gold and silver jewellery, with a special focus
              on Regular Silver, 925 Sterling Silver and 999 Fine Silver.
            </p>
            <p className="mt-5 text-xs tracking-[0.3em] uppercase text-[#E5C07B]">
              Tradition • Purity • Trust
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/catalogue"
                className={cn(buttonVariants({ size: "lg" }), "bg-[#B8860B] hover:bg-[#996515] text-white")}
                data-testid="hero-explore-button"
              >
                Explore Jewellery <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href={waLink(s.whatsapp, "Hello Maheshwari Jewellers, I would like to enquire about your jewellery.")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center gap-2 rounded-md bg-[#25D366] px-5 text-sm font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5"
                data-testid="hero-whatsapp-button"
              >
                WhatsApp Us
              </a>
              <a
                href={s.maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center gap-2 rounded-md border border-white/40 bg-white/10 px-5 text-sm font-semibold text-white backdrop-blur-sm transition-colors duration-200 hover:bg-white/20"
                data-testid="hero-directions-button"
              >
                <MapPin className="h-4 w-4" /> Get Directions
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14" data-testid="categories-section">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] tracking-[0.18em] uppercase font-semibold text-[#996515]">Browse</p>
            <h2 className="mt-1 font-heading text-2xl sm:text-3xl text-stone-900">Featured Categories</h2>
          </div>
          <Link to="/catalogue" className="text-sm text-[#8A5A00] hover:underline shrink-0" data-testid="view-all-categories">
            View all
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {CATEGORIES.map((c) => (
            <Link
              key={c.label}
              to={c.to}
              className="group relative aspect-[3/4] rounded-xl overflow-hidden border border-[#E8E2D8] shadow-xs hover:shadow-md transition-shadow duration-300"
              data-testid={`category-card-${c.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
            >
              <img src={c.img} alt={`${c.label} at Maheshwari Jewellers Modinagar`} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1C1917]/85 via-[#1C1917]/20 to-transparent" />
              <span className="absolute bottom-0 inset-x-0 p-3 text-white font-heading text-sm leading-tight">
                {c.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="bg-white border-y border-[#E8E2D8]" data-testid="featured-products-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <p className="text-[11px] tracking-[0.18em] uppercase font-semibold text-[#996515]">Handpicked</p>
          <h2 className="mt-1 font-heading text-2xl sm:text-3xl text-stone-900">Featured Jewellery</h2>

          <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {featured.data?.items.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
          {featured.isError && (
            <p className="mt-6 text-sm text-stone-500" data-testid="featured-error">
              Our catalogue is not loading right now. Please WhatsApp or call us to see the collection.
            </p>
          )}
          {!featured.isError && featured.data?.items.length === 0 && (
            <p className="mt-6 text-sm text-stone-500">No featured products yet.</p>
          )}
          <p className="mt-8 text-xs text-stone-500 max-w-3xl leading-relaxed">{PRICE_NOTE}</p>
        </div>
      </section>

      {/* New arrivals */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14" data-testid="new-arrivals-section">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] tracking-[0.18em] uppercase font-semibold text-[#996515]">Just In</p>
            <h2 className="mt-1 font-heading text-2xl sm:text-3xl text-stone-900">New Arrivals</h2>
          </div>
          <Link to="/catalogue?new_arrival=true" className="text-sm text-[#8A5A00] hover:underline shrink-0" data-testid="view-all-new-arrivals">
            See all
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
          {newArrivals.data?.items.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
        {!newArrivals.isError && newArrivals.data?.items.length === 0 && (
          <p className="mt-6 text-sm text-stone-500">No new arrivals listed at the moment.</p>
        )}
      </section>

      {/* About teaser */}
      <section className="bg-[#F5EFE6] border-y border-[#E8E2D8]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 text-center">
          <h2 className="font-heading text-2xl sm:text-3xl text-stone-900">About Maheshwari Jewellers</h2>
          <p className="mt-4 text-sm sm:text-base text-stone-700 leading-relaxed">
            Maheshwari Jewellers is a jewellery store offering a range of gold and silver jewellery,
            with a special focus on Regular Silver, 925 Sterling Silver and 999 Fine Silver.
          </p>
          <Link to="/about" className={cn(buttonVariants({ variant: "outline" }), "mt-6")} data-testid="home-about-link">
            Read more
          </Link>
        </div>
      </section>
    </Layout>
  );
}
