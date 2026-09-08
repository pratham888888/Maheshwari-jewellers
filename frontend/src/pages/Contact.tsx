import { MapPin, Phone, Clock, Instagram, Facebook } from "lucide-react";
import Layout from "@/components/Layout";
import StoreHours from "@/components/StoreHours";
import { buttonVariants } from "@/components/ui/button";
import { PRICE_NOTE, RATE_NOTE, telLink, useSeo, useSettings, waLink } from "@/lib/site";
import { cn } from "@/lib/utils";

export default function Contact() {
  const s = useSettings();
  useSeo(
    "Contact Maheshwari Jewellers – Jewellery Store in Modinagar",
    "Call, WhatsApp or get directions to Maheshwari Jewellers in Modinagar for gold and silver jewellery. Phone 9837149835. Open 10 AM to 8 PM, closed on Tuesdays.",
  );

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <p className="text-[11px] tracking-[0.18em] uppercase font-semibold text-[#996515]">Get in touch</p>
        <h1 className="mt-2 font-heading text-4xl text-stone-900" data-testid="contact-title">
          Contact {s.business_name}
        </h1>

        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-[#E8E2D8] p-6">
            <h2 className="font-heading text-xl text-stone-900">Store Details</h2>
            <ul className="mt-4 space-y-3 text-sm text-stone-700">
              <li className="flex items-start gap-3">
                <Phone className="h-4 w-4 mt-0.5 text-[#996515]" aria-hidden />
                <span>
                  Phone:{" "}
                  <a href={telLink(s.phone)} className="font-medium text-[#8A5A00] hover:underline" data-testid="contact-phone-link">
                    {s.phone}
                  </a>
                  <br />
                  WhatsApp: {s.whatsapp.replace(/^91/, "")}
                </span>
              </li>
              {s.address && (
                <li className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 mt-0.5 text-[#996515]" aria-hidden />
                  <span data-testid="contact-address">{s.address}</span>
                </li>
              )}
            </ul>

            <div className="mt-5 pt-4 border-t border-[#EFE9DF]">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-stone-900">
                <Clock className="h-4 w-4 text-[#996515]" aria-hidden /> Opening Hours
              </h3>
              <StoreHours className="mt-3" />
            </div>

            <div className="mt-6 grid gap-2">
              <a
                href={telLink(s.phone)}
                className={cn(buttonVariants(), "h-11 bg-[#996515] hover:bg-[#7A4D05]")}
                data-testid="contact-call-button"
              >
                <Phone className="h-4 w-4" /> Call Now
              </a>
              <a
                href={waLink(s.whatsapp, "Hello Maheshwari Jewellers, I would like to enquire about your jewellery.")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#25D366] text-sm font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5"
                data-testid="contact-whatsapp-button"
              >
                WhatsApp
              </a>
              <a
                href={s.maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonVariants({ variant: "outline" }), "h-11")}
                data-testid="contact-directions-button"
              >
                <MapPin className="h-4 w-4" /> Get Directions
              </a>
            </div>

            {(s.instagram || s.facebook) && (
              <div className="mt-6 flex gap-3 pt-4 border-t border-[#EFE9DF]">
                {s.instagram && (
                  <a href={s.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-stone-600 hover:text-[#996515]" data-testid="contact-instagram">
                    <Instagram className="h-5 w-5" />
                  </a>
                )}
                {s.facebook && (
                  <a href={s.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-stone-600 hover:text-[#996515]" data-testid="contact-facebook">
                    <Facebook className="h-5 w-5" />
                  </a>
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-[#E8E2D8] p-6">
            <h2 className="font-heading text-xl text-stone-900">Find Us on the Map</h2>
            <a
              href={s.maps_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 block rounded-lg overflow-hidden border border-[#E8E2D8] bg-[#F5EFE6] aspect-[4/3] grid place-items-center text-center p-6 transition-colors duration-200 hover:bg-[#EFE7DA]"
              data-testid="contact-map-card"
            >
              <span>
                <MapPin className="h-8 w-8 text-[#996515] mx-auto" aria-hidden />
                <span className="mt-3 block font-heading text-lg text-stone-900">
                  Open in Google Maps
                </span>
                <span className="mt-1 block text-sm text-stone-600">
                  Tap to get turn-by-turn directions to our store.
                </span>
              </span>
            </a>
            <p className="mt-4 text-xs text-stone-500 leading-relaxed">{RATE_NOTE}</p>
          </div>
        </div>

        <p className="mt-8 text-xs text-stone-500 leading-relaxed">{PRICE_NOTE}</p>
      </div>
    </Layout>
  );
}
