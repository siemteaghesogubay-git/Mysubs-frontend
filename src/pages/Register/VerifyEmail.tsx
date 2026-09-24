import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import axios from "axios";
import { Link, useLocation } from "react-router-dom";
import { CreditCard, MailCheck } from "lucide-react";

import {
  resendVerificationCode,
  verifyEmail,
} from "../../api/auth";

interface VerificationState {
  email?: string;
  message?: string;
  verificationEmailSent?: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readNavigationState(value: unknown): VerificationState {
  if (!isRecord(value)) return {};

  return {
    email: typeof value.email === "string" ? value.email : undefined,
    message:
      typeof value.message === "string" ? value.message : undefined,
    verificationEmailSent:
      typeof value.verificationEmailSent === "boolean"
        ? value.verificationEmailSent
        : undefined,
  };
}

function hasErrorCode(error: unknown, code: string): boolean {
  if (!axios.isAxiosError(error)) return false;

  const data: unknown = error.response?.data;

  if (Array.isArray(data)) {
    return data.some(
      (item) => isRecord(item) && item.code === code,
    );
  }

  return isRecord(data) && data.code === code;
}

function getErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return "Något gick fel. Försök igen.";
  }

  if (!error.response) {
    return "Kunde inte nå servern. Kontrollera anslutningen och försök igen.";
  }

  if (error.response.status === 429) {
    return "För många förfrågningar. Vänta en stund och försök igen.";
  }

  const messages: Record<string, string> = {
    InvalidVerification:
      "Ogiltig e-postadress eller verifieringskod.",
    InvalidVerificationCode:
      "Koden är felaktig. Kontrollera koden i ditt senaste mejl.",
    VerificationCodeExpired:
      "Koden har gått ut. Begär en ny kod.",
    VerificationCodeMissing:
      "Det finns ingen aktiv kod. Begär en ny kod.",
    TooManyVerificationAttempts:
      "För många felaktiga försök. Begär en ny kod.",
    ResendTooSoon:
      "Vänta minst 60 sekunder mellan nya koder.",
    EmailDeliveryFailed:
      "Mejlet kunde inte skickas. Vänta en stund och försök igen.",
    ConcurrencyFailure:
      "Uppgifterna ändrades under tiden. Försök igen med den senaste koden.",
  };

  const data: unknown = error.response.data;

  const errors: unknown[] = Array.isArray(data) ? data : [data];

  for (const item of errors) {
    if (
      isRecord(item) &&
      typeof item.code === "string" &&
      messages[item.code]
    ) {
      return messages[item.code];
    }
  }

  if (error.response.status === 400) {
    return "Kontrollera mejladressen och ange en kod med sex siffror.";
  }

  return "Kunde inte slutföra begäran. Försök igen senare.";
}

export function VerifyEmail() {
  const location = useLocation();

  const [initialState] = useState(() =>
    readNavigationState(location.state),
  );

  const [email, setEmail] = useState(initialState.email ?? "");
  const [code, setCode] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(
    initialState.message ?? null,
  );

  const [isVerified, setIsVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  // Hindrar dubbelklick och samtidiga verifierings-/utskicksanrop.
  const busyRef = useRef(false);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const codeInputRef = useRef<HTMLInputElement>(null);

  // Servern kontrollerar också väntetiden.
  const [resendAvailableAt, setResendAvailableAt] = useState(() =>
    typeof initialState.verificationEmailSent === "boolean"
      ? Date.now() + 60_000
      : 0,
  );

  const [secondsRemaining, setSecondsRemaining] = useState(() =>
    typeof initialState.verificationEmailSent === "boolean" ? 60 : 0,
  );

  useEffect(() => {
    function updateCountdown() {
      setSecondsRemaining(
        Math.max(
          0,
          Math.ceil((resendAvailableAt - Date.now()) / 1000),
        ),
      );
    }

    updateCountdown();

    if (resendAvailableAt <= Date.now()) return;

    const timer = window.setInterval(updateCountdown, 1000);

    return () => window.clearInterval(timer);
  }, [resendAvailableAt]);

  function startResendCooldown() {
    setResendAvailableAt(Date.now() + 60_000);
    setSecondsRemaining(60);
  }

  function validateEmail(): string | null {
    const trimmedEmail = email.trim();
    const input = emailInputRef.current;

    if (!trimmedEmail) {
      setError("Ange din e-postadress.");
      input?.focus();
      return null;
    }

    if (input && !input.checkValidity()) {
      setError("Ange en giltig e-postadress.");
      input.reportValidity();
      return null;
    }

    return trimmedEmail;
  }

  async function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (busyRef.current || isVerified) return;

    setError(null);
    setMessage(null);

    const trimmedEmail = validateEmail();

    if (!trimmedEmail) return;

    if (!/^[0-9]{6}$/.test(code)) {
      setError("Ange verifieringskoden med exakt sex siffror.");
      codeInputRef.current?.focus();
      return;
    }

    busyRef.current = true;
    setIsVerifying(true);

    try {
      const result = await verifyEmail({
        email: trimmedEmail,
        code,
      });

      setCode("");
      setMessage(result.message);
      setIsVerified(true);
    } catch (caughtError: unknown) {
      if (hasErrorCode(caughtError, "EmailAlreadyConfirmed")) {
        setCode("");
        setMessage("Din e-postadress är redan verifierad. Du kan logga in.");
        setIsVerified(true);
      } else {
        setError(getErrorMessage(caughtError));
      }
    } finally {
      busyRef.current = false;
      setIsVerifying(false);
    }
  }

  async function handleResend() {
    if (
      busyRef.current ||
      isVerified ||
      Date.now() < resendAvailableAt
    ) {
      return;
    }

    setError(null);
    setMessage(null);

    const trimmedEmail = validateEmail();

    if (!trimmedEmail) return;

    busyRef.current = true;
    setIsResending(true);
    startResendCooldown();

    try {
      const result = await resendVerificationCode({
        email: trimmedEmail,
      });

      setCode("");

      // API-svaret är avsiktligt generellt och garanterar inte leverans.
      setMessage(result.message);
    } catch (caughtError: unknown) {
      setError(getErrorMessage(caughtError));
    } finally {
      busyRef.current = false;
      setIsResending(false);
    }
  }

  const isBusy = isVerifying || isResending;

  const inputClass =
    "w-full rounded-md border border-border bg-white px-3 py-2 " +
    "text-[13px] outline-none focus:border-primary disabled:opacity-60";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <CreditCard size={18} className="text-white" />
          </div>

          <h1 className="text-lg font-semibold text-text-primary">
            {isVerified ? "E-post verifierad" : "Verifiera din e-post"}
          </h1>

          <p className="text-center text-[13px] text-text-secondary">
            {isVerified
              ? "Du kan nu logga in på MySubs."
              : "Ange koden från ditt senaste verifieringsmejl."}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6 shadow-card">
          {error && (
            <div
              role="alert"
              className="mb-4 rounded-md border border-danger-soft bg-danger-soft px-3 py-2 text-[12px] text-danger"
            >
              {error}
            </div>
          )}

          {message && (
            <div
              role="status"
              className="mb-4 rounded-md border border-border bg-background px-3 py-2 text-[12px] text-text-primary"
            >
              {message}
            </div>
          )}

          {isVerified ? (
            <div className="flex flex-col items-center gap-4">
              <MailCheck
                size={40}
                className="text-primary"
                aria-hidden="true"
              />

              <Link
                to="/login"
                replace
                className="w-full rounded-md bg-primary py-2 text-center text-[13px] font-medium text-white hover:bg-primary-hover"
              >
                Gå till inloggning
              </Link>
            </div>
          ) : (
            <form onSubmit={handleVerify} aria-busy={isBusy}>
              <div className="mb-4">
                <label
                  htmlFor="verification-email"
                  className="mb-1 block text-[12px] font-medium text-text-secondary"
                >
                  E-postadress
                </label>

                <input
                  ref={emailInputRef}
                  id="verification-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  required
                  disabled={isBusy}
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setCode("");
                    setError(null);
                    setMessage(null);
                  }}
                  className={inputClass}
                />
              </div>

              <div className="mb-5">
                <label
                  htmlFor="verification-code"
                  className="mb-1 block text-[12px] font-medium text-text-secondary"
                >
                  Verifieringskod
                </label>

                <input
                  ref={codeInputRef}
                  id="verification-code"
                  name="code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  aria-describedby="verification-code-help"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                  disabled={isBusy}
                  value={code}
                  onChange={(event) => {
                    setCode(
                      event.target.value
                        .replace(/[^0-9]/g, "")
                        .slice(0, 6),
                    );
                    setError(null);
                  }}
                  placeholder="000000"
                  className={`${inputClass} text-center text-xl tracking-[0.35em]`}
                />

                <p
                  id="verification-code-help"
                  className="mt-2 text-[11px] text-text-secondary"
                >
                  Koden innehåller sex siffror och gäller i tio minuter.
                </p>
              </div>

              <button
                type="submit"
                disabled={isBusy || code.length !== 6}
                className="w-full rounded-md bg-primary py-2 text-[13px] font-medium text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isVerifying ? "Verifierar..." : "Verifiera e-post"}
              </button>

              <div className="mt-5 border-t border-border pt-4">
                <p className="mb-3 text-center text-[12px] text-text-secondary">
                  Saknar du mejlet? Kontrollera skräpposten eller begär
                  en ny kod.
                </p>

                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isBusy || secondsRemaining > 0}
                  className="w-full rounded-md border border-border px-3 py-2 text-[13px] font-medium text-primary hover:bg-background disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isResending
                    ? "Begär ny kod..."
                    : secondsRemaining > 0
                      ? `Skicka ny kod om ${secondsRemaining} s`
                      : "Skicka ny kod"}
                </button>
              </div>
            </form>
          )}
        </div>

        {!isVerified && (
          <p className="mt-4 text-center text-[13px] text-text-secondary">
            Redan verifierad?{" "}
            <Link to="/login" className="font-medium text-primary">
              Logga in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}