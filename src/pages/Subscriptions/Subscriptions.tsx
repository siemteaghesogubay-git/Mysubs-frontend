import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { getCategories } from "../../api/categories";
import {
  createSubscription, deleteSubscription, getSubscriptions, updateSubscription,
} from "../../api/subscriptions";
import { BILLING_INTERVAL_LABELS, type SubscriptionResponse } from "../../types/subscription";
import { SubscriptionModal } from "./SubscriptionModal";

type SortOption = "name" | "cost" | "startDate";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("sv-SE", { style: "currency", currency: "SEK", maximumFractionDigits: 0 }).format(value);
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("sv-SE", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));
}

export function Subscriptions() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<number | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "cancelled">("all");
  const [sortBy, setSortBy] = useState<SortOption>("name");

  const [editingSubscription, setEditingSubscription] = useState<SubscriptionResponse | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const categoriesQuery = useQuery({ queryKey: ["categories"], queryFn: getCategories });
  const subscriptionsQuery = useQuery({ queryKey: ["subscriptions"], queryFn: getSubscriptions });

  const createMutation = useMutation({
    mutationFn: createSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Parameters<typeof updateSubscription>[1] }) =>
      updateSubscription(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });

  const filtered = useMemo(() => {
    if (!subscriptionsQuery.data) return [];

    let result = subscriptionsQuery.data.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));

    if (categoryFilter !== "all") result = result.filter((s) => s.categoryId === categoryFilter);
    if (statusFilter === "active") result = result.filter((s) => !s.cancelledDate);
    if (statusFilter === "cancelled") result = result.filter((s) => !!s.cancelledDate);

    result = [...result].sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name, "sv");
      if (sortBy === "cost") return b.cost - a.cost;
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    });

    return result;
  }, [subscriptionsQuery.data, search, categoryFilter, statusFilter, sortBy]);

  async function handleDelete(subscription: SubscriptionResponse) {
    if (!confirm(`Ta bort ${subscription.name}?`)) return;
    await deleteMutation.mutateAsync(subscription.id);
  }

  const categories = categoriesQuery.data ?? [];

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-text-primary">Prenumerationer</h1>
        <button
          onClick={() => setIsCreating(true)}
          disabled={categories.length === 0}
          className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-[13px] font-medium text-white hover:bg-primary-hover disabled:opacity-60"
        >
          <Plus size={15} />
          Lägg till prenumeration
        </button>
      </div>

      {categories.length === 0 && !categoriesQuery.isLoading && (
        <p className="mb-4 text-[12px] text-text-secondary">
          Du behöver skapa minst en kategori innan du kan lägga till en prenumeration.
        </p>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        <div className="flex min-w-[200px] flex-1 items-center gap-2 rounded-md border border-border bg-surface px-3 py-2">
          <Search size={14} className="text-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Sök prenumeration..."
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-text-muted"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
          className="rounded-md border border-border bg-surface px-3 py-2 text-[13px] text-text-secondary outline-none"
        >
          <option value="all">Alla kategorier</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="rounded-md border border-border bg-surface px-3 py-2 text-[13px] text-text-secondary outline-none"
        >
          <option value="all">Alla</option>
          <option value="active">Aktiva</option>
          <option value="cancelled">Avslutade</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="rounded-md border border-border bg-surface px-3 py-2 text-[13px] text-text-secondary outline-none"
        >
          <option value="name">Sortera: Namn (A-Ö)</option>
          <option value="cost">Sortera: Kostnad (högst först)</option>
          <option value="startDate">Sortera: Startdatum (nyast först)</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
        {subscriptionsQuery.isLoading ? (
          <div className="space-y-2 p-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-background" />
            ))}
          </div>
        ) : subscriptionsQuery.isError ? (
          <p className="p-6 text-center text-[13px] text-danger">Kunde inte hämta prenumerationer.</p>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-[13px] font-medium text-text-primary">Inga prenumerationer hittades</p>
            <p className="mt-1 text-[12px] text-text-secondary">
              {subscriptionsQuery.data && subscriptionsQuery.data.length > 0
                ? "Justera sök eller filter för att se fler resultat."
                : "Lägg till din första prenumeration för att komma igång."}
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-border text-[11px] text-text-muted">
                <th className="px-4 py-2.5 font-medium">Tjänst</th>
                <th className="px-4 py-2.5 font-medium">Kategori</th>
                <th className="px-4 py-2.5 font-medium">Kostnad</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-text-primary">{s.name}</td>
                  <td className="px-4 py-3 text-text-secondary">{s.categoryName}</td>
                  <td className="px-4 py-3 text-text-primary">
                    {formatCurrency(s.cost)} <span className="text-text-muted">{BILLING_INTERVAL_LABELS[s.interval]}</span>
                  </td>
                  <td className="px-4 py-3">
                    {s.cancelledDate ? (
                      <span className="rounded-md bg-background px-2 py-0.5 text-[11px] text-text-secondary">
                        Avslutad {formatDate(s.cancelledDate)}
                      </span>
                    ) : (
                      <span className="rounded-md bg-success-soft px-2 py-0.5 text-[11px] text-success">Aktiv</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => setEditingSubscription(s)}
                        aria-label={`Redigera ${s.name}`}
                        className="rounded-md p-1.5 text-text-secondary hover:bg-background hover:text-text-primary"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(s)}
                        aria-label={`Ta bort ${s.name}`}
                        className="rounded-md p-1.5 text-text-secondary hover:bg-danger-soft hover:text-danger"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isCreating && (
        <SubscriptionModal
          categories={categories}
          onClose={() => setIsCreating(false)}
          onSubmit={async (payload) => {
            await createMutation.mutateAsync(payload);
          }}
        />
      )}

      {editingSubscription && (
        <SubscriptionModal
          categories={categories}
          initial={editingSubscription}
          onClose={() => setEditingSubscription(null)}
          onSubmit={async (payload) => {
            await updateMutation.mutateAsync({ id: editingSubscription.id, payload });
          }}
        />
      )}
    </div>
  );
}