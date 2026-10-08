import { useRef, useState, type FormEvent } from "react";
import axios from "axios";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Check,
  Clapperboard,
  Eye,
  EyeOff,
  Gamepad2,
  LoaderCircle,
  Lock,
  Mail,
  Music,
  Play,
  Plus,
  Tv,
  Wallet,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

type LocationState = {
  from?: {
    pathname?: string;
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getRequestPath(error: unknown): string | undefined {
  if (!axios.isAxiosError(error)) return undefined;

  return error.config?.url
    ?.split("?")[0]
    .replace(/\/+$/, "")
    .toLowerCase();
}

function requiresEmailVerification(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;

  const data: unknown = error.response?.data;
  const requestPath = getRequestPath(error);

  return (
    requestPath?.endsWith("/api/auth/login") === true &&
    error.response?.status === 403 &&
    isRecord(data) &&
    data.code === "EmailNotConfirmed"
  );
}

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
  const requestPath = getRequestPath(error);

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
      return (
        "Inloggningen lyckades, men sessionen kunde inte verifieras. " +
        "Försök igen. Kontakta support om felet kvarstår."
      );
    }

    return (
      "Inloggningen lyckades, men din profil kunde inte hämtas. " +
      "Försök igen."
    );
  }

  if (isLoginRequest && status === 401) {
    // Backend returnerar detta meddelande för ett låst konto.
    if (
      error.response.data ===
      "Kontot är tillfälligt låst. Försök senare."
    ) {
      return (
        "Kontot är tillfälligt låst efter för många felaktiga försök. " +
        "Försök igen när låsningen har upphört."
      );
    }

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

const featureList = [
  "Få koll på kostnader",
  "Håll koll på kommande betalningar",
  "Organisera i kategorier",
];

// Neutrala ikoner som platshållare. Byt mot riktiga tjänstelogotyper vid behov.
const serviceTiles = [Music, Clapperboard, Play, Gamepad2, Tv, Plus];

function BrandMark({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex items-center justify-center rounded-xl bg-primary text-white ${className}`}
    >
      <Wallet size={24} aria-hidden="true" />
    </div>
  );
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

    const submittedEmail = email.trim();

    try {
      await login({
        email: submittedEmail,
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
    } catch (caughtError: unknown) {
      if (requiresEmailVerification(caughtError)) {
        setPassword("");

        navigate("/verify-email", {
          replace: true,
          state: {
            email: submittedEmail,
            message:
              "Verifiera din e-postadress innan du loggar in. " +
              "Ange en giltig kod från ditt senaste mejl eller välj Skicka ny kod.",
          },
        });

        return;
      }

      setError(getLoginError(caughtError));
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-dvh bg-background lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:bg-[#0b2a5b] lg:p-4">
      {/* Vänster panel (endast desktop) */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-[radial-gradient(120%_90%_at_15%_0%,#17428b_0%,#0b2a5b_55%,#071c40_100%)] px-10 py-12 text-white lg:flex xl:px-16">
        <div className="relative z-10 flex items-center gap-3">
          <BrandMark className="h-11 w-11" />
          <span className="text-3xl font-semibold tracking-tight">
            MySubs
          </span>
        </div>

        <div className="relative z-10">
          <h2 className="max-w-xs text-2xl font-semibold leading-snug tracking-tight">
            Dina prenumerationer samlade på ett ställe
          </h2>

          <ul className="mt-6 space-y-3">
            {featureList.map((feature) => (
              <li
                key={feature}
                className="flex items-center gap-3 text-sm text-white/85"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/40">
                  <Check size={12} aria-hidden="true" />
                </span>
                {feature}
              </li>
            ))}
          </ul>

          <div
            className="mt-10 grid w-fit grid-cols-3 gap-3"
            aria-hidden="true"
          >
            {serviceTiles.map((Icon, index) => (
              <div
                key={index}
                className="flex h-14 w-14 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white/80"
              >
                <Icon size={22} />
              </div>
            ))}
          </div>
        </div>

        <svg
          aria-hidden="true"
          viewBox="0 0 600 160"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-40 w-full text-white/5"
        >
          <path
            fill="currentColor"
            d="M0 160V110l70-45 60 35 90-70 80 60 70-40 100 75 60-30 70 45v20z"
          />
        </svg>
      </aside>

      {/* Höger panel */}
      <section className="flex min-h-dvh items-center justify-center px-4 py-8 lg:min-h-0 lg:p-0">
        <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-card sm:p-8 lg:flex lg:h-full lg:max-w-none lg:flex-col lg:justify-center lg:px-14">
          <div className="mx-auto w-full max-w-sm">
            <header className="mb-7">
              <div className="mb-5 flex items-center gap-3 lg:hidden">
                <BrandMark className="h-10 w-10" />
                <span className="text-xl font-semibold tracking-tight text-text-primary">
                  MySubs
                </span>
              </div>

              <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
                Logga in på MySubs
              </h1>

              <p className="mt-2 text-sm text-text-secondary">
                Håll koll på dina prenumerationer.
              </p>
            </header>

            <form onSubmit={handleSubmit} aria-busy={isSubmitting}>
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

                  <div className="relative">
                    <Mail
                      size={18}
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary"
                    />

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
                      onChange={(event) => {
                        setEmail(event.target.value);
                        setError(null);
                      }}
                      placeholder="namn@example.com"
                      className="min-h-12 w-full rounded-lg border border-border bg-white py-3 pl-11 pr-3 text-base text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-medium text-text-primary"
                  >
                    Lösenord
                  </label>

                  <div className="relative">
                    <Lock
                      size={18}
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary"
                    />

                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(event) => {
                        setPassword(event.target.value);
                        setError(null);
                      }}
                      className="min-h-12 w-full rounded-lg border border-border bg-white py-3 pl-11 pr-14 text-base text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((visible) => !visible)}
                      aria-label={
                        showPassword ? "Dölj lösenord" : "Visa lösenord"
                      }
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

            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-1 border-t border-border pt-4 text-sm">
              <span className="text-text-secondary">
                Har du inget konto?
              </span>

              <Link
                to="/register"
                className="inline-flex min-h-11 items-center rounded-md px-1 font-medium text-primary hover:text-primary-hover hover:underline focus-visible:outline-2 focus-visible:outline-primary"
              >
                Registrera dig
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}