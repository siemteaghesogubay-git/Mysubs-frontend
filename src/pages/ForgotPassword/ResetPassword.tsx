import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CreditCard } from "lucide-react";
import { resetPassword } from "../../api/auth";

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [token, setToken] = useState(searchParams.get("token") ?? "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("Lösenorden matchar inte.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Lösenordet måste vara minst 8 tecken.");
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword({ email, token, newPassword });
      navigate("/login", { replace: true, state: { resetSuccess: true } });
    } catch {
      setError("Kunde inte återställa lösenordet. Länken kan ha gått ut — begär en ny.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <CreditCard size={18} className="text-white" />
          </div>
          <h1 className="text-lg font-semibold text-text-primary">Återställ lösenord</h1>
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-surface p-6 shadow-card">
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
            className="mb-4 w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] outline-none focus:border-primary"
          />

          <label className="mb-1 block text-[12px] font-medium text-text-secondary">Återställningskod</label>
          <textarea
            required
            value={token}
            onChange={(e) => setToken(e.target.value)}
            rows={3}
            className="mb-4 w-full resize-none rounded-md border border-border bg-white px-3 py-2 text-[12px] outline-none focus:border-primary"
            placeholder="Klistras in automatiskt från länken, eller klistra in manuellt"
          />

          <label className="mb-1 block text-[12px] font-medium text-text-secondary">Nytt lösenord</label>
          <input
            required
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="mb-4 w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] outline-none focus:border-primary"
          />

          <label className="mb-1 block text-[12px] font-medium text-text-secondary">Bekräfta nytt lösenord</label>
          <input
            required
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="mb-5 w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] outline-none focus:border-primary"
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-primary py-2 text-[13px] font-medium text-white hover:bg-primary-hover disabled:opacity-60"
          >
            {isSubmitting ? "Återställer..." : "Återställ lösenord"}
          </button>
        </form>

        <p className="mt-4 text-center text-[13px] text-text-secondary">
          <Link to="/login" className="font-medium text-primary">
            Tillbaka till inloggning
          </Link>
        </p>
      </div>
    </div>
  );
}