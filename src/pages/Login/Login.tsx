import { useRef, useState, type FormEvent } from "react";
import axios from "axios";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { CreditCard, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

type LocationState = {
  from?: {
    pathname?: string;
  };
};

function getLoginError(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return "Inloggningen kunde inte slutföras. Försök igen.";
  }

  if (
    error.code === "ECONNABORTED" ||
    error.code === "ETIMEDOUT"
  ) {
    return "Servern tog för lång tid på sig att svara. Försök igen.";
  }

  if (!error.response) {
    return "Kunde inte nå servern. Kontrollera din anslutning och försök igen.";
  }

  const status = error.response.status;
  const requestPath = error.config?.url
    ?.split("?")[0]
    .replace(/\/+$/, "")
    .toLowerCase();

  const isLoginRequest = requestPath?.endsWith("/api/auth/login");
  const isProfileRequest = requestPath?.endsWith("/api/users/me");

  if (status === 429) {
    return "För många försök. Vänta en stund och försök igen.";
  }

  if (status >= 500) {
    return "Ett serverfel uppstod. Försök igen om en stund.";
  }

  if (isProfileRequest) {
    if (status === 401) {
      return "Inloggningen lyckades, men sessionen kunde inte verifieras. Försök igen. Kontakta support om felet kvarstår.";
    }

    return "Inloggningen lyckades, men din profil kunde inte hämtas. Försök igen.";
  }

  if (isLoginRequest && status === 401) {
    return "Fel e-post eller lösenord.";
  }

  if (isLoginRequest && status === 400) {
    return "Kontrollera dina inloggningsuppgifter och försök igen.";
  }

  if (status === 403) {
    return "Du saknar behörighet att slutföra inloggningen.";
  }

  return "Inloggningen kunde inte slutföras. Försök igen.";
}

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const submittingRef = useRef(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submittingRef.current) return;

    submittingRef.current = true;
    setError(null);
    setIsSubmitting(true);

    try {
      await login({
        email: email.trim(),
        password,
      });

      const state = location.state as LocationState | null;
      const requestedPath = state?.from?.pathname;

      const destination =
        typeof requestedPath === "string" &&
        requestedPath.startsWith("/") &&
        !requestedPath.startsWith("//") &&
        !requestedPath.includes("\\") &&
        requestedPath !== "/login"
          ? requestedPath
          : "/";

      navigate(destination, { replace: true });
    } catch (error: unknown) {
      setError(getLoginError(error));
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-dvh flex-col bg-background px-4 py-8 sm:py-12">
      <div className="my-auto w-full max-w-sm self-center">
        <header className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white">
            <CreditCard size={26} aria-hidden="true" />
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
            Logga in på MySubs
          </h1>

          <p className="mt-2 text-sm text-text-secondary">
            Håll koll på dina prenumerationer.
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          aria-busy={isSubmitting}
          className="rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-6"
        >
          {error && (
            <div
              role="alert"
              className="mb-5 rounded-lg border border-danger-soft bg-danger-soft px-4 py-3 text-sm leading-relaxed text-danger"
            >
              {error}
            </div>
          )}

          <fieldset disabled={isSubmitting} className="min-w-0">
            <legend className="sr-only">Inloggningsuppgifter</legend>

            <div className="mb-5">
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-text-primary"
              >
                E-post
              </label>

              <input
                id="email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="namn@example.com"
                className="min-h-12 w-full rounded-lg border border-border bg-white px-3 py-3 text-base text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-text-primary"
              >
                Lösenord
              </label>

              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="min-h-12 w-full rounded-lg border border-border bg-white py-3 pl-3 pr-14 text-base text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Dölj lösenord" : "Visa lösenord"}
                  aria-controls="password"
                  className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-md text-text-secondary hover:bg-background hover:text-text-primary focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-60"
                >
                  {showPassword ? (
                    <EyeOff size={20} aria-hidden="true" />
                  ) : (
                    <Eye size={20} aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <div className="mb-4 mt-1 flex justify-end">
              <Link
                to="/forgot-password"
                className="inline-flex min-h-11 items-center rounded-md px-1 text-sm font-medium text-primary hover:text-primary-hover hover:underline focus-visible:outline-2 focus-visible:outline-primary"
              >
                Glömt lösenord?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-base font-medium text-white transition hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting && (
                <LoaderCircle
                  size={20}
                  aria-hidden="true"
                  className="animate-spin motion-reduce:animate-none"
                />
              )}
              {isSubmitting ? "Loggar in..." : "Logga in"}
            </button>
          </fieldset>
        </form>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-1 text-sm">
          <span className="text-text-secondary">Har du inget konto?</span>

          <Link
            to="/register"
            className="inline-flex min-h-11 items-center rounded-md px-1 font-medium text-primary hover:text-primary-hover hover:underline focus-visible:outline-2 focus-visible:outline-primary"
          >
            Registrera dig
          </Link>
        </div>
      </div>
    </main>
  );
}