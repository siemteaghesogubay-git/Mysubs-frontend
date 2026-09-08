import { useState, type FormEvent } from "react";
import { Modal } from "../../components/ui/Modal";
import {
  BILLING_INTERVAL, BILLING_INTERVAL_LABELS, type BillingInterval, type SubscriptionRequest, type SubscriptionResponse,
} from "../../types/subscription";
import type { CategoryResponse } from "../../types/category";

interface Props {
  categories: CategoryResponse[];
  initial?: SubscriptionResponse;
  onClose: () => void;
  onSubmit: (payload: SubscriptionRequest) => Promise<void>;
}

function toDateInputValue(iso?: string | null) {
  if (!iso) return "";
  return iso.slice(0, 10);
}

export function SubscriptionModal({ categories, initial, onClose, onSubmit }: Props) {
  const isEdit = !!initial;

  const [name, setName] = useState(initial?.name ?? "");
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? categories[0]?.id ?? 0);
  const [cost, setCost] = useState(initial ? String(initial.cost) : "");
  const [interval, setInterval] = useState<BillingInterval>(initial?.interval ?? BILLING_INTERVAL.Monthly);
  const [startDate, setStartDate] = useState(toDateInputValue(initial?.startDate) || toDateInputValue(new Date().toISOString()));
  const [isCancelled, setIsCancelled] = useState(!!initial?.cancelledDate);
  const [cancelledDate, setCancelledDate] = useState(toDateInputValue(initial?.cancelledDate) || toDateInputValue(new Date().toISOString()));

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const parsedCost = Number(cost);
    if (!name.trim() || !categoryId || !parsedCost || parsedCost <= 0) {
      setError("Fyll i namn, kategori och en giltig kostnad.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        cost: parsedCost,
        interval,
        startDate: new Date(startDate).toISOString(),
        categoryId,
        cancelledDate: isCancelled ? new Date(cancelledDate).toISOString() : null,
      });
      onClose();
    } catch {
      setError("Kunde inte spara prenumerationen. Kontrollera uppgifterna och försök igen.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title={isEdit ? "Redigera prenumeration" : "Lägg till prenumeration"} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-4 rounded-md border border-danger-soft bg-danger-soft px-3 py-2 text-[12px] text-danger">
            {error}
          </div>
        )}

        <label className="mb-1 block text-[12px] font-medium text-text-secondary">Namn</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="T.ex. Netflix"
          className="mb-4 w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] outline-none focus:border-primary"
        />

        <div className="mb-4 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-[12px] font-medium text-text-secondary">Kategori</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(Number(e.target.value))}
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] outline-none focus:border-primary"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[12px] font-medium text-text-secondary">Period</label>
            <select
              value={interval}
              onChange={(e) => setInterval(Number(e.target.value) as BillingInterval)}
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] outline-none focus:border-primary"
            >
              {Object.entries(BILLING_INTERVAL_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-[12px] font-medium text-text-secondary">Pris (kr)</label>
            <input
              required
              type="number"
              min="0.01"
              step="0.01"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-[12px] font-medium text-text-secondary">Startdatum</label>
            <input
              required
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="mb-5">
          <label className="mb-1 block text-[12px] font-medium text-text-secondary">Status</label>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-[13px] text-text-primary">
              <input type="radio" checked={!isCancelled} onChange={() => setIsCancelled(false)} />
              Aktiv
            </label>
            <label className="flex items-center gap-2 text-[13px] text-text-primary">
              <input type="radio" checked={isCancelled} onChange={() => setIsCancelled(true)} />
              Avslutad
            </label>
          </div>
          {isCancelled && (
            <input
              type="date"
              value={cancelledDate}
              onChange={(e) => setCancelledDate(e.target.value)}
              className="mt-2 w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] outline-none focus:border-primary"
            />
          )}
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-4 py-2 text-[13px] font-medium text-text-secondary hover:bg-background"
          >
            Avbryt
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-primary px-4 py-2 text-[13px] font-medium text-white hover:bg-primary-hover disabled:opacity-60"
          >
            {isSubmitting ? "Sparar..." : "Spara"}
          </button>
        </div>
      </form>
    </Modal>
  );
}