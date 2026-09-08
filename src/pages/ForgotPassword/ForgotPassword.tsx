import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { CreditCard } from "lucide-react";
import { forgotPassword } from "../../api/auth";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [devToken, setDevToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await forgotPassword({ email });
      setMessage(res.message);
      setDevToken(res.devToken ?? null);
    } catch {
      setMessage("Något gick fel. Försök igen om en stund.");
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
          <h1 className="text-lg font-semibold text-text-primary">Glömt lösenord</h1>
          <p className="text-center text-[13px] text-text-secondary">
            Ange din e-post så skickar vi instruktioner för att återställa lösenordet.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6 shadow-card">
          {message ? (
            <div>
              <div className="mb-4 rounded-md border border-success-soft bg-success-soft px-3 py-2 text-[12px] text-success">
                {message}
              </div>

              {devToken && (
                <div className="rounded-md border border-border bg-background p-3">
                  <p className="mb-2 text-[11px] font-medium text-text-secondary">
                    Dev-läge — riktig e-post skickas inte än:
                  </p>
                  <Link
                    to={`/reset-password?email=${encodeURIComponent(email)}&token=${encodeURIComponent(devToken)}`}
                    className="text-[12px] font-medium text-primary underline"
                  >
                    Gå till återställning →
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <label className="mb-1 block text-[12px] font-medium text-text-secondary">E-post</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mb-5 w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] outline-none focus:border-primary"
                placeholder="namn@example.com"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-md bg-primary py-2 text-[13px] font-medium text-white hover:bg-primary-hover disabled:opacity-60"
              >
                {isSubmitting ? "Skickar..." : "Skicka återställningslänk"}
              </button>
            </form>
          )}
        </div>

        <p className="mt-4 text-center text-[13px] text-text-secondary">
          <Link to="/login" className="font-medium text-primary">
            Tillbaka till inloggning
          </Link>
        </p>
      </div>
    </div>
  );
}