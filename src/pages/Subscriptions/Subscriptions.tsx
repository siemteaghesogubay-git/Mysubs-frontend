import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getCategories } from "../../api/categories";
import {
  createSubscription,
  deleteSubscription,
  getSubscriptions,
  updateSubscription,
} from "../../api/subscriptions";
import {
  BILLING_INTERVAL,
  BILLING_INTERVAL_LABELS,
  type SubscriptionResponse,
} from "../../types/subscription";
import { SubscriptionModal } from "./SubscriptionModal";

type SortOption = "name" | "cost" | "startDate";
type StatusFilter = "all" | "active" | "cancelled";

function toLocale(language: string) {
  return language.startsWith("sv") ? "sv-SE" : "en-GB";
}

function formatCurrency(value: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "SEK",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(iso: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export function Subscriptions() {
  const { t, i18n } = useTranslation();
  const locale = toLocale(i18n.language);
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<number | "all">("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("name");

  const [editingSubscription, setEditingSubscription] =
    useState<SubscriptionResponse | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteFailed, setDeleteFailed] = useState(false);

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });
  const subscriptionsQuery = useQuery({
    queryKey: ["subscriptions"],
    queryFn: getSubscriptions,
  });

  function invalidateSubscriptionData() {
    queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
  }

  const createMutation = useMutation({
    mutationFn: createSubscription,
    onSuccess: invalidateSubscriptionData,
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: Parameters<typeof updateSubscription>[1];
    }) => updateSubscription(id, payload),
    onSuccess: invalidateSubscriptionData,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSubscription,
    onSuccess: invalidateSubscriptionData,
  });

  const filtered = useMemo(() => {
    if (!subscriptionsQuery.data) return [];

    let result = subscriptionsQuery.data.filter((s) =>
      s.name.toLowerCase().includes(search.toLowerCase())
    );

    if (categoryFilter !== "all") {
      result = result.filter((s) => s.categoryId === categoryFilter);
    }
    if (statusFilter === "active") {
      result = result.filter((s) => !s.cancelledDate);
    }
    if (statusFilter === "cancelled") {
      result = result.filter((s) => !!s.cancelledDate);
    }

    return [...result].sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name, locale);
      if (sortBy === "cost") return b.cost - a.cost;
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    });
  }, [
    subscriptionsQuery.data,
    search,
    categoryFilter,
    statusFilter,
    sortBy,
    locale,
  ]);

  async function handleDelete(subscription: SubscriptionResponse) {
    const message = t("subscriptions.deleteConfirm", {
      name: subscription.name,
      interpolation: { escapeValue: false },
    });

    if (!confirm(message)) return;

    setDeleteFailed(false);

    try {
      await deleteMutation.mutateAsync(subscription.id);
    } catch {
      setDeleteFailed(true);
    }
  }

  function intervalLabel(interval: SubscriptionResponse["interval"]) {
    const intervalName = (
      Object.entries(BILLING_INTERVAL).find(([, v]) => v === interval)?.[0] ??
      ""
    ).toLowerCase();

    if (intervalName.includes("month")) return t("subscriptions.perMonth");
    if (intervalName.includes("year") || intervalName.includes("annual")) {
      return t("subscriptions.perYear");
    }

    // Okänt intervall: använd den befintliga etiketten.
    return BILLING_INTERVAL_LABELS[interval];
  }

  const categories = categoriesQuery.data ?? [];
  const selectClass =
    "rounded-md border border-border bg-surface px-3 py-2 text-[13px] text-text-secondary outline-none";

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-text-primary">
          {t("subscriptions.title")}
        </h1>
        <button
          type="button"
          onClick={() => setIsCreating(true)}
          disabled={categories.length === 0}
          className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-[13px] font-medium text-white hover:bg-primary-hover disabled:opacity-60"
        >
          <Plus size={15} aria-hidden="true" />
          {t("subscriptions.add")}
        </button>
      </div>

      {categories.length === 0 && !categoriesQuery.isLoading && (
        <p className="mb-4 text-[12px] text-text-secondary">
          {t("subscriptions.categoryRequired")}
        </p>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        <div className="flex min-w-[200px] flex-1 items-center gap-2 rounded-md border border-border bg-surface px-3 py-2">
          <Search size={14} aria-hidden="true" className="text-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("subscriptions.search")}
            aria-label={t("subscriptions.searchLabel")}
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-text-muted"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) =>
            setCategoryFilter(
              e.target.value === "all" ? "all" : Number(e.target.value)
            )
          }
          aria-label={t("subscriptions.categoryFilter")}
          className={selectClass}
        >
          <option value="all">{t("subscriptions.allCategories")}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          aria-label={t("subscriptions.statusFilter")}
          className={selectClass}
        >
          <option value="all">{t("subscriptions.all")}</option>
          <option value="active">{t("subscriptions.activePlural")}</option>
          <option value="cancelled">{t("subscriptions.cancelledPlural")}</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          aria-label={t("subscriptions.sortLabel")}
          className={selectClass}
        >
          <option value="name">{t("subscriptions.sortName")}</option>
          <option value="cost">{t("subscriptions.sortCost")}</option>
          <option value="startDate">{t("subscriptions.sortStartDate")}</option>
        </select>
      </div>

      {deleteFailed && (
        <p role="alert" className="mb-4 text-[13px] text-danger">
          {t("subscriptions.deleteError")}
        </p>
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
        {subscriptionsQuery.isLoading ? (
          <div
            role="status"
            aria-label={t("subscriptions.loading")}
            className="space-y-2 p-4"
          >
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-10 animate-pulse rounded-lg bg-background"
              />
            ))}
          </div>
        ) : subscriptionsQuery.isError ? (
          <p role="alert" className="p-6 text-center text-[13px] text-danger">
            {t("subscriptions.loadError")}
          </p>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-[13px] font-medium text-text-primary">
              {t("subscriptions.emptyTitle")}
            </p>
            <p className="mt-1 text-[12px] text-text-secondary">
              {subscriptionsQuery.data && subscriptionsQuery.data.length > 0
                ? t("subscriptions.emptyFiltered")
                : t("subscriptions.emptyFirst")}
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-border text-[11px] text-text-muted">
                <th className="px-4 py-2.5 font-medium">
                  {t("subscriptions.service")}
                </th>
                <th className="px-4 py-2.5 font-medium">
                  {t("subscriptions.category")}
                </th>
                <th className="px-4 py-2.5 font-medium">
                  {t("subscriptions.cost")}
                </th>
                <th className="px-4 py-2.5 font-medium">
                  {t("subscriptions.status")}
                </th>
                <th className="px-4 py-2.5 font-medium">
                  <span className="sr-only">{t("subscriptions.actions")}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-text-primary">{s.name}</td>
                  <td className="px-4 py-3 text-text-secondary">
                    {s.categoryName}
                  </td>
                  <td className="px-4 py-3 text-text-primary">
                    {formatCurrency(s.cost, locale)}{" "}
                    <span className="text-text-muted">
                      {intervalLabel(s.interval)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {s.cancelledDate ? (
                      <span className="rounded-md bg-background px-2 py-0.5 text-[11px] text-text-secondary">
                        {t("subscriptions.cancelled", {
                          date: formatDate(s.cancelledDate, locale),
                        })}
                      </span>
                    ) : (
                      <span className="rounded-md bg-success-soft px-2 py-0.5 text-[11px] text-success">
                        {t("subscriptions.active")}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setEditingSubscription(s)}
                        aria-label={t("subscriptions.edit", { name: s.name })}
                        className="rounded-md p-1.5 text-text-secondary hover:bg-background hover:text-text-primary"
                      >
                        <Pencil size={14} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(s)}
                        aria-label={t("subscriptions.delete", { name: s.name })}
                        className="rounded-md p-1.5 text-text-secondary hover:bg-danger-soft hover:text-danger"
                      >
                        <Trash2 size={14} aria-hidden="true" />
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
            await updateMutation.mutateAsync({
              id: editingSubscription.id,
              payload,
            });
          }}
        />
      )}
    </div>
  );
}