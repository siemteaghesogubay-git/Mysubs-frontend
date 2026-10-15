import { useId, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "../../components/ui/Modal";
import {
  BILLING_INTERVAL,
  BILLING_INTERVAL_LABELS,
  type BillingInterval,
  type SubscriptionRequest,
  type SubscriptionResponse,
} from "../../types/subscription";
import type { CategoryResponse } from "../../types/category";

interface Props {
  categories: CategoryResponse[];
  initial?: SubscriptionResponse;
  onClose: () => void;
  onSubmit: (payload: SubscriptionRequest) => Promise<void>;
}

const labelClass = "mb-1 block text-[12px] font-medium text-text-secondary";
const fieldClass =
  "w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] outline-none focus:border-primary";

function toDateInputValue(iso?: string | null) {
  if (!iso) return "";
  return iso.slice(0, 10);
}

function today() {
  return toDateInputValue(new Date().toISOString());
}

/** Hittar enum-namnet (t.ex. "Monthly") för ett numeriskt intervallvärde. */
function getIntervalName(value: number): string {
  const entry = Object.entries(BILLING_INTERVAL).find(([, v]) => v === value);
  return entry?.[0] ?? "";
}

export function SubscriptionModal({
  categories,
  initial,
  onClose,
  onSubmit,
}: Props) {
  const { t } = useTranslation();
  const formId = useId();
  const isEdit = !!initial;

  const [name, setName] = useState(initial?.name ?? "");
  const [categoryId, setCategoryId] = useState(
    initial?.categoryId ?? categories[0]?.id ?? 0
  );
  const [cost, setCost] = useState(initial ? String(initial.cost) : "");
  const [interval, setBillingInterval] = useState<BillingInterval>(
    initial?.interval ?? BILLING_INTERVAL.Monthly
  );
  const [startDate, setStartDate] = useState(
    toDateInputValue(initial?.startDate) || today()
  );
  const [isCancelled, setIsCancelled] = useState(!!initial?.cancelledDate);
  const [cancelledDate, setCancelledDate] = useState(
    toDateInputValue(initial?.cancelledDate) || today()
  );

  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function intervalOptionLabel(value: string) {
    const intervalName = getIntervalName(Number(value)).toLowerCase();
    const fallback =
      BILLING_INTERVAL_LABELS[Number(value) as BillingInterval] ?? value;

    if (intervalName.includes("month")) return t("subscriptions.perMonth");
    if (intervalName.includes("year") || intervalName.includes("annual")) {
      return t("subscriptions.perYear");
    }

    return fallback;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorKey(null);

    const parsedCost = Number(cost);
    if (!name.trim() || !categoryId || !parsedCost || parsedCost <= 0) {
      setErrorKey("subscriptionModal.errors.validation");
      return;
    }

    if (isCancelled && (!cancelledDate || cancelledDate < startDate)) {
      setErrorKey("subscriptionModal.errors.cancelledDate");
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
        cancelledDate: isCancelled
          ? new Date(cancelledDate).toISOString()
          : null,
      });
      onClose();
    } catch {
      setErrorKey("subscriptionModal.errors.saveFailed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      title={
        isEdit
          ? t("subscriptionModal.editTitle")
          : t("subscriptionModal.addTitle")
      }
      onClose={onClose}
    >
      <form onSubmit={handleSubmit}>
        {errorKey && (
          <div
            role="alert"
            className="mb-4 rounded-md border border-danger-soft bg-danger-soft px-3 py-2 text-[12px] text-danger"
          >
            {t(errorKey)}
          </div>
        )}

        <label htmlFor={`${formId}-name`} className={labelClass}>
          {t("subscriptionModal.name")}
        </label>
        <input
          id={`${formId}-name`}
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("subscriptionModal.namePlaceholder")}
          className={`mb-4 ${fieldClass}`}
        />

        <div className="mb-4 grid grid-cols-2 gap-3">
          <div>
            <label htmlFor={`${formId}-category`} className={labelClass}>
              {t("subscriptionModal.category")}
            </label>
            <select
              id={`${formId}-category`}
              value={categoryId}
              onChange={(e) => setCategoryId(Number(e.target.value))}
              className={fieldClass}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={`${formId}-interval`} className={labelClass}>
              {t("subscriptionModal.period")}
            </label>
            <select
              id={`${formId}-interval`}
              value={interval}
              onChange={(e) =>
                setBillingInterval(Number(e.target.value) as BillingInterval)
              }
              className={fieldClass}
            >
              {Object.keys(BILLING_INTERVAL_LABELS).map((value) => (
                <option key={value} value={value}>
                  {intervalOptionLabel(value)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3">
          <div>
            <label htmlFor={`${formId}-cost`} className={labelClass}>
              {t("subscriptionModal.price")}
            </label>
            <input
              id={`${formId}-cost`}
              required
              type="number"
              min="0.01"
              step="0.01"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor={`${formId}-start`} className={labelClass}>
              {t("subscriptionModal.startDate")}
            </label>
            <input
              id={`${formId}-start`}
              required
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={fieldClass}
            />
          </div>
        </div>

        <fieldset className="mb-5 min-w-0">
          <legend className={labelClass}>{t("subscriptionModal.status")}</legend>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-[13px] text-text-primary">
              <input
                type="radio"
                name={`${formId}-status`}
                checked={!isCancelled}
                onChange={() => setIsCancelled(false)}
              />
              {t("subscriptionModal.statusActive")}
            </label>
            <label className="flex items-center gap-2 text-[13px] text-text-primary">
              <input
                type="radio"
                name={`${formId}-status`}
                checked={isCancelled}
                onChange={() => setIsCancelled(true)}
              />
              {t("subscriptionModal.statusCancelled")}
            </label>
          </div>
          {isCancelled && (
            <input
              type="date"
              value={cancelledDate}
              onChange={(e) => setCancelledDate(e.target.value)}
              aria-label={t("subscriptionModal.cancelledDate")}
              className={`mt-2 ${fieldClass}`}
            />
          )}
        </fieldset>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-4 py-2 text-[13px] font-medium text-text-secondary hover:bg-background"
          >
            {t("common.cancel")}
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-primary px-4 py-2 text-[13px] font-medium text-white hover:bg-primary-hover disabled:opacity-60"
          >
            {isSubmitting ? t("subscriptionModal.saving") : t("common.save")}
          </button>
        </div>
      </form>
    </Modal>
  );
}