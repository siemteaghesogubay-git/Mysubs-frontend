import { useRef, useState, type FormEvent } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { CreditCard } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getRegistrationError(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return "Kunde inte slutföra registreringen. Försök igen.";
  }

  if (!error.response) {
    return (
      "Vi fick inget svar från servern. Kontot kan ha skapats. " +
      "Kontrollera din inkorg eller välj Verifiera e-post nedan."
    );
  }

  if (error.response.status === 429) {
    return "För många försök. Vänta en stund och försök igen.";
  }

  const data: unknown = error.response.data;

  // Identity returnerar en lista med fel.
  if (Array.isArray(data)) {
    const messages = data
      .filter(isRecord)
      .map((item) => {
        switch (item.code) {
          case "DuplicateEmail":
          case "DuplicateUserName":
            return (
              "E-postadressen används redan. Logga in eller verifiera " +
              "din e-postadress via länken nedan."
            );

          case "PasswordTooShort":
            return "Lösenordet måste innehålla minst åtta tecken.";

          case "PasswordRequiresDigit":
            return "Lösenordet måste innehålla minst en siffra.";

          case "PasswordRequiresUpper":
            return "Lösenordet måste innehålla minst en stor bokstav.";

          case "PasswordRequiresLower":
            return "Lösenordet måste innehålla minst en liten bokstav.";

          case "InvalidEmail":
            return "Ange en giltig e-postadress.";

          default:
            return null;
        }
      })
      .filter((message): message is string => message !== null);

    if (messages.length > 0) {
      return [...new Set(messages)].join(" ");
    }
  }

  // Hantera valideringsfel från ASP.NET Core.
  if (
    error.response.status === 400 &&
    isRecord(data) &&
    isRecord(data.errors)
  ) {
    const messages = Object.values(data.errors)
      .flatMap((value) => (Array.isArray(value) ? value : []))
      .filter((value): value is string => typeof value === "string");

    if (messages.length > 0) {
      return messages.join(" ");
    }
  }

  return "Kunde inte skapa kontot. Kontrollera uppgifterna och försök igen.";
}

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const submittingRef = useRef(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submittingRef.current) return;

    setError(null);

    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError("Ange både förnamn och efternamn.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Lösenorden matchar inte.");
      return;
    }

    if (
      form.password.length < 8 ||
      !/[A-Z]/.test(form.password) ||
      !/[a-z]/.test(form.password) ||
      !/[0-9]/.test(form.password)
    ) {
      setError(
        "Lösenordet måste ha minst åtta tecken, en stor bokstav, " +
          "en liten bokstav och en siffra.",
      );
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);

    const payload = {
      ...form,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      phoneNumber: form.phoneNumber.trim(),
    };

    try {
      const result = await register(payload);

      // Skicka aldrig lösenordet till nästa sida eller webbläsarlagringen.
      navigate("/verify-email", {
        replace: true,
        state: {
          email: result.email,
          message: result.message,
          verificationEmailSent: true,
        },
      });
    } catch (caughtError: unknown) {
      if (
        axios.isAxiosError(caughtError) &&
        caughtError.response?.status === 503
      ) {
        const data: unknown = caughtError.response.data;

        if (
          isRecord(data) &&
          data.code === "VerificationEmailFailed" &&
          data.requiresEmailVerification === true
        ) {
          // Kontot finns redan. Låt användaren begära en ny kod.
          navigate("/verify-email", {
            replace: true,
            state: {
              email:
                typeof data.email === "string" && data.email.trim()
                  ? data.email
                  : payload.email,
              message:
                "Kontot har skapats, men mejlet kunde inte skickas. " +
                "Vänta 60 sekunder och begär en ny kod.",
              verificationEmailSent: false,
            },
          });

          return;
        }
      }

      setError(getRegistrationError(caughtError));
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-md border border-border bg-white px-3 py-2 " +
    "text-[13px] outline-none focus:border-primary disabled:opacity-60";

  const labelClass =
    "mb-1 block text-[12px] font-medium text-text-secondary";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <CreditCard size={18} className="text-white" />
          </div>

          <h1 className="text-lg font-semibold text-text-primary">
            Skapa konto
          </h1>

          <p className="text-center text-[13px] text-text-secondary">
            Vi skickar en kod för att verifiera din e-postadress.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          aria-busy={isSubmitting}
          className="rounded-xl border border-border bg-surface p-6 shadow-card"
        >
          {error && (
            <div
              role="alert"
              className="mb-4 rounded-md border border-danger-soft bg-danger-soft px-3 py-2 text-[12px] text-danger"
            >
              {error}
            </div>
          )}

          <fieldset disabled={isSubmitting} className="min-w-0">
            <legend className="sr-only">Dina kontouppgifter</legend>

            <div className="mb-4 grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="firstName" className={labelClass}>
                  Förnamn
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  autoComplete="given-name"
                  required
                  maxLength={15}
                  value={form.firstName}
                  onChange={(event) =>
                    update("firstName", event.target.value)
                  }
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="lastName" className={labelClass}>
                  Efternamn
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  autoComplete="family-name"
                  required
                  maxLength={15}
                  value={form.lastName}
                  onChange={(event) =>
                    update("lastName", event.target.value)
                  }
                  className={inputClass}
                />
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="email" className={labelClass}>
                E-post
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                required
                value={form.email}
                onChange={(event) => update("email", event.target.value)}
                className={inputClass}
              />
            </div>

            <div className="mb-4">
              <label htmlFor="phoneNumber" className={labelClass}>
                Telefon  
              </label>
              <input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                autoComplete="tel"
                value={form.phoneNumber}
                onChange={(event) =>
                  update("phoneNumber", event.target.value)
                }
                placeholder="070-123 45 67"
                className={inputClass}
              />
            </div>

            <div className="mb-4">
              <label htmlFor="password" className={labelClass}>
                Lösenord
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                aria-describedby="password-help"
                required
                minLength={8}
                value={form.password}
                onChange={(event) =>
                  update("password", event.target.value)
                }
                className={inputClass}
              />
              <p
                id="password-help"
                className="mt-1 text-[11px] text-text-secondary"
              >
                Minst åtta tecken, en stor och en liten bokstav samt en
                siffra.
              </p>
            </div>

            <div className="mb-5">
              <label htmlFor="confirmPassword" className={labelClass}>
                Bekräfta lösenord
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={form.confirmPassword}
                onChange={(event) =>
                  update("confirmPassword", event.target.value)
                }
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-md bg-primary py-2 text-[13px] font-medium text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Skapar konto..." : "Skapa konto"}
            </button>
          </fieldset>
        </form>

        <p className="mt-4 text-center text-[13px] text-text-secondary">
          Har du redan ett konto?{" "}
          <Link to="/login" className="font-medium text-primary">
            Logga in
          </Link>
        </p>

        <p className="mt-2 text-center text-[13px] text-text-secondary">
          Behöver du verifiera ditt konto?{" "}
          <Link
            to="/verify-email"
            state={{ email: form.email.trim() }}
            className="font-medium text-primary"
          >
            Verifiera e-post
          </Link>
        </p>
      </div>
    </div>
  );
}