import { useState, type FormEvent } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { CreditCard } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login({ email, password });
      const from = (location.state as { from?: Location })?.from?.pathname ?? "/";
      navigate(from, { replace: true });
    } catch {
      setError("Fel e-post eller lösenord.");
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
          <h1 className="text-lg font-semibold text-text-primary">Logga in på MySubs</h1>
          <p className="text-[13px] text-text-secondary">Håll koll på dina prenumerationer</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-surface p-6 shadow-card">
          {error && (
            <div className="mb-4 rounded-md border border-danger-soft bg-danger-soft px-3 py-2 text-[12px] text-danger">
              {error}
            </div>
          )}

          <label className="mb-1 block text-[12px] font-medium text-text-secondary">E-post</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mb-4 w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] outline-none focus:border-primary"
            placeholder="namn@example.com"
          />

          <label className="mb-1 block text-[12px] font-medium text-text-secondary">Lösenord</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mb-5 w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] outline-none focus:border-primary"
            placeholder="••••••••"
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-primary py-2 text-[13px] font-medium text-white hover:bg-primary-hover disabled:opacity-60"
          >
            {isSubmitting ? "Loggar in..." : "Logga in"}
          </button>
        </form>

        <p className="mt-4 text-center text-[13px] text-text-secondary">
          Har du inget konto?{" "}
          <Link to="/register" className="font-medium text-primary">
            Registrera dig
          </Link>
        </p>
      </div>
    </div>
  );
}