import { useState, type FormEvent } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { changePassword } from "../../api/auth";
import {
  deleteMyAccount,
  getMyProfile,
  updateMyProfile,
} from "../../api/users";
import type { UpdateProfileRequest } from "../../types/user";

type Tab = "profile" | "security" | "delete";

type ProfileFields = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string | null;
};

type ProfilePatch = {
  firstName: string;
  lastName: string;
};

const inputClass =
  "mb-4 w-full rounded-md border border-border bg-white px-3 py-2 " +
  "text-[13px] outline-none focus:border-primary disabled:opacity-60";

const labelClass =
  "mb-1 block text-[12px] font-medium text-text-secondary";

const buttonClass =
  "w-full rounded-md bg-primary py-2 text-[13px] font-medium " +
  "text-white hover:bg-primary-hover disabled:opacity-60";

export function Profile() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("profile");

  function handleAccountDeleted() {
    logout();
    queryClient.clear();
    navigate("/login", { replace: true });
  }

  return (
    <div>
      <h1 className="mb-5 text-lg font-semibold text-text-primary">
        Min profil
      </h1>

      <div className="mb-5 flex gap-1 border-b border-border">
        {(
          [
            ["profile", "Min profil"],
            ["security", "Säkerhet"],
            ["delete", "Radera konto"],
          ] as [Tab, string][]
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={`px-3 py-2 text-[13px] font-medium ${
              tab === value
                ? "border-b-2 border-primary text-primary"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="max-w-md rounded-xl border border-border bg-surface p-6 shadow-card">
        {tab === "profile" &&
          (user?.id ? (
            <ProfileEditor
              key={user.id}
              userId={user.id}
              onSaved={updateUser}
            />
          ) : (
            <p role="alert" className="text-[13px] text-danger">
              Användaruppgifter saknas. Logga ut och logga in igen.
            </p>
          ))}

        {tab === "security" && <SecurityForm />}

        {tab === "delete" && (
          <DeleteAccountForm onDeleted={handleAccountDeleted} />
        )}
      </div>
    </div>
  );
}

function ProfileEditor({
  userId,
  onSaved,
}: {
  userId: string;
  onSaved: (patch: ProfilePatch) => void;
}) {
  const profileQuery = useQuery({
    queryKey: ["my-profile", userId],
    queryFn: getMyProfile,
    refetchOnWindowFocus: false,
    retry: false,
  });

  if (profileQuery.isPending) {
    return (
      <p role="status" className="text-[13px] text-text-secondary">
        Hämtar din profil...
      </p>
    );
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <div role="alert" className="text-[13px] text-danger">
        <p>Kunde inte hämta din profil.</p>
        <button
          type="button"
          disabled={profileQuery.isFetching}
          onClick={() => void profileQuery.refetch()}
          className="mt-2 font-medium underline disabled:opacity-60"
        >
          {profileQuery.isFetching ? "Hämtar..." : "Försök igen"}
        </button>
      </div>
    );
  }

  return (
    <ProfileForm
      profile={profileQuery.data}
      userId={userId}
      onSaved={onSaved}
    />
  );
}

function ProfileForm({
  profile,
  userId,
  onSaved,
}: {
  profile: ProfileFields;
  userId: string;
  onSaved: (patch: ProfilePatch) => void;
}) {
  const queryClient = useQueryClient();

  const [firstName, setFirstName] = useState(profile.firstName ?? "");
  const [lastName, setLastName] = useState(profile.lastName ?? "");
  const [phoneNumber, setPhoneNumber] = useState(
    profile.phoneNumber ?? ""
  );

  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const mutation = useMutation({
    mutationFn: (payload: UpdateProfileRequest) =>
      updateMyProfile(payload),

    onSuccess: (_data, submitted) => {
      onSaved({
        firstName: submitted.firstName,
        lastName: submitted.lastName,
      });

      setFirstName(submitted.firstName);
      setLastName(submitted.lastName);
      setPhoneNumber(submitted.phoneNumber ?? "");

      // Spara de skickade värdena i profilens cache.
      queryClient.setQueryData(
        ["my-profile", userId],
        { ...profile, ...submitted }
      );

      void queryClient.invalidateQueries({
        queryKey: ["my-profile", userId],
      });

      setMessage({
        type: "success",
        text: "Profilen har uppdaterats.",
      });
    },

    onError: () => {
      setMessage({
        type: "error",
        text: "Kunde inte spara ändringarna. Försök igen.",
      });
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mutation.isPending) return;

    setMessage(null);

    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();

    if (!trimmedFirstName || !trimmedLastName) {
      setMessage({
        type: "error",
        text: "Fyll i både förnamn och efternamn.",
      });
      return;
    }

    mutation.mutate({
      firstName: trimmedFirstName,
      lastName: trimmedLastName,
      phoneNumber: phoneNumber.trim() || null,
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      {message && (
        <div
          role={message.type === "error" ? "alert" : "status"}
          className={`mb-4 rounded-md border px-3 py-2 text-[12px] ${
            message.type === "success"
              ? "border-success-soft bg-success-soft text-success"
              : "border-danger-soft bg-danger-soft text-danger"
          }`}
        >
          {message.text}
        </div>
      )}

      <fieldset disabled={mutation.isPending}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="profile-first-name" className={labelClass}>
              Förnamn
            </label>
            <input
              id="profile-first-name"
              autoComplete="given-name"
              required
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="profile-last-name" className={labelClass}>
              Efternamn
            </label>
            <input
              id="profile-last-name"
              autoComplete="family-name"
              required
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <label htmlFor="profile-email" className={labelClass}>
          E-post
        </label>
        <input
          id="profile-email"
          type="email"
          disabled
          value={profile.email ?? ""}
          className={inputClass}
        />

        <label htmlFor="profile-phone" className={labelClass}>
          Telefon
        </label>
        <input
          id="profile-phone"
          type="tel"
          autoComplete="tel"
          value={phoneNumber}
          onChange={(event) => setPhoneNumber(event.target.value)}
          placeholder="070-123 45 67"
          className={inputClass}
        />

        <button
          type="submit"
          disabled={mutation.isPending}
          className={buttonClass}
        >
          {mutation.isPending ? "Sparar..." : "Spara ändringar"}
        </button>
      </fieldset>
    </form>
  );
}

function SecurityForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const mutation = useMutation({
    mutationFn: (payload: Parameters<typeof changePassword>[0]) =>
      changePassword(payload),

    onSuccess: () => {
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },

    onError: () => {
      setError(
        "Kunde inte byta lösenord. Kontrollera nuvarande lösenord " +
          "och att det nya uppfyller lösenordskraven."
      );
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mutation.isPending) return;

    setError(null);
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError("De nya lösenorden matchar inte.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Nytt lösenord måste vara minst 8 tecken.");
      return;
    }

    mutation.mutate({ currentPassword, newPassword });
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div
          role="alert"
          className="mb-4 rounded-md border border-danger-soft bg-danger-soft px-3 py-2 text-[12px] text-danger"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="mb-4 rounded-md border border-success-soft bg-success-soft px-3 py-2 text-[12px] text-success"
        >
          Lösenordet har ändrats.
        </div>
      )}

      <fieldset disabled={mutation.isPending}>
        <label htmlFor="current-password" className={labelClass}>
          Nuvarande lösenord
        </label>
        <input
          id="current-password"
          required
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          className={inputClass}
        />

        <label htmlFor="new-password" className={labelClass}>
          Nytt lösenord
        </label>
        <input
          id="new-password"
          required
          minLength={8}
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          className={inputClass}
        />

        <label htmlFor="confirm-password" className={labelClass}>
          Bekräfta nytt lösenord
        </label>
        <input
          id="confirm-password"
          required
          minLength={8}
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          className={inputClass}
        />

        <button
          type="submit"
          disabled={mutation.isPending}
          className={buttonClass}
        >
          {mutation.isPending ? "Byter lösenord..." : "Byt lösenord"}
        </button>
      </fieldset>
    </form>
  );
}

function DeleteAccountForm({ onDeleted }: { onDeleted: () => void }) {
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: deleteMyAccount,
    onSuccess: onDeleted,
    onError: () => {
      setError(
        "Kunde inte radera kontot. Försök igen eller kontrollera " +
          "felmeddelandet från servern."
      );
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mutation.isPending) return;

    setError(null);

    if (confirmText !== "RADERA") {
      setError('Skriv "RADERA" för att bekräfta.');
      return;
    }

    mutation.mutate();
  }

  return (
    <form onSubmit={handleSubmit}>
      <p className="mb-4 text-[13px] text-text-primary">
        Detta raderar ditt konto permanent. Det går inte att ångra.
      </p>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-md border border-danger-soft bg-danger-soft px-3 py-2 text-[12px] text-danger"
        >
          {error}
        </div>
      )}

      <label htmlFor="delete-confirmation" className={labelClass}>
        Skriv <span className="font-semibold">RADERA</span> för att
        bekräfta
      </label>
      <input
        id="delete-confirmation"
        required
        autoComplete="off"
        disabled={mutation.isPending}
        value={confirmText}
        onChange={(event) => setConfirmText(event.target.value)}
        className={inputClass}
      />

      <button
        type="submit"
        disabled={mutation.isPending || confirmText !== "RADERA"}
        className="w-full rounded-md bg-danger py-2 text-[13px] font-medium text-white hover:bg-red-700 disabled:opacity-60"
      >
        {mutation.isPending ? "Raderar..." : "Radera mitt konto"}
      </button>
    </form>
  );
}