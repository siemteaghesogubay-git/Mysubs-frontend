import { useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { changePassword } from "../../api/auth";
import { deleteMyAccount, updateMyProfile } from "../../api/users";

type Tab = "profile" | "security" | "delete";

export function Profile() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("profile");

  return (
    <div>
      <h1 className="mb-5 text-lg font-semibold text-text-primary">Min profil</h1>

      <div className="mb-5 flex gap-1 border-b border-border">
        {([
          ["profile", "Min profil"],
          ["security", "Säkerhet"],
          ["delete", "Radera konto"],
        ] as [Tab, string][]).map(([value, label]) => (
          <button
            key={value}
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
        {tab === "profile" && user && <ProfileForm user={user} onSaved={updateUser} />}
        {tab === "security" && <SecurityForm />}
        {tab === "delete" && <DeleteAccountForm onDeleted={() => { logout(); navigate("/login"); }} />}
      </div>
    </div>
  );
}

function ProfileForm({
  user, onSaved,
}: { user: { firstName: string; lastName: string; email: string }; onSaved: (patch: { firstName: string; lastName: string }) => void }) {
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const mutation = useMutation({
    mutationFn: () => updateMyProfile({ firstName, lastName, phoneNumber: phoneNumber || null }),
    onSuccess: () => {
      onSaved({ firstName, lastName });
      setMessage({ type: "success", text: "Profilen har uppdaterats." });
    },
    onError: () => setMessage({ type: "error", text: "Kunde inte spara ändringarna." }),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    mutation.mutate();
  }

  return (
    <form onSubmit={handleSubmit}>
      {message && (
        <div
          className={`mb-4 rounded-md px-3 py-2 text-[12px] ${
            message.type === "success"
              ? "border border-success-soft bg-success-soft text-success"
              : "border border-danger-soft bg-danger-soft text-danger"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-[12px] font-medium text-text-secondary">Förnamn</label>
          <input
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="mb-1 block text-[12px] font-medium text-text-secondary">Efternamn</label>
          <input
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] outline-none focus:border-primary"
          />
        </div>
      </div>

      <label className="mb-1 block text-[12px] font-medium text-text-secondary">E-post</label>
      <input
        disabled
        value={user.email}
        className="mb-4 w-full rounded-md border border-border bg-background px-3 py-2 text-[13px] text-text-muted"
      />

      <label className="mb-1 block text-[12px] font-medium text-text-secondary">Telefon</label>
      <input
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
        placeholder="070-123 45 67"
        className="mb-5 w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] outline-none focus:border-primary"
      />

      <button
        type="submit"
        disabled={mutation.isPending}
        className="w-full rounded-md bg-primary py-2 text-[13px] font-medium text-white hover:bg-primary-hover disabled:opacity-60"
      >
        {mutation.isPending ? "Sparar..." : "Spara ändringar"}
      </button>
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
    mutationFn: () => changePassword({ currentPassword, newPassword }),
    onSuccess: () => {
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: () => setError("Kunde inte byta lösenord. Kontrollera att nuvarande lösenord stämmer."),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
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

    mutation.mutate();
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="mb-4 rounded-md border border-danger-soft bg-danger-soft px-3 py-2 text-[12px] text-danger">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-md border border-success-soft bg-success-soft px-3 py-2 text-[12px] text-success">
          Lösenordet har ändrats. Du behöver logga in igen nästa gång.
        </div>
      )}

      <label className="mb-1 block text-[12px] font-medium text-text-secondary">Nuvarande lösenord</label>
      <input
        required
        type="password"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        className="mb-4 w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] outline-none focus:border-primary"
      />

      <label className="mb-1 block text-[12px] font-medium text-text-secondary">Nytt lösenord</label>
      <input
        required
        type="password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        className="mb-4 w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] outline-none focus:border-primary"
      />

      <label className="mb-1 block text-[12px] font-medium text-text-secondary">Bekräfta nytt lösenord</label>
      <input
        required
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        className="mb-5 w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] outline-none focus:border-primary"
      />

      <button
        type="submit"
        disabled={mutation.isPending}
        className="w-full rounded-md bg-primary py-2 text-[13px] font-medium text-white hover:bg-primary-hover disabled:opacity-60"
      >
        {mutation.isPending ? "Byter lösenord..." : "Byt lösenord"}
      </button>
    </form>
  );
}

function DeleteAccountForm({ onDeleted }: { onDeleted: () => void }) {
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: deleteMyAccount,
    onSuccess: onDeleted,
    onError: () => setError("Kunde inte radera kontot. Du kanske äger en familjegrupp — överför ägarskapet eller radera gruppen först."),
  });

  function handleDelete() {
    setError(null);
    if (confirmText !== "RADERA") {
      setError('Skriv "RADERA" för att bekräfta.');
      return;
    }
    mutation.mutate();
  }

  return (
    <div>
      <p className="mb-4 text-[13px] text-text-primary">
        Detta raderar ditt konto permanent, tillsammans med alla dina prenumerationer. Det går inte att ångra.
      </p>

      {error && (
        <div className="mb-4 rounded-md border border-danger-soft bg-danger-soft px-3 py-2 text-[12px] text-danger">
          {error}
        </div>
      )}

      <label className="mb-1 block text-[12px] font-medium text-text-secondary">
        Skriv <span className="font-semibold text-text-primary">RADERA</span> för att bekräfta
      </label>
      <input
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
        className="mb-5 w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] outline-none focus:border-danger"
      />

      <button
        onClick={handleDelete}
        disabled={mutation.isPending}
        className="w-full rounded-md bg-danger py-2 text-[13px] font-medium text-white hover:bg-red-700 disabled:opacity-60"
      >
        {mutation.isPending ? "Raderar..." : "Radera mitt konto"}
      </button>
    </div>
  );
}