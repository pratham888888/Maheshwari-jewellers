import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, MapPin, Phone } from "lucide-react";
import Layout from "@/components/Layout";
import ProductGallery from "@/components/ProductGallery";
import { ProductRatingSummary, RatingPicker, StarRow } from "@/components/ProductRating";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiGet, apiPost, ApiError } from "@/lib/api";
import type { Product, Review, ReviewPage } from "@/lib/types";
import { normalizeCategories, shouldShowRating } from "@/lib/types";
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
  const qc = useQueryClient();
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [reviewerName, setReviewerName] = useState("");

  const { data: product, isLoading, isError } = useQuery({
    queryKey: ["product", id],
    queryFn: () => apiGet<Product>(`/products/${id}`),
    enabled: Boolean(id),
  });

  const reviews = useQuery({
    queryKey: ["reviews", id],
    queryFn: () => apiGet<ReviewPage>(`/products/${id}/reviews?page_size=20`),
    enabled: Boolean(id),
  });

  const submitReview = useMutation({
    mutationFn: () =>
      apiPost<Review>(`/products/${id}/reviews`, {
        rating,
        text: reviewText.trim(),
        reviewer_name: reviewerName.trim() || "Customer",
      }),
    onSuccess: () => {
      toast.success("Thank you — your review was submitted.");
      setReviewText("");
      setReviewerName("");
      setRating(5);
      qc.invalidateQueries({ queryKey: ["reviews", id] });
      qc.invalidateQueries({ queryKey: ["product", id] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e) => {
      const detail = e instanceof ApiError ? (e.body as { detail?: string })?.detail : null;
      toast.error(typeof detail === "string" ? detail : "Could not submit review. Please try again.");
    },
  });

  useSeo(
    product
      ? `${product.name} | Maheshwari Jewellers, Modinagar`
      : "Product | Maheshwari Jewellers",
    product
      ? `${product.name} — ${PURITY_LABELS[product.purity] ?? product.purity}${product.weight ? `, ${product.weight}` : ""}. Enquire on WhatsApp with Maheshwari Jewellers, Modinagar.`
      : "Jewellery product details at Maheshwari Jewellers, Modinagar.",
  );

  const categoryLabel = product ? normalizeCategories(product).join(", ") : "";

  const spec = (label: string, value?: string | null) =>
    value ? (
      <div className="flex justify-between gap-4 py-2.5 border-b border-[#EFE9DF] last:border-0">
        <dt className="text-sm text-stone-500">{label}</dt>
        <dd className="text-sm font-medium text-stone-900 text-right" data-testid={`spec-${label.toLowerCase().replace(/[^a-z]+/g, "-")}`}>
          {value}
        </dd>
      </div>
    ) : null;

  const average = reviews.data?.average ?? product?.rating_average ?? 0;
  const count = reviews.data?.count ?? product?.rating_count ?? 0;

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
          <>
            <div className="mt-6 grid lg:grid-cols-2 gap-8 lg:gap-14">
              <ProductGallery images={product.images ?? []} productName={product.name} isDemo={product.is_demo} />

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

                <div className="mt-3">
                  <ProductRatingSummary average={average} count={count} />
                </div>

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
                  {spec("Category", categoryLabel)}
                  {spec("Subcategory", product.subcategory)}
                  {spec("Size", product.size)}
                  {spec("Finish", product.finish)}
                  {spec("Stone", product.stone_details)}
                  {spec("For", GENDER_LABELS[product.gender])}
                </dl>

                <p className="mt-6 text-xs text-stone-500 leading-relaxed">{PRICE_NOTE}</p>
              </div>
            </div>

            <section className="mt-12 max-w-3xl" data-testid="product-reviews-section">
              <h2 className="font-heading text-2xl text-stone-900">Ratings & Reviews</h2>
              <div className="mt-3">
                {shouldShowRating(average, count) ? (
                  <div className="flex items-center gap-3">
                    <StarRow value={average} size="md" />
                    <span className="text-lg font-semibold text-stone-900">{average.toFixed(1)}</span>
                    <span className="text-sm text-stone-500">based on {count} review{count === 1 ? "" : "s"}</span>
                  </div>
                ) : (
                  <p className="text-sm text-stone-500" data-testid="reviews-empty-summary">
                    No ratings yet
                  </p>
                )}
              </div>

              <form
                className="mt-6 bg-white rounded-xl border border-[#E8E2D8] p-5 space-y-4"
                data-testid="review-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (rating < 1 || rating > 5) {
                    toast.error("Please choose a rating from 1 to 5 stars.");
                    return;
                  }
                  submitReview.mutate();
                }}
              >
                <h3 className="font-heading text-lg text-stone-900">Rate & Review</h3>
                <div className="space-y-1.5">
                  <Label>Your rating</Label>
                  <RatingPicker value={rating} onChange={setRating} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reviewer-name">Name (optional)</Label>
                  <Input
                    id="reviewer-name"
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    maxLength={80}
                    placeholder="Customer"
                    data-testid="review-name-input"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="review-text">Review (optional)</Label>
                  <Textarea
                    id="review-text"
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    maxLength={2000}
                    rows={4}
                    placeholder="Share your experience with this piece…"
                    data-testid="review-text-input"
                  />
                </div>
                <Button
                  type="submit"
                  className="bg-[#996515] hover:bg-[#7A4D05]"
                  disabled={submitReview.isPending}
                  data-testid="review-submit-button"
                >
                  {submitReview.isPending ? "Submitting…" : "Submit review"}
                </Button>
              </form>

              <div className="mt-8 space-y-4" data-testid="reviews-list">
                {(reviews.data?.items ?? []).length === 0 ? (
                  <p className="text-sm text-stone-500">No reviews have been shared for this product yet.</p>
                ) : (
                  (reviews.data?.items ?? []).map((r) => (
                    <article key={r.id} className="rounded-xl border border-[#E8E2D8] bg-white p-4" data-testid={`review-${r.id}`}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-medium text-stone-900">{r.reviewer_name || "Customer"}</p>
                        <StarRow value={r.rating} />
                      </div>
                      {r.text && <p className="mt-2 text-sm text-stone-700 leading-relaxed whitespace-pre-line">{r.text}</p>}
                      <p className="mt-2 text-[11px] text-stone-400">
                        {new Date(r.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </article>
                  ))
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </Layout>
  );
}
