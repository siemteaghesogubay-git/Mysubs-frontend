import { useMemo, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Search, Trash2 } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { deleteUser, getAllUsers } from "../../api/users";

function safeText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function formatRoles(value: unknown): string {
  if (!Array.isArray(value)) return "Ej angiven";

  const roles = value.filter(
    (role): role is string =>
      typeof role === "string" && role.trim().length > 0
  );

  return roles.length > 0 ? roles.join(", ") : "Ej angiven";
}

async function loadUsers() {
  const data = await getAllUsers();

  if (
    !Array.isArray(data) ||
    !data.every(
      (user) =>
        user !== null &&
        typeof user === "object" &&
        typeof user.id === "string" &&
        user.id.trim().length > 0
    )
  ) {
    throw new Error("Servern returnerade en ogiltig användarlista.");
  }

  return data;
}

export function AdminUsers() {
  const { user: currentUser, isAdmin, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const usersQuery = useQuery({
    queryKey: ["admin-users", currentUser?.id],
    queryFn: loadUsers,
    enabled: Boolean(currentUser?.id) && isAdmin && !isLoading,
    retry: false,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["admin-users"],
      });
    },
  });

  const filtered = useMemo(() => {
    const users = usersQuery.data;
    if (!Array.isArray(users)) return [];

    const query = search.trim().toLocaleLowerCase("sv-SE");

    return users.filter((user) => {
      const email = safeText(user.email).toLocaleLowerCase("sv-SE");
      const name =
        `${safeText(user.firstName)} ${safeText(user.lastName)}`
          .trim()
          .toLocaleLowerCase("sv-SE");

      return email.includes(query) || name.includes(query);
    });
  }, [usersQuery.data, search]);

  function handleDelete(id: string, name: string) {
    if (
      !isAdmin ||
      !currentUser?.id ||
      id === currentUser.id ||
      deleteMutation.isPending
    ) {
      return;
    }

    const confirmed = window.confirm(
      `Ta bort användaren ${name}? Detta går inte att ångra.`
    );

    if (!confirmed) return;

    // mutate hanterar felet via mutationens status.
    deleteMutation.mutate(id);
  }

  if (isLoading) {
    return (
      <p role="status" className="text-[13px] text-text-secondary">
        Laddar...
      </p>
    );
  }

  if (!isAdmin || !currentUser?.id) {
    return (
      <p role="alert" className="text-[13px] text-danger">
        Du behöver vara inloggad som administratör för att visa sidan.
      </p>
    );
  }

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-lg font-semibold text-text-primary">
          Användare
        </h1>
        <p className="text-[13px] text-text-secondary">
          Hantera alla registrerade användare.
        </p>
      </div>

      {deleteMutation.isError && (
        <div
          role="alert"
          className="mb-4 rounded-md border border-danger-soft bg-danger-soft px-3 py-2 text-[13px] text-danger"
        >
          Kunde inte radera användaren. Försök igen.
        </div>
      )}

      {deleteMutation.isSuccess && (
        <div
          role="status"
          className="mb-4 rounded-md border border-success-soft bg-success-soft px-3 py-2 text-[13px] text-success"
        >
          Användaren har raderats.
        </div>
      )}

      <div className="mb-4 flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 sm:w-80">
        <Search size={14} className="text-text-muted" />
        <input
          type="search"
          aria-label="Sök användare"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Sök användare..."
          className="w-full bg-transparent text-[13px] outline-none placeholder:text-text-muted"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-card">
        {usersQuery.isPending ? (
          <div
            role="status"
            aria-label="Hämtar användare"
            className="space-y-2 p-4"
          >
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className="h-10 animate-pulse rounded-lg bg-background"
              />
            ))}
          </div>
        ) : usersQuery.isError ? (
          <div
            role="alert"
            className="p-6 text-center text-[13px] text-danger"
          >
            <p>Kunde inte hämta eller läsa användarlistan.</p>
            <button
              type="button"
              disabled={usersQuery.isFetching}
              onClick={() => void usersQuery.refetch()}
              className="mt-2 font-medium underline disabled:opacity-60"
            >
              {usersQuery.isFetching ? "Hämtar..." : "Försök igen"}
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <p className="p-8 text-center text-[13px] text-text-secondary">
            {search.trim()
              ? "Inga användare matchar din sökning."
              : "Inga användare hittades."}
          </p>
        ) : (
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-border text-[11px] text-text-muted">
                <th scope="col" className="px-4 py-2.5 font-medium">
                  Namn
                </th>
                <th scope="col" className="px-4 py-2.5 font-medium">
                  E-post
                </th>
                <th scope="col" className="px-4 py-2.5 font-medium">
                  Roll
                </th>
                <th scope="col" className="px-4 py-2.5 font-medium">
                  <span className="sr-only">Åtgärder</span>
                </th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((user) => {
                const name =
                  `${safeText(user.firstName)} ${safeText(user.lastName)}`
                    .trim();

                const email = safeText(user.email);
                const displayName = name || email || "Namnlös användare";
                const isCurrentUser = user.id === currentUser.id;
                const isDeleting =
                  deleteMutation.isPending &&
                  deleteMutation.variables === user.id;

                return (
                  <tr
                    key={user.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-4 py-3 text-text-primary">
                      {displayName}
                      {isCurrentUser && (
                        <span className="ml-1.5 text-[11px] text-text-muted">
                          (du)
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-text-secondary">
                      {email || "Ej angiven"}
                    </td>

                    <td className="px-4 py-3">
                      <span className="rounded-md bg-background px-2 py-0.5 text-[11px] text-text-secondary">
                        {formatRoles(user.roles)}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(user.id, displayName)}
                        disabled={
                          isCurrentUser || deleteMutation.isPending
                        }
                        aria-label={`Ta bort ${displayName}`}
                        aria-busy={isDeleting}
                        title={
                          isCurrentUser
                            ? "Ditt eget konto hanteras under Min profil"
                            : `Ta bort ${displayName}`
                        }
                        className="rounded-md p-1.5 text-text-secondary hover:bg-danger-soft hover:text-danger disabled:pointer-events-none disabled:opacity-30"
                      >
                        {isDeleting ? (
                          <span className="text-[11px]">Raderar...</span>
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}