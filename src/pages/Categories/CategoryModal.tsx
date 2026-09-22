import { useState, type FormEvent } from "react";
import { Modal } from "../../components/ui/Modal";
import type {
  CategoryRequest,
  CategoryResponse,
} from "../../types/category";

const PRESET_COLORS = [
  "#7c3aed",
  "#16a34a",
  "#2563eb",
  "#db2777",
  "#d97706",
  "#0891b2",
];

interface Props {
  initial?: CategoryResponse;
  onClose: () => void;
  onSubmit: (payload: CategoryRequest) => Promise<void>;
}

export function CategoryModal({
  initial,
  onClose,
  onSubmit,
}: Props) {
  const isEdit = !!initial;

  const [name, setName] = useState(initial?.name ?? "");
  const [color, setColor] = useState(
    initial?.color ?? PRESET_COLORS[0]
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleClose() {
    if (!isSubmitting) {
      onClose();
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (isSubmitting) {
      return;
    }

    setError(null);

    const trimmedName = name.trim();

    if (trimmedName.length < 2 || trimmedName.length > 50) {
      setError("Namnet måste vara mellan 2 och 50 tecken.");
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        name: trimmedName,
        color,
      });

      onClose();
    } catch {
      setError(
        "Kunde inte spara kategorin. Kontrollera uppgifterna, " +
          "din behörighet och anslutningen."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      title={isEdit ? "Redigera kategori" : "Ny kategori"}
      onClose={handleClose}
    >
      <form onSubmit={handleSubmit} aria-busy={isSubmitting}>
        {error && (
          <div
            role="alert"
            className="mb-4 rounded-md border border-danger-soft bg-danger-soft px-3 py-2 text-[12px] text-danger"
          >
            {error}
          </div>
        )}

        <label
          htmlFor="category-name"
          className="mb-1 block text-[12px] font-medium text-text-secondary"
        >
          Namn
        </label>

        <input
          id="category-name"
          type="text"
          required
          minLength={2}
          maxLength={50}
          disabled={isSubmitting}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="T.ex. Streaming"
          className="mb-4 w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] outline-none focus:border-primary disabled:opacity-60"
        />

        <fieldset disabled={isSubmitting} className="mb-5">
          <legend className="mb-2 text-[12px] font-medium text-text-secondary">
            Färg
          </legend>

          <div className="flex flex-wrap items-center gap-2">
            {PRESET_COLORS.map((presetColor) => (
              <button
                key={presetColor}
                type="button"
                onClick={() => setColor(presetColor)}
                aria-label={`Välj färgen ${presetColor}`}
                aria-pressed={color === presetColor}
                className="h-7 w-7 rounded-full ring-offset-2 disabled:opacity-60"
                style={{
                  backgroundColor: presetColor,
                  boxShadow:
                    color === presetColor
                      ? `0 0 0 2px ${presetColor}`
                      : "none",
                }}
              />
            ))}

            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              aria-label="Egen färg"
              className="h-7 w-7 cursor-pointer rounded-md border border-border bg-transparent"
            />
          </div>
        </fieldset>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="rounded-md px-4 py-2 text-[13px] font-medium text-text-secondary hover:bg-background disabled:opacity-60"
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