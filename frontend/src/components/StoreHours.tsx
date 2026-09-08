import { useSettings } from "@/lib/site";
import { cn } from "@/lib/utils";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/** Renders the full weekly schedule, marking each closed day explicitly. */
export function useWeeklyHours() {
  const s = useSettings();
  const closed = s.closed_days
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
  return DAYS.map((day) => ({
    day,
    closed: closed.includes(day.toLowerCase()),
    hours: s.opening_hours || "10:00 AM – 8:00 PM",
  }));
}

export default function StoreHours({
  variant = "light",
  className,
}: {
  variant?: "light" | "dark";
  className?: string;
}) {
  const rows = useWeeklyHours();
  const dark = variant === "dark";

  return (
    <ul className={cn("space-y-1.5 text-sm", className)} data-testid="store-hours">
      {rows.map((r) => (
        <li
          key={r.day}
          className={cn(
            "flex justify-between gap-4 py-1 border-b last:border-0",
            dark ? "border-stone-800" : "border-[#EFE9DF]",
          )}
          data-testid={`hours-${r.day.toLowerCase()}`}
        >
          <span className={dark ? "text-stone-400" : "text-stone-600"}>{r.day}</span>
          {r.closed ? (
            <span className="font-semibold text-red-600" data-testid={`hours-closed-${r.day.toLowerCase()}`}>
              Closed
            </span>
          ) : (
            <span className={cn("font-medium", dark ? "text-stone-200" : "text-stone-900")}>
              {r.hours}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
