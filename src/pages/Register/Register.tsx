import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CreditCard } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function update(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await register(form);
      navigate("/", { replace: true });
    } catch {
      setError("Kunde inte skapa kontot. Kontrollera uppgifterna.");
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
          <h1 className="text-lg font-semibold text-text-primary">Skapa konto</h1>
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-surface p-6 shadow-card">
          {error && (
            <div className="mb-4 rounded-md border border-danger-soft bg-danger-soft px-3 py-2 text-[12px] text-danger">
              {error}
            </div>
          )}

          <div className="mb-4 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[12px] font-medium text-text-secondary">Förnamn</label>
              <input
                required
                value={form.firstName}
                onChange={(e) => update("firstName", e.target.value)}
                className="w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-[12px] font-medium text-text-secondary">Efternamn</label>
              <input
                required
                value={form.lastName}
                onChange={(e) => update("lastName", e.target.value)}
                className="w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] outline-none focus:border-primary"
              />
            </div>
          </div>

          <label className="mb-1 block text-[12px] font-medium text-text-secondary">E-post</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            className="mb-4 w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] outline-none focus:border-primary"
          />

          <label className="mb-1 block text-[12px] font-medium text-text-secondary">Lösenord</label>
          <input
            type="password"
            required
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
            className="mb-5 w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] outline-none focus:border-primary"
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-primary py-2 text-[13px] font-medium text-white hover:bg-primary-hover disabled:opacity-60"
          >
            {isSubmitting ? "Skapar konto..." : "Skapa konto"}
          </button>
        </form>

        <p className="mt-4 text-center text-[13px] text-text-secondary">
          Har du redan ett konto?{" "}
          <Link to="/login" className="font-medium text-primary">
            Logga in
          </Link>
        </p>
      </div>
    </div>
  );
}