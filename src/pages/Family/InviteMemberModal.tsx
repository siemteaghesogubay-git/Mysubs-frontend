import { useState, type FormEvent } from "react";
import { Modal } from "../../components/ui/Modal";
import { FAMILY_ROLE, FAMILY_ROLE_LABELS, type AddMemberRequest, type FamilyRole } from "../../types/family";

export function InviteMemberModal({
  groupName, onClose, onSubmit,
}: { groupName: string; onClose: () => void; onSubmit: (payload: AddMemberRequest) => Promise<void> }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<FamilyRole>(FAMILY_ROLE.Child);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit({ email: email.trim(), role });
      onClose();
    } catch {
      setError("Kunde inte lägga till medlemmen. Kontrollera att e-posten är korrekt och har ett konto.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title={`Bjud in medlem till ${groupName}`} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-4 rounded-md border border-danger-soft bg-danger-soft px-3 py-2 text-[12px] text-danger">
            {error}
          </div>
        )}

        <label className="mb-1 block text-[12px] font-medium text-text-secondary">E-post</label>
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="namn@example.com"
          className="mb-4 w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] outline-none focus:border-primary"
        />

        <label className="mb-1 block text-[12px] font-medium text-text-secondary">Roll</label>
        <select
          value={role}
          onChange={(e) => setRole(Number(e.target.value) as FamilyRole)}
          className="mb-5 w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] outline-none focus:border-primary"
        >
          {Object.entries(FAMILY_ROLE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

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
            {isSubmitting ? "Bjuder in..." : "Bjud in"}
          </button>
        </div>
      </form>
    </Modal>
  );
}