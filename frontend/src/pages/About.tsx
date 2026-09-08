import { Link } from "react-router-dom";
import { Gem, ShieldCheck, Sparkles } from "lucide-react";
import Layout from "@/components/Layout";
import { buttonVariants } from "@/components/ui/button";
import { PRICE_NOTE, useSeo, useSettings } from "@/lib/site";
import { cn } from "@/lib/utils";

const DEFAULT_ABOUT = `Maheshwari Jewellers is a jewellery store offering a range of gold and silver jewellery. We have a special focus on silver jewellery, including Regular Silver, 925 Sterling Silver and 999 Fine Silver.

Our collection includes jewellery for men and women, with designs suitable for everyday wear, gifting, festive occasions and special moments.

We aim to make it convenient for customers to explore our jewellery collection and enquire with us directly.`;

const HIGHLIGHTS = [
  { icon: Gem, title: "Silver Focus", body: "Regular Silver, 925 Sterling Silver and 999 Fine Silver, kept as separate collections." },
  { icon: Sparkles, title: "Gold Jewellery", body: "Rings, chains, bangles, pendants and sets for daily and festive wear." },
  { icon: ShieldCheck, title: "Direct Enquiry", body: "Prices depend on metal rates, weight and making charges — ask us for the current price." },
];

export default function About() {
  const s = useSettings();
  useSeo(
    "About Maheshwari Jewellers – Jewellery Store in Modinagar",
    "About Maheshwari Jewellers, a jewellery store in Modinagar offering gold jewellery and silver jewellery including Regular Silver, 925 Sterling Silver and 999 Fine Silver.",
  );
  const about = s.about?.trim() || DEFAULT_ABOUT;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <p className="text-[11px] tracking-[0.18em] uppercase font-semibold text-[#996515]">Modinagar, Uttar Pradesh</p>
        <h1 className="mt-2 font-heading text-4xl text-stone-900" data-testid="about-title">
          About {s.business_name}
        </h1>

        <div className="mt-6 bg-white rounded-xl border border-[#E8E2D8] p-6 sm:p-8">
          <p className="text-base text-stone-700 leading-relaxed whitespace-pre-line" data-testid="about-body">
            {about}
          </p>
        </div>

        <div className="mt-8 grid sm:grid-cols-3 gap-4">
          {HIGHLIGHTS.map((h) => (
            <div key={h.title} className="bg-[#F5EFE6] rounded-xl border border-[#E8E2D8] p-5" data-testid={`about-highlight-${h.title.toLowerCase().replace(/\s+/g, "-")}`}>
              <h.icon className="h-6 w-6 text-[#996515]" aria-hidden />
              <h2 className="mt-3 font-heading text-lg text-stone-900">{h.title}</h2>
              <p className="mt-1.5 text-sm text-stone-600 leading-relaxed">{h.body}</p>
            </div>
          ))}
        </div>

        <p className="mt-8 text-xs text-stone-500 leading-relaxed">{PRICE_NOTE}</p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/catalogue" className={cn(buttonVariants(), "bg-[#996515] hover:bg-[#7A4D05]")} data-testid="about-catalogue-link">
            Browse Jewellery
          </Link>
          <Link to="/contact" className={cn(buttonVariants({ variant: "outline" }))} data-testid="about-contact-link">
            Contact Us
          </Link>
        </div>
      </div>
    </Layout>
  );
}
