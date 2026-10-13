import { useRef, useState, type FormEvent } from "react";
import axios from "axios";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
import LanguageSwitcher from "../../components/LanguageSwitcher";
import { useAuth } from "../../contexts/AuthContext";

type LocationState = {
  from?: {
    pathname?: string;
  };
};

const ACCOUNT_LOCKED_MESSAGE = "Kontot är tillfälligt låst. Försök senare.";

const FEATURE_KEYS = [
  "auth.features.costs",
  "auth.features.upcoming",
  "auth.features.categories",
] as const;

// Neutrala ikoner som platshållare. Byt mot riktiga tjänstelogotyper vid behov.
const SERVICE_TILES = [Music, Clapperboard, Play, Gamepad2, Tv, Plus];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getRequestPath(error: unknown): string | undefined {
  if (!axios.isAxiosError(error)) return undefined;

  return error.config?.url?.split("?")[0].replace(/\/+$/, "").toLowerCase();
}

function requiresEmailVerification(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;

  const data: unknown = error.response?.data;

  return (
    getRequestPath(error)?.endsWith("/api/auth/login") === true &&
    error.response?.status === 403 &&
    isRecord(data) &&
    data.code === "EmailNotConfirmed"
  );
}

/** Returnerar en översättningsnyckel, inte färdig text. */
function getLoginErrorKey(error: unknown): string {
  if (!axios.isAxiosError(error)) return "auth.errors.generic";

  if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
    return "auth.errors.timeout";
  }

  if (!error.response) return "auth.errors.network";

  const { status, data } = error.response;
  const path = getRequestPath(error);
  const isLogin = path?.endsWith("/api/auth/login") === true;
  const isProfile = path?.endsWith("/api/users/me") === true;

  if (status === 429) return "auth.errors.tooManyRequests";
  if (status >= 500) return "auth.errors.server";

  if (isProfile) {
    return status === 401
      ? "auth.errors.sessionUnverified"
      : "auth.errors.profileFailed";
  }

  if (isLogin && status === 401) {
    return data === ACCOUNT_LOCKED_MESSAGE
      ? "auth.errors.accountLocked"
      : "auth.errors.invalidCredentials";
  }

  if (isLogin && status === 400) return "auth.errors.badRequest";
  if (status === 403) return "auth.errors.forbidden";

  return "auth.errors.generic";
}

function getSafeRedirect(state: LocationState | null): string {
  const path = state?.from?.pathname;

  const isSafe =
    typeof path === "string" &&
    path.startsWith("/") &&
    !path.startsWith("//") &&
    !path.includes("\\") &&
    path !== "/login";

  return isSafe ? path : "/";
}

function BrandMark({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex items-center justify-center rounded-xl bg-primary text-white ${className}`}
    >
      <Wallet size={24} aria-hidden="true" />
    </div>
  );
}

const inputBase =
  "min-h-12 w-full rounded-lg border border-border bg-white py-3 pl-11 text-base text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60";

const inlineLink =
  "inline-flex min-h-11 items-center rounded-md px-1 font-medium text-primary hover:text-primary-hover hover:underline focus-visible:outline-2 focus-visible:outline-primary";

export function Login() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const submittingRef = useRef(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submittingRef.current) return;

    submittingRef.current = true;
    setErrorKey(null);
    setIsSubmitting(true);

    const submittedEmail = email.trim();

    try {
      await login({ email: submittedEmail, password });

      navigate(getSafeRedirect(location.state as LocationState | null), {
        replace: true,
      });
    } catch (caughtError: unknown) {
      if (requiresEmailVerification(caughtError)) {
        setPassword("");

        navigate("/verify-email", {
          replace: true,
          state: {
            email: submittedEmail,
            message: t("auth.verifyEmailMessage"),
          },
        });

        return;
      }

      setErrorKey(getLoginErrorKey(caughtError));
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
          <span className="text-3xl font-semibold tracking-tight">MySubs</span>
        </div>

        <div className="relative z-10">
          <h2 className="max-w-xs text-2xl font-semibold leading-snug tracking-tight">
            {t("auth.heroTitle")}
          </h2>

          <ul className="mt-6 space-y-3">
            {FEATURE_KEYS.map((key) => (
              <li
                key={key}
                className="flex items-center gap-3 text-sm text-white/85"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/40">
                  <Check size={12} aria-hidden="true" />
                </span>
                {t(key)}
              </li>
            ))}
          </ul>

          <div
            className="mt-10 grid w-fit grid-cols-3 gap-3"
            aria-hidden="true"
          >
            {SERVICE_TILES.map((Icon, index) => (
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
      <section className="relative flex min-h-dvh items-center justify-center px-4 py-8 lg:min-h-0 lg:p-0">
        <div className="absolute right-4 top-4 z-10 lg:right-6 lg:top-6">
          <LanguageSwitcher />
        </div>

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
                {t("auth.title")}
              </h1>

              <p className="mt-2 text-sm text-text-secondary">
                {t("auth.subtitle")}
              </p>
            </header>

            <form onSubmit={handleSubmit} aria-busy={isSubmitting}>
              {errorKey && (
                <div
                  role="alert"
                  className="mb-5 rounded-lg border border-danger-soft bg-danger-soft px-4 py-3 text-sm leading-relaxed text-danger"
                >
                  {t(errorKey)}
                </div>
              )}

              <fieldset disabled={isSubmitting} className="min-w-0">
                <legend className="sr-only">{t("auth.credentialsLegend")}</legend>

                <div className="mb-5">
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-medium text-text-primary"
                  >
                    {t("auth.email")}
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
                        setErrorKey(null);
                      }}
                      placeholder={t("auth.emailPlaceholder")}
                      className={`${inputBase} pr-3`}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-medium text-text-primary"
                  >
                    {t("auth.password")}
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
                        setErrorKey(null);
                      }}
                      className={`${inputBase} pr-14`}
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((visible) => !visible)}
                      aria-label={
                        showPassword
                          ? t("auth.hidePassword")
                          : t("auth.showPassword")
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
                  <Link to="/forgot-password" className={`${inlineLink} text-sm`}>
                    {t("auth.forgotPassword")}
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

                  {isSubmitting ? t("auth.loggingIn") : t("auth.login")}
                </button>
              </fieldset>
            </form>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-1 border-t border-border pt-4 text-sm">
              <span className="text-text-secondary">{t("auth.noAccount")}</span>

              <Link to="/register" className={inlineLink}>
                {t("auth.register")}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
