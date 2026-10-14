
import { useRef, useState, type FormEvent } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { CreditCard } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../contexts/AuthContext";
import LanguageSwitcher from "../../components/LanguageSwitcher";
import i18n from "../../i18n/config";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getRegistrationError(error: unknown): string {
  const t = i18n.t.bind(i18n);

  if (!axios.isAxiosError(error)) {
    return t("register.errors.generic");
  }

  if (!error.response) {
    return t("register.errors.noResponse");
  }

  if (error.response.status === 429) {
    return t("register.errors.tooManyRequests");
  }

  const data: unknown = error.response.data;

  // Felkoder från ASP.NET Core Identity
  if (Array.isArray(data)) {
    const messages = data
      .filter(isRecord)
      .map((item) => {
        switch (item.code) {
          case "DuplicateEmail":
          case "DuplicateUserName":
            return t("register.errors.duplicateEmail");

          case "PasswordTooShort":
            return t("register.errors.passwordTooShort");

          case "PasswordRequiresDigit":
            return t("register.errors.passwordRequiresDigit");

          case "PasswordRequiresUpper":
            return t("register.errors.passwordRequiresUpper");

          case "PasswordRequiresLower":
            return t("register.errors.passwordRequiresLower");

          case "InvalidEmail":
            return t("register.errors.invalidEmail");

          default:
            return null;
        }
      })
      .filter((message): message is string => message !== null);

    if (messages.length > 0) {
      return [...new Set(messages)].join(" ");
    }
  }

  // Valideringsfel från ASP.NET Core
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

  return t("register.errors.createFailed");
}

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

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
      setError(t("register.errors.nameRequired"));
      return;
    }

    if (!form.phoneNumber.trim()) {
      setError(t("register.errors.phoneRequired"));
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError(t("register.errors.passwordMismatch"));
      return;
    }

    if (
      form.password.length < 8 ||
      !/[A-Z]/.test(form.password) ||
      !/[a-z]/.test(form.password) ||
      !/[0-9]/.test(form.password)
    ) {
      setError(t("register.errors.passwordRequirements"));
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

      // Skicka aldrig lösenordet till nästa sida.
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
          navigate("/verify-email", {
            replace: true,
            state: {
              email:
                typeof data.email === "string" && data.email.trim()
                  ? data.email
                  : payload.email,
              message: t("register.errors.verificationEmailFailed"),
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
    "w-full min-w-0 min-h-11 rounded-md border border-border " +
    "bg-white px-3 py-2 text-base outline-none " +
    "focus:border-primary disabled:opacity-60";

  const labelClass =
    "mb-1 block text-sm font-medium text-text-secondary";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-4 flex justify-end">
          <LanguageSwitcher />
        </div>

        <div className="mb-6 flex flex-col items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <CreditCard size={20} className="text-white" />
          </div>

          <h1 className="text-xl font-semibold text-text-primary">
            {t("register.title")}
          </h1>

          <p className="text-center text-sm text-text-secondary">
            {t("register.subtitle")}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          aria-busy={isSubmitting}
          className="rounded-xl border border-border bg-surface p-4 shadow-card sm:p-6"
        >
          {error && (
            <div
              role="alert"
              className="mb-4 rounded-md border border-danger-soft bg-danger-soft px-3 py-2 text-sm text-danger"
            >
              {error}
            </div>
          )}

          <fieldset disabled={isSubmitting} className="min-w-0">
            <legend className="sr-only">
              {t("register.accountDetails")}
            </legend>

            <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="min-w-0">
                <label htmlFor="firstName" className={labelClass}>
                  {t("register.firstName")}
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

              <div className="min-w-0">
                <label htmlFor="lastName" className={labelClass}>
                  {t("register.lastName")}
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
                {t("register.email")}
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
                onChange={(event) =>
                  update("email", event.target.value)
                }
                className={inputClass}
              />
            </div>

            <div className="mb-4">
              <label htmlFor="phoneNumber" className={labelClass}>
                {t("register.phone")}
              </label>
              <input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                autoComplete="tel"
                required
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
                {t("register.password")}
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
                className="mt-1 text-xs text-text-secondary"
              >
                {t("register.passwordHelp")}
              </p>
            </div>

            <div className="mb-5">
              <label htmlFor="confirmPassword" className={labelClass}>
                {t("register.confirmPassword")}
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
              className="min-h-11 w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting
                ? t("register.creating")
                : t("register.submit")}
            </button>
          </fieldset>
        </form>

        <p className="mt-4 text-center text-sm text-text-secondary">
          {t("register.alreadyAccount")}{" "}
          <Link to="/login" className="font-medium text-primary">
            {t("register.login")}
          </Link>
        </p>

        <p className="mt-2 text-center text-sm text-text-secondary">
          {t("register.needVerification")}{" "}
          <Link
            to="/verify-email"
            state={{ email: form.email.trim() }}
            className="font-medium text-primary"
          >
            {t("register.verifyEmail")}
          </Link>
        </p>
      </div>
    </div>
  );
}
