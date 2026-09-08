import { useState, type FormEvent } from "react";
import { Modal } from "../../components/ui/Modal";
import type { CategoryRequest, CategoryResponse } from "../../types/category";

const PRESET_COLORS = ["#7c3aed", "#16a34a", "#2563eb", "#db2777", "#d97706", "#0891b2"];

interface Props {
  initial?: CategoryResponse;
  onClose: () => void;
  onSubmit: (payload: CategoryRequest) => Promise<void>;
}

export function CategoryModal({ initial, onClose, onSubmit }: Props) {
  const isEdit = !!initial;

  const [name, setName] = useState(initial?.name ?? "");
  const [color, setColor] = useState(initial?.color ?? PRESET_COLORS[0]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError("Namnet måste vara minst 2 tecken.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({ name: name.trim(), color });
      onClose();
    } catch {
      setError("Kunde inte spara kategorin. Kontrollera att namnet inte redan finns.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title={isEdit ? "Redigera kategori" : "Ny kategori"} onClose={onClose}>
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
          placeholder="T.ex. Streaming"
          className="mb-4 w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] outline-none focus:border-primary"
        />

        <label className="mb-2 block text-[12px] font-medium text-text-secondary">Färg</label>
        <div className="mb-5 flex items-center gap-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-label={`Välj färgen ${c}`}
              className="h-7 w-7 rounded-full ring-offset-2"
              style={{
                backgroundColor: c,
                boxShadow: color === c ? `0 0 0 2px ${c}` : "none",
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