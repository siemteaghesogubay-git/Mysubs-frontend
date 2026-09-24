import { useRef, useState, type FormEvent } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { CreditCard } from "lucide-react";
import { forgotPassword } from "../../api/auth";

function getForgotPasswordError(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return "Något gick fel. Försök igen om en stund.";
  }

  if (
    error.code === "ECONNABORTED" ||
    error.code === "ETIMEDOUT"
  ) {
    return (
      "Servern tog för lång tid på sig att svara. " +
      "Kontrollera din inkorg innan du försöker igen."
    );
  }

  if (!error.response) {
    return (
      "Kunde inte nå servern. Kontrollera din anslutning. " +
      "Om begäran hann skickas kan mejlet ändå komma fram."
    );
  }

  if (error.response.status === 429) {
    return "För många försök. Vänta en stund och försök igen.";
  }

  if (error.response.status === 400) {
    return "Kontrollera att du har angett en giltig e-postadress.";
  }

  return "Kunde inte behandla begäran. Försök igen om en stund.";
}

export function ForgotPassword() {
  const submittingRef = useRef(false);

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submittingRef.current) return;

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setError("Ange din e-postadress.");
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const response = await forgotPassword({
        email: trimmedEmail,
      });

      setEmail(trimmedEmail);
      setMessage(response.message);
    } catch (caughtError: unknown) {
      setError(getForgotPasswordError(caughtError));
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  function showFormAgain() {
    setMessage(null);
    setError(null);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-sm">
        <header className="mb-6 flex flex-col items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <CreditCard
              size={18}
              className="text-white"
              aria-hidden="true"
            />
          </div>

          <h1 className="text-lg font-semibold text-text-primary">
            Glömt lösenord
          </h1>

          <p className="text-center text-[13px] text-text-secondary">
            Ange din e-postadress för att begära en länk till
            lösenordsåterställning.
          </p>
        </header>

        <div className="rounded-xl border border-border bg-surface p-6 shadow-card">
          {error && (
            <div
              role="alert"
              className="mb-4 rounded-md border border-danger-soft bg-danger-soft px-3 py-2 text-[12px] text-danger"
            >
              {error}
            </div>
          )}

          {message ? (
            <div>
              <div
                role="status"
                className="mb-4 rounded-md border border-success-soft bg-success-soft px-3 py-2 text-[12px] text-success"
              >
                {message}
              </div>

              <p className="text-[13px] text-text-secondary">
                Kontrollera din inkorg och skräppost. Öppna länken i
                mejlet för att välja ett nytt lösenord.
              </p>

              <p className="mt-3 text-[12px] text-text-secondary">
                Mejladressen måste vara verifierad för att du ska
                kunna återställa lösenordet.
              </p>

              <Link
                to="/verify-email"
                state={{ email: email.trim() }}
                className="mt-2 inline-block text-[13px] font-medium text-primary hover:underline"
              >
                Verifiera e-postadress
              </Link>

              <button
                type="button"
                onClick={showFormAgain}
                className="mt-5 w-full rounded-md border border-border px-3 py-2 text-[13px] font-medium text-primary hover:bg-background"
              >
                Försök igen eller ändra e-postadress
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              aria-busy={isSubmitting}
            >
              <label
                htmlFor="forgot-password-email"
                className="mb-1 block text-[12px] font-medium text-text-secondary"
              >
                E-post
              </label>

              <input
                id="forgot-password-email"
                name="email"
                required
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                disabled={isSubmitting}
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError(null);
                }}
                className="mb-5 w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] outline-none focus:border-primary disabled:opacity-60"
                placeholder="namn@example.com"
              />

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-md bg-primary py-2 text-[13px] font-medium text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting
                  ? "Skickar begäran..."
                  : "Skicka återställningslänk"}
              </button>
            </form>
          )}
        </div>

        <p className="mt-4 text-center text-[13px] text-text-secondary">
          <Link
            to="/login"
            className="font-medium text-primary hover:underline"
          >
            Tillbaka till inloggning
          </Link>
        </p>
      </div>
    </main>
  );
}