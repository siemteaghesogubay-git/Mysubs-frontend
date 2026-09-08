import { useState, type FormEvent } from "react";
import { Modal } from "../../components/ui/Modal";
import type { FamilyGroupCreateRequest } from "../../types/family";

export function CreateGroupModal({
  onClose, onSubmit,
}: { onClose: () => void; onSubmit: (payload: FamilyGroupCreateRequest) => Promise<void> }) {
  const [name, setName] = useState("");
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
      await onSubmit({ name: name.trim() });
      onClose();
    } catch {
      setError("Kunde inte skapa gruppen.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title="Skapa familjegrupp" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-4 rounded-md border border-danger-soft bg-danger-soft px-3 py-2 text-[12px] text-danger">
            {error}
          </div>
        )}

        <label className="mb-1 block text-[12px] font-medium text-text-secondary">Gruppnamn</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="T.ex. Familjen Ogubay"
          className="mb-5 w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] outline-none focus:border-primary"
        />

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
            {isSubmitting ? "Skapar..." : "Skapa grupp"}
          </button>
        </div>
      </form>
    </Modal>
  );
}