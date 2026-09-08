import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye, EyeOff, LogOut, Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import ProductForm from "@/components/ProductForm";
import { apiDelete, apiGet, apiPost, apiPut, ApiError } from "@/lib/api";
import type {
  AdminUser,
  Category,
  OkResponse,
  Product,
  ProductInput,
  ProductPage,
  Settings,
} from "@/lib/types";
import { emptyProduct } from "@/lib/types";
import { FALLBACK_SETTINGS, PURITY_LABELS, priceLabel, useSeo } from "@/lib/site";

type View = { mode: "list" } | { mode: "create" } | { mode: "edit"; product: Product };

export default function Admin() {
  useSeo("Admin Dashboard | Maheshwari Jewellers", "Manage the Maheshwari Jewellers jewellery catalogue.");
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [view, setView] = useState<View>({ mode: "list" });
  const [draft, setDraft] = useState<ProductInput>(emptyProduct());
  const [search, setSearch] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newCategoryMetal, setNewCategoryMetal] = useState<Category["metal"]>("silver");
  const [settingsDraft, setSettingsDraft] = useState<Settings | null>(null);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");

  const me = useQuery({
    queryKey: ["me"],
    queryFn: () => apiGet<AdminUser>("/auth/me"),
    retry: false,
  });

  useEffect(() => {
    if (me.isError && me.error instanceof ApiError && me.error.status === 401) {
      navigate("/admin/login");
    }
  }, [me.isError, me.error, navigate]);

  const products = useQuery({
    queryKey: ["admin-products", search],
    queryFn: () => apiGet<ProductPage>(`/admin/products?page_size=200${search ? `&search=${encodeURIComponent(search)}` : ""}`),
    enabled: me.isSuccess,
  });

  const categories = useQuery({
    queryKey: ["categories", ""],
    queryFn: () => apiGet<Category[]>("/categories"),
  });

  const settings = useQuery({
    queryKey: ["settings"],
    queryFn: () => apiGet<Settings>("/settings"),
  });

  useEffect(() => {
    if (settings.data && !settingsDraft) setSettingsDraft(settings.data);
  }, [settings.data, settingsDraft]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-products"] });
    qc.invalidateQueries({ queryKey: ["products"] });
  };

  const createProduct = useMutation({
    mutationFn: (input: ProductInput) => apiPost<Product>("/admin/products", input),
    onSuccess: () => {
      invalidate();
      setView({ mode: "list" });
      toast.success("Product added");
    },
    onError: () => toast.error("Could not add the product"),
  });

  const updateProduct = useMutation({
    mutationFn: (args: { id: string; input: ProductInput }) =>
      apiPut<Product>(`/admin/products/${args.id}`, args.input),
    onSuccess: () => {
      invalidate();
      setView({ mode: "list" });
      toast.success("Product updated");
    },
    onError: () => toast.error("Could not update the product"),
  });

  const removeProduct = useMutation({
    mutationFn: (id: string) => apiDelete<OkResponse>(`/admin/products/${id}`),
    onSuccess: () => {
      invalidate();
      toast.success("Product deleted");
    },
    onError: () => toast.error("Could not delete the product"),
  });

  const addCategory = useMutation({
    mutationFn: () => apiPost<Category>("/admin/categories", { name: newCategory, metal: newCategoryMetal }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      setNewCategory("");
      toast.success("Category added");
    },
    onError: () => toast.error("Could not add category — it may already exist"),
  });

  const removeCategory = useMutation({
    mutationFn: (id: string) => apiDelete<OkResponse>(`/admin/categories/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category removed");
    },
  });

  const saveSettings = useMutation({
    mutationFn: (s: Settings) => apiPut<Settings>("/admin/settings", s),
    onSuccess: (s) => {
      qc.setQueryData(["settings"], s);
      qc.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Saved");
    },
    onError: () => toast.error("Could not save settings"),
  });

  const changePassword = useMutation({
    mutationFn: () =>
      apiPost<OkResponse>("/auth/change-password", {
        current_password: currentPw,
        new_password: newPw,
      }),
    onSuccess: () => {
      setCurrentPw("");
      setNewPw("");
      toast.success("Password updated. Use the new password next time you sign in.");
    },
    onError: (e) => {
      const detail = e instanceof ApiError ? (e.body as { detail?: string })?.detail : null;
      toast.error(typeof detail === "string" ? detail : "Could not change the password");
    },
  });

  const logout = useMutation({    mutationFn: () => apiPost<OkResponse>("/auth/logout"),
    onSuccess: () => {
      qc.clear();
      navigate("/admin/login");
    },
  });

  const items = products.data?.items ?? [];
  const stats = [
    { label: "Total Products", value: items.length },
    { label: "Published", value: items.filter((p) => p.published).length },
    { label: "Hidden", value: items.filter((p) => !p.published).length },
    { label: "Demo Items", value: items.filter((p) => p.is_demo).length },
  ];

  const s = settingsDraft ?? FALLBACK_SETTINGS;
  const setS = (patch: Partial<Settings>) => setSettingsDraft({ ...s, ...patch });
  const setRate = (patch: Partial<Settings["rates"]>) =>
    setSettingsDraft({ ...s, rates: { ...s.rates, ...patch } });

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <header className="sticky top-0 z-30 bg-white border-b border-[#E8E2D8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-heading text-lg sm:text-xl text-stone-900 truncate">Admin Dashboard</h1>
            <p className="text-xs text-stone-500 truncate">Maheshwari Jewellers</p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/" className="text-sm text-[#8A5A00] hover:underline" data-testid="admin-view-site">
              View site
            </Link>
            <Button variant="outline" size="sm" onClick={() => logout.mutate()} data-testid="admin-logout-button">
              <LogOut className="h-4 w-4" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <Tabs defaultValue="dashboard">
          <TabsList className="flex-wrap h-auto" data-testid="admin-tabs">
            <TabsTrigger value="dashboard" data-testid="tab-dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="products" data-testid="tab-products">Products</TabsTrigger>
            <TabsTrigger value="categories" data-testid="tab-categories">Categories</TabsTrigger>
            <TabsTrigger value="rates" data-testid="tab-rates">Gold/Silver Rates</TabsTrigger>
            <TabsTrigger value="settings" data-testid="tab-settings">Website Settings</TabsTrigger>
          </TabsList>

          {/* Dashboard */}
          <TabsContent value="dashboard" className="mt-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((st) => (
                <div key={st.label} className="bg-white rounded-xl border border-[#E8E2D8] p-5" data-testid={`stat-${st.label.toLowerCase().replace(/\s+/g, "-")}`}>
                  <p className="text-xs uppercase tracking-[0.14em] text-stone-500">{st.label}</p>
                  <p className="mt-2 font-heading text-3xl text-stone-900">{st.value}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 bg-white rounded-xl border border-[#E8E2D8] p-6">
              <h2 className="font-heading text-lg text-stone-900">Quick guide</h2>
              <ul className="mt-3 space-y-2 text-sm text-stone-600 list-disc pl-5">
                <li>Products tab → “Add Product” to list a new item with photos.</li>
                <li>Untick “Published” to hide a sold item without deleting it.</li>
                <li>Gold/Silver Rates tab updates the rate strip across the site.</li>
                <li>Website Settings tab controls phone, WhatsApp, maps link and About text.</li>
              </ul>
            </div>
          </TabsContent>

          {/* Products */}
          <TabsContent value="products" className="mt-6">
            {view.mode === "list" ? (
              <>
                <div className="flex flex-wrap gap-3 items-center justify-between">
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search products by name or SKU"
                    className="max-w-xs bg-white"
                    data-testid="admin-product-search"
                  />
                  <Button
                    className="bg-[#996515] hover:bg-[#7A4D05]"
                    onClick={() => {
                      setDraft(emptyProduct());
                      setView({ mode: "create" });
                    }}
                    data-testid="admin-add-product-button"
                  >
                    <Plus className="h-4 w-4" /> Add Product
                  </Button>
                </div>

                <div className="mt-5 grid gap-3" data-testid="admin-product-list">
                  {items.map((p) => (
                    <div key={p.id} className="bg-white rounded-xl border border-[#E8E2D8] p-3 flex gap-3 items-center" data-testid={`admin-product-row-${p.id}`}>
                      <img
                        src={p.images[0]?.url ?? ""}
                        alt={p.name}
                        className="h-16 w-16 rounded-lg object-cover bg-[#F5EFE6] shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm text-stone-900 truncate">{p.name}</p>
                        <p className="text-xs text-stone-500 truncate">
                          {p.sku} · {PURITY_LABELS[p.purity] ?? p.purity} · {p.weight || "—"} · {priceLabel(p)}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          <Badge variant={p.published ? "secondary" : "outline"} className="text-[10px]" data-testid={`admin-status-${p.id}`}>
                            {p.published ? "Published" : "Hidden"}
                          </Badge>
                          {p.featured && <Badge className="text-[10px] bg-[#996515] text-white">Featured</Badge>}
                          {p.is_demo && <Badge variant="outline" className="text-[10px] bg-amber-100 text-amber-800">Demo</Badge>}
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-1.5 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            updateProduct.mutate({
                              id: p.id,
                              input: { ...toInput(p), published: !p.published },
                            })
                          }
                          aria-label={p.published ? "Hide product" : "Publish product"}
                          data-testid={`admin-toggle-publish-${p.id}`}
                        >
                          {p.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setDraft(toInput(p));
                            setView({ mode: "edit", product: p });
                          }}
                          aria-label="Edit product"
                          data-testid={`admin-edit-${p.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600"
                          onClick={() => {
                            if (confirm(`Delete "${p.name}"? This cannot be undone.`)) removeProduct.mutate(p.id);
                          }}
                          aria-label="Delete product"
                          data-testid={`admin-delete-${p.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {items.length === 0 && !products.isLoading && (
                    <p className="text-sm text-stone-500">No products yet. Use “Add Product” to create your first listing.</p>
                  )}
                </div>
              </>
            ) : (
              <div className="bg-white rounded-xl border border-[#E8E2D8] p-5 sm:p-7">
                <h2 className="font-heading text-xl text-stone-900 mb-5">
                  {view.mode === "create" ? "Add Product" : `Edit: ${view.product.name}`}
                </h2>
                <ProductForm
                  value={draft}
                  onChange={setDraft}
                  categories={categories.data ?? []}
                  saving={createProduct.isPending || updateProduct.isPending}
                  submitLabel={view.mode === "create" ? "Add Product" : "Save Changes"}
                  onCancel={() => setView({ mode: "list" })}
                  onSubmit={() =>
                    view.mode === "create"
                      ? createProduct.mutate(draft)
                      : updateProduct.mutate({ id: view.product.id, input: draft })
                  }
                />
              </div>
            )}
          </TabsContent>

          {/* Categories */}
          <TabsContent value="categories" className="mt-6">
            <div className="bg-white rounded-xl border border-[#E8E2D8] p-6 max-w-3xl">
              <h2 className="font-heading text-lg text-stone-900">Add a category</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                <Input
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="e.g. Silver Toe Rings"
                  className="flex-1 min-w-[200px]"
                  data-testid="admin-category-name-input"
                />
                <select
                  value={newCategoryMetal}
                  onChange={(e) => setNewCategoryMetal(e.target.value as Category["metal"])}
                  className="h-10 rounded-md border border-[#E8E2D8] bg-white px-3 text-sm"
                  data-testid="admin-category-metal-select"
                >
                  <option value="silver">Silver</option>
                  <option value="gold">Gold</option>
                  <option value="both">Both</option>
                </select>
                <Button
                  className="bg-[#996515] hover:bg-[#7A4D05]"
                  disabled={!newCategory.trim() || addCategory.isPending}
                  onClick={() => addCategory.mutate()}
                  data-testid="admin-add-category-button"
                >
                  Add
                </Button>
              </div>

              <div className="mt-6 flex flex-wrap gap-2" data-testid="admin-category-list">
                {categories.data?.map((c) => (
                  <span key={c.id} className="inline-flex items-center gap-1.5 rounded-full border border-[#E8E2D8] bg-[#FAF7F2] pl-3 pr-1.5 py-1 text-sm">
                    {c.name}
                    <button
                      type="button"
                      onClick={() => removeCategory.mutate(c.id)}
                      className="rounded-full p-1 text-stone-400 hover:text-red-600"
                      aria-label={`Delete category ${c.name}`}
                      data-testid={`admin-delete-category-${c.slug}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Rates */}
          <TabsContent value="rates" className="mt-6">
            <div className="bg-white rounded-xl border border-[#E8E2D8] p-6 max-w-2xl">
              <h2 className="font-heading text-lg text-stone-900">Today's Gold &amp; Silver Rates</h2>
              <p className="mt-1 text-sm text-stone-500">
                Enter numbers only (e.g. 74500). Leave a field as “—” to hide it from the website.
              </p>
              <div className="mt-5 grid sm:grid-cols-2 gap-4">
                {([
                  ["gold_24k", "24K Gold Rate"],
                  ["gold_22k", "22K Gold Rate"],
                  ["silver_999", "999 Silver Rate"],
                  ["silver_925", "925 Silver Rate"],
                  ["unit", "Unit"],
                  ["updated_on", "Date"],
                ] as const).map(([key, label]) => (
                  <div key={key} className="space-y-1.5">
                    <Label htmlFor={`rate-${key}`}>{label}</Label>
                    <Input
                      id={`rate-${key}`}
                      value={s.rates[key]}
                      onChange={(e) => setRate({ [key]: e.target.value })}
                      data-testid={`admin-rate-${key.replace(/_/g, "-")}`}
                    />
                  </div>
                ))}
              </div>
              <Button
                className="mt-5 bg-[#996515] hover:bg-[#7A4D05]"
                onClick={() => saveSettings.mutate(s)}
                disabled={saveSettings.isPending}
                data-testid="admin-save-rates-button"
              >
                Save Rates
              </Button>
            </div>
          </TabsContent>

          {/* Settings */}
          <TabsContent value="settings" className="mt-6">
            <div className="bg-white rounded-xl border border-[#E8E2D8] p-6 max-w-3xl">
              <h2 className="font-heading text-lg text-stone-900">Business Information</h2>
              <div className="mt-5 grid sm:grid-cols-2 gap-4">
                {([
                  ["business_name", "Business Name"],
                  ["phone", "Phone"],
                  ["whatsapp", "WhatsApp Number (with 91)"],
                  ["maps_url", "Google Maps URL"],
                  ["address", "Address / Area"],
                  ["opening_hours", "Opening Hours (e.g. 10:00 AM – 8:00 PM)"],
                  ["closed_days", "Weekly Closed Day(s), comma separated"],
                  ["instagram", "Instagram URL (optional)"],
                  ["facebook", "Facebook URL (optional)"],
                  ["logo_url", "Logo Image URL (optional)"],
                  ["banner_url", "Homepage Banner URL (optional)"],
                ] as const).map(([key, label]) => (
                  <div key={key} className="space-y-1.5">
                    <Label htmlFor={`set-${key}`}>{label}</Label>
                    <Input
                      id={`set-${key}`}
                      value={s[key]}
                      onChange={(e) => setS({ [key]: e.target.value })}
                      data-testid={`admin-setting-${key.replace(/_/g, "-")}`}
                    />
                  </div>
                ))}
              </div>

              <div className="mt-4 space-y-1.5">
                <Label htmlFor="set-desc">Business Description (used for SEO)</Label>
                <Textarea id="set-desc" rows={2} value={s.description} onChange={(e) => setS({ description: e.target.value })} data-testid="admin-setting-description" />
              </div>

              <div className="mt-4 space-y-1.5">
                <Label htmlFor="set-about">About Us</Label>
                <Textarea id="set-about" rows={8} value={s.about} onChange={(e) => setS({ about: e.target.value })} data-testid="admin-setting-about" />
              </div>

              <Button
                className="mt-5 bg-[#996515] hover:bg-[#7A4D05]"
                onClick={() => saveSettings.mutate(s)}
                disabled={saveSettings.isPending}
                data-testid="admin-save-settings-button"
              >
                Save Settings
              </Button>
            </div>

            {/* Password change */}
            <div className="mt-6 bg-white rounded-xl border border-[#E8E2D8] p-6 max-w-md">
              <h2 className="font-heading text-lg text-stone-900">Change Admin Password</h2>
              <p className="mt-1 text-sm text-stone-500">
                Minimum 8 characters. You stay signed in; any other device is signed out.
              </p>
              <div className="mt-4 space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="cur-pw">Current Password</Label>
                  <Input
                    id="cur-pw"
                    type="password"
                    value={currentPw}
                    onChange={(e) => setCurrentPw(e.target.value)}
                    autoComplete="current-password"
                    data-testid="admin-current-password"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="new-pw">New Password</Label>
                  <Input
                    id="new-pw"
                    type="password"
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    autoComplete="new-password"
                    data-testid="admin-new-password"
                  />
                </div>
                <Button
                  className="bg-[#996515] hover:bg-[#7A4D05]"
                  disabled={changePassword.isPending || !currentPw || newPw.length < 8}
                  onClick={() => changePassword.mutate()}
                  data-testid="admin-change-password-button"
                >
                  {changePassword.isPending ? "Updating…" : "Update Password"}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function toInput(p: Product): ProductInput {
  const { id: _id, created_at: _c, updated_at: _u, ...rest } = p;
  return rest;
}
