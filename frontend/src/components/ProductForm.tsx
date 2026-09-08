import { useRef, useState } from "react";
import { toast } from "sonner";
import { GripVertical, Star, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Category, ProductInput, UploadResult } from "@/lib/types";
import { PRICE_TYPE_LABELS } from "@/lib/site";
import { cn } from "@/lib/utils";

const field = "space-y-1.5";
const selectCls = "w-full h-10 rounded-md border border-[#E8E2D8] bg-white px-3 text-sm";

export default function ProductForm({
  value,
  onChange,
  onSubmit,
  onCancel,
  categories,
  saving,
  submitLabel,
}: {
  value: ProductInput;
  onChange: (next: ProductInput) => void;
  onSubmit: () => void;
  onCancel: () => void;
  categories: Category[];
  saving: boolean;
  submitLabel: string;
}) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = <K extends keyof ProductInput>(key: K, v: ProductInput[K]) =>
    onChange({ ...value, [key]: v });

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const form = new FormData();
    Array.from(files).forEach((f) => form.append("files", f));
    setUploading(true);
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as UploadResult;
      onChange({
        ...value,
        images: [...value.images, ...data.urls.map((url) => ({ url, alt: value.name }))],
      });
      toast.success(`${data.urls.length} image(s) uploaded`);
    } catch {
      toast.error("Image upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const moveImage = (from: number, to: number) => {
    if (to < 0 || to >= value.images.length) return;
    const next = [...value.images];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    set("images", next);
  };

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      data-testid="product-form"
    >
      <div className="grid sm:grid-cols-2 gap-4">
        <div className={field}>
          <Label htmlFor="p-name">Product Name *</Label>
          <Input id="p-name" required value={value.name} onChange={(e) => set("name", e.target.value)} data-testid="product-form-name" />
        </div>
        <div className={field}>
          <Label htmlFor="p-sku">SKU / Product ID</Label>
          <Input id="p-sku" value={value.sku} onChange={(e) => set("sku", e.target.value)} placeholder="Auto-generated if blank" data-testid="product-form-sku" />
        </div>
        <div className={field}>
          <Label htmlFor="p-metal">Metal</Label>
          <select id="p-metal" className={selectCls} value={value.metal} onChange={(e) => set("metal", e.target.value as ProductInput["metal"])} data-testid="product-form-metal">
            <option value="silver">Silver</option>
            <option value="gold">Gold</option>
          </select>
        </div>
        <div className={field}>
          <Label htmlFor="p-purity">Purity</Label>
          <select id="p-purity" className={selectCls} value={value.purity} onChange={(e) => set("purity", e.target.value)} data-testid="product-form-purity">
            {value.metal === "silver" ? (
              <>
                <option value="regular">Regular Silver</option>
                <option value="925">925 Sterling Silver</option>
                <option value="999">999 Fine Silver</option>
              </>
            ) : (
              <>
                <option value="24K">24K Gold</option>
                <option value="22K">22K Gold</option>
                <option value="18K">18K Gold</option>
                <option value="14K">14K Gold</option>
              </>
            )}
          </select>
        </div>
        <div className={field}>
          <Label htmlFor="p-category">Category</Label>
          <select id="p-category" className={selectCls} value={value.category} onChange={(e) => set("category", e.target.value)} data-testid="product-form-category">
            <option value="">Select a category</option>
            {categories
              .filter((c) => c.metal === "both" || c.metal === value.metal)
              .map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
          </select>
        </div>
        <div className={field}>
          <Label htmlFor="p-sub">Subcategory</Label>
          <Input id="p-sub" value={value.subcategory} onChange={(e) => set("subcategory", e.target.value)} data-testid="product-form-subcategory" />
        </div>
        <div className={field}>
          <Label htmlFor="p-weight">Weight</Label>
          <Input id="p-weight" value={value.weight} onChange={(e) => set("weight", e.target.value)} placeholder="e.g. 12.5 g" data-testid="product-form-weight" />
        </div>
        <div className={field}>
          <Label htmlFor="p-size">Size</Label>
          <Input id="p-size" value={value.size} onChange={(e) => set("size", e.target.value)} data-testid="product-form-size" />
        </div>
        <div className={field}>
          <Label htmlFor="p-pricetype">Price Display</Label>
          <select id="p-pricetype" className={selectCls} value={value.price_type} onChange={(e) => set("price_type", e.target.value as ProductInput["price_type"])} data-testid="product-form-price-type">
            {Object.entries(PRICE_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div className={field}>
          <Label htmlFor="p-price">Price (₹)</Label>
          <Input
            id="p-price"
            type="number"
            step="0.01"
            value={value.price ?? ""}
            onChange={(e) => set("price", e.target.value === "" ? null : Number(e.target.value))}
            disabled={value.price_type !== "exact"}
            placeholder={value.price_type === "exact" ? "25500" : "Not shown for this price type"}
            data-testid="product-form-price"
          />
        </div>
        <div className={field}>
          <Label htmlFor="p-gender">Gender</Label>
          <select id="p-gender" className={selectCls} value={value.gender} onChange={(e) => set("gender", e.target.value as ProductInput["gender"])} data-testid="product-form-gender">
            <option value="unisex">Unisex</option>
            <option value="women">Women</option>
            <option value="men">Men</option>
          </select>
        </div>
        <div className={field}>
          <Label htmlFor="p-avail">Availability</Label>
          <select id="p-avail" className={selectCls} value={value.availability} onChange={(e) => set("availability", e.target.value as ProductInput["availability"])} data-testid="product-form-availability">
            <option value="in_stock">In Stock</option>
            <option value="made_to_order">Made to Order</option>
            <option value="out_of_stock">Currently Unavailable</option>
          </select>
        </div>
        <div className={field}>
          <Label htmlFor="p-finish">Finish</Label>
          <Input id="p-finish" value={value.finish} onChange={(e) => set("finish", e.target.value)} data-testid="product-form-finish" />
        </div>
        <div className={field}>
          <Label htmlFor="p-stone">Stone Details</Label>
          <Input id="p-stone" value={value.stone_details} onChange={(e) => set("stone_details", e.target.value)} data-testid="product-form-stone" />
        </div>
      </div>

      <div className={field}>
        <Label htmlFor="p-desc">Description</Label>
        <Textarea id="p-desc" rows={4} value={value.description} onChange={(e) => set("description", e.target.value)} data-testid="product-form-description" />
      </div>

      {/* Images */}
      <div className="space-y-3">
        <Label>Product Images</Label>
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
            data-testid="product-form-file-input"
          />
          <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading} data-testid="product-form-upload-button">
            <Upload className="h-4 w-4" /> {uploading ? "Uploading…" : "Upload images"}
          </Button>
          <Input
            placeholder="…or paste an image URL and press Enter"
            className="flex-1 min-w-[220px]"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const url = (e.target as HTMLInputElement).value.trim();
                if (url) {
                  set("images", [...value.images, { url, alt: value.name }]);
                  (e.target as HTMLInputElement).value = "";
                }
              }
            }}
            data-testid="product-form-image-url"
          />
        </div>

        {value.images.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3" data-testid="product-form-images">
            {value.images.map((img, i) => (
              <div key={img.url + i} className={cn("relative rounded-lg overflow-hidden border-2", i === 0 ? "border-[#996515]" : "border-[#E8E2D8]")}>
                <img src={img.url} alt={img.alt || "Product image"} className="aspect-square w-full object-cover" />
                {i === 0 && (
                  <span className="absolute top-1 left-1 text-[9px] uppercase font-bold px-1 py-0.5 rounded bg-[#996515] text-white">
                    Primary
                  </span>
                )}
                <div className="absolute bottom-1 inset-x-1 flex justify-between gap-1">
                  <button type="button" onClick={() => moveImage(i, i - 1)} className="rounded bg-white/90 p-1" aria-label="Move image left" data-testid={`image-move-left-${i}`}>
                    <GripVertical className="h-3 w-3" />
                  </button>
                  <button type="button" onClick={() => moveImage(i, 0)} className="rounded bg-white/90 p-1" aria-label="Set as primary image" data-testid={`image-set-primary-${i}`}>
                    <Star className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => set("images", value.images.filter((_, k) => k !== i))}
                    className="rounded bg-white/90 p-1 text-red-600"
                    aria-label="Delete image"
                    data-testid={`image-delete-${i}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Flags */}
      <div className="flex flex-wrap gap-5 pt-2">
        {([
          ["published", "Published (visible on website)"],
          ["featured", "Featured"],
          ["new_arrival", "New Arrival"],
          ["is_demo", "Demo / Sample product"],
        ] as const).map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer">
            <Checkbox
              checked={value[key]}
              onCheckedChange={(c) => set(key, Boolean(c))}
              data-testid={`product-form-${key.replace(/_/g, "-")}`}
            />
            {label}
          </label>
        ))}
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" className="bg-[#996515] hover:bg-[#7A4D05]" disabled={saving} data-testid="product-form-submit">
          {saving ? "Saving…" : submitLabel}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} data-testid="product-form-cancel">
          Cancel
        </Button>
      </div>
    </form>
  );
}
