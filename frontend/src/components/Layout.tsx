import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, Phone, MapPin, X, Gem, Instagram, Facebook } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { useSettings, waLink, telLink, RATE_NOTE } from "@/lib/site";
import StoreHours from "@/components/StoreHours";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/catalogue?metal=gold", label: "Gold Jewellery" },
  { to: "/catalogue?metal=silver", label: "Silver Jewellery" },
  { to: "/catalogue?purity=925", label: "925 Silver" },
  { to: "/catalogue?purity=999", label: "999 Silver" },
  { to: "/catalogue?gender=men", label: "Men's Jewellery" },
  { to: "/catalogue?gender=women", label: "Women's Jewellery" },
  { to: "/catalogue?new_arrival=true", label: "New Arrivals" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export function RatesStrip() {
  const s = useSettings();
  const r = s.rates;
  const items = [
    { label: "24K Gold", value: r.gold_24k },
    { label: "22K Gold", value: r.gold_22k },
    { label: "999 Silver", value: r.silver_999 },
    { label: "925 Silver", value: r.silver_925 },
  ].filter((i) => i.value && i.value !== "—");

  return (
    <div className="bg-[#F5EAD4] border-y border-[#E2D2B3]" data-testid="rates-strip">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center gap-4 overflow-x-auto">
        <span className="shrink-0 text-[11px] font-semibold tracking-[0.18em] uppercase text-[#6B4423]">
          Today's Rates
        </span>
        {items.length === 0 ? (
          <span className="text-sm text-[#6B4423] whitespace-nowrap" data-testid="rates-empty">
            Please contact us for today's gold &amp; silver rates.
          </span>
        ) : (
          items.map((i) => (
            <span
              key={i.label}
              className="shrink-0 text-sm text-[#45260A] whitespace-nowrap"
              data-testid={`rate-${i.label.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <span className="text-[#6B4423]">{i.label}</span>{" "}
              <strong className="font-semibold">₹{i.value}</strong>{" "}
              <span className="text-xs text-[#6B4423]">{r.unit}</span>
            </span>
          ))
        )}
        {r.updated_on && (
          <span className="shrink-0 text-xs text-[#6B4423]">Updated {r.updated_on}</span>
        )}
      </div>
    </div>
  );
}

export function Header() {
  const s = useSettings();
  const [open, setOpen] = useState(false);
  const loc = useLocation();

  const link = (to: string, label: string, prefix: string, onClick?: () => void) => (
    <NavLink
      key={prefix + to + label}
      to={to}
      onClick={onClick}
      className={cn(
        "text-sm transition-colors duration-200 hover:text-[#996515]",
        loc.pathname + loc.search === to ? "text-[#996515] font-semibold" : "text-stone-700",
      )}
      data-testid={`${prefix}-${label.toLowerCase().replace(/[^a-z]+/g, "-")}`}
    >
      {label}
    </NavLink>
  );

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E8E2D8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 shrink-0 mr-auto"
            data-testid="brand-logo-link"
          >
            <Gem className="h-6 w-6 text-[#996515] shrink-0" aria-hidden />
            <span className="font-heading text-base sm:text-xl tracking-tight text-stone-900 whitespace-nowrap">
              {s.business_name}
            </span>
          </Link>

          <nav className="hidden xl:flex items-center gap-3 shrink min-w-0 overflow-x-auto">
            {NAV.map((n) => link(n.to, n.label, "nav"))}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/admin/login"
              className="hidden xl:inline text-sm text-stone-500 hover:text-[#996515] transition-colors duration-200 whitespace-nowrap"
              data-testid="nav-admin-desktop"
            >
              Admin Login
            </Link>
            <a
              href={waLink(s.whatsapp, "Hello Maheshwari Jewellers, I would like to enquire about your jewellery.")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md bg-[#25D366] px-3 py-2 text-sm font-semibold text-white shadow-xs transition-transform duration-200 hover:-translate-y-0.5"
              data-testid="header-whatsapp-button"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
                <path d="M17.5 14.4c-.3-.2-1.7-.9-2-1-.3-.1-.5-.2-.7.1s-.7 1-.9 1.2c-.2.2-.3.2-.6.1-1.7-.8-2.8-1.5-3.9-3.4-.3-.5.3-.5.8-1.5.1-.2 0-.4 0-.5s-.7-1.6-.9-2.2c-.2-.5-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.4 1.9.8 2.6.9 3.5.8.6-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3zM12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2zm0 18.2c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-3.1.8.8-3-.2-.3A8.2 8.2 0 1 1 12 20.2z" />
              </svg>
              <span className="hidden sm:inline">WhatsApp</span>
            </a>

            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger
                render={
                  <Button variant="outline" size="icon" className="xl:hidden" aria-label="Open navigation menu" data-testid="mobile-menu-button">
                    <Menu className="h-5 w-5" />
                  </Button>
                }
              />
              <SheetContent side="right" showCloseButton={false} className="w-[86vw] sm:w-80 bg-[#FAF7F2] p-0">
                <div className="flex items-center justify-between px-5 h-16 border-b border-[#E8E2D8]">
                  <SheetTitle className="font-heading text-lg">Menu</SheetTitle>
                  <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close navigation menu" data-testid="mobile-menu-close">
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <nav className="flex flex-col p-5 gap-4" data-testid="mobile-nav">
                  {NAV.map((n) => link(n.to, n.label, "mnav", () => setOpen(false)))}
                  <Link
                    to="/admin/login"
                    onClick={() => setOpen(false)}
                    className="text-sm text-stone-500 pt-3 border-t border-[#E8E2D8]"
                    data-testid="nav-admin"
                  >
                    Admin Login
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}

export function MobileDock() {
  const s = useSettings();
  const base =
    "flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium min-h-[56px]";
  return (
    <div
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 flex bg-white/95 backdrop-blur-md border-t border-amber-200/60 shadow-lg"
      data-testid="mobile-dock"
    >
      <a href={telLink(s.phone)} className={cn(base, "text-stone-800")} data-testid="dock-call-button">
        <Phone className="h-5 w-5 text-[#996515]" aria-hidden />
        Call
      </a>
      <a
        href={waLink(s.whatsapp, "Hello Maheshwari Jewellers, I would like to enquire about your jewellery.")}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(base, "text-white bg-[#25D366]")}
        data-testid="dock-whatsapp-button"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
          <path d="M17.5 14.4c-.3-.2-1.7-.9-2-1-.3-.1-.5-.2-.7.1s-.7 1-.9 1.2c-.2.2-.3.2-.6.1-1.7-.8-2.8-1.5-3.9-3.4-.3-.5.3-.5.8-1.5.1-.2 0-.4 0-.5s-.7-1.6-.9-2.2c-.2-.5-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.4 1.9.8 2.6.9 3.5.8.6-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3zM12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2zm0 18.2c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-3.1.8.8-3-.2-.3A8.2 8.2 0 1 1 12 20.2z" />
        </svg>
        WhatsApp
      </a>
      <a
        href={s.maps_url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(base, "text-stone-800")}
        data-testid="dock-directions-button"
      >
        <MapPin className="h-5 w-5 text-[#996515]" aria-hidden />
        Directions
      </a>
    </div>
  );
}

export function Footer() {
  const s = useSettings();
  return (
    <footer className="bg-[#1C1917] text-stone-300 mt-16" data-testid="site-footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid gap-10 md:grid-cols-3">
        <div>
          <h3 className="font-heading text-xl text-[#E5C07B]">{s.business_name}</h3>
          <p className="mt-1 text-xs tracking-[0.18em] uppercase text-stone-400">
            Tradition • Purity • Trust
          </p>
          <p className="mt-4 text-sm leading-relaxed text-stone-400">
            Gold and silver jewellery, with a special focus on Regular Silver, 925 Sterling Silver
            and 999 Fine Silver.
          </p>
          <div className="mt-4 flex gap-3">
            {s.instagram && (
              <a href={s.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" data-testid="footer-instagram">
                <Instagram className="h-5 w-5 hover:text-[#E5C07B] transition-colors duration-200" />
              </a>
            )}
            {s.facebook && (
              <a href={s.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" data-testid="footer-facebook">
                <Facebook className="h-5 w-5 hover:text-[#E5C07B] transition-colors duration-200" />
              </a>
            )}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold tracking-[0.14em] uppercase text-stone-200">Browse</h4>
          <ul className="mt-4 space-y-2 text-sm">
            {NAV.slice(1, 8).map((n) => (
              <li key={n.label}>
                <Link to={n.to} className="hover:text-[#E5C07B] transition-colors duration-200">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold tracking-[0.14em] uppercase text-stone-200">Contact</h4>
          <ul className="mt-4 space-y-2 text-sm text-stone-400">
            <li>
              <a href={telLink(s.phone)} className="hover:text-[#E5C07B]" data-testid="footer-phone">
                Phone: {s.phone}
              </a>
            </li>
            <li>WhatsApp: {s.whatsapp.replace(/^91/, "")}</li>
            {s.address && <li>{s.address}</li>}
          </ul>

          <h4 className="mt-6 text-sm font-semibold tracking-[0.14em] uppercase text-stone-200">
            Opening Hours
          </h4>
          <StoreHours variant="dark" className="mt-3 max-w-xs" />
          <a
            href={s.maps_url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-4 bg-transparent text-stone-200 border-stone-600 hover:bg-stone-800")}
            data-testid="footer-directions-button"
          >
            <MapPin className="h-4 w-4" /> Get Directions
          </a>
        </div>
      </div>
      <div className="border-t border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 text-xs text-stone-500 flex flex-col sm:flex-row justify-between gap-2">
          <span>© {new Date().getFullYear()} {s.business_name}, Modinagar. All rights reserved.</span>
          <span className="max-w-xl">{RATE_NOTE}</span>
        </div>
      </div>
    </footer>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2]">
      <Header />
      <RatesStrip />
      <main className="flex-1 pb-20 lg:pb-0">{children}</main>
      <Footer />
      <MobileDock />
    </div>
  );
}
