import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { shouldShowRating } from "@/lib/types";

export function StarRow({
  value,
  size = "sm",
  className,
}: {
  value: number;
  size?: "sm" | "md";
  className?: string;
}) {
  const px = size === "md" ? "h-5 w-5" : "h-3.5 w-3.5";
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(px, n <= Math.round(value) ? "fill-[#996515] text-[#996515]" : "text-stone-300")}
        />
      ))}
    </span>
  );
}

/** Product-card / summary rating display with >3 rule. */
export function ProductRatingSummary({
  average,
  count,
  compact = false,
}: {
  average: number;
  count: number;
  compact?: boolean;
}) {
  if (!shouldShowRating(average, count)) {
    return (
      <p className={cn("text-xs text-stone-500", compact && "text-[11px]")} data-testid="rating-empty">
        No ratings yet
      </p>
    );
  }
  return (
    <div className="flex items-center gap-1.5" data-testid="rating-summary">
      <StarRow value={average} />
      <span className="text-xs font-medium text-stone-800">{average.toFixed(1)}</span>
      <span className="text-xs text-stone-500">({count})</span>
    </div>
  );
}

export function RatingPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex items-center gap-1" data-testid="rating-picker">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`${n} star${n === 1 ? "" : "s"}`}
          className="p-1"
          onClick={() => onChange(n)}
          data-testid={`rating-star-${n}`}
        >
          <Star className={cn("h-7 w-7", n <= value ? "fill-[#996515] text-[#996515]" : "text-stone-300")} />
        </button>
      ))}
    </div>
  );
}
