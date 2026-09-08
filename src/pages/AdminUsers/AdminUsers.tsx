import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Trash2 } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { deleteUser, getAllUsers } from "../../api/users";

export function AdminUsers() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const usersQuery = useQuery({ queryKey: ["admin-users"], queryFn: getAllUsers });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
    onError: () => alert("Kunde inte radera användaren."),
  });

  const filtered = useMemo(() => {
    if (!usersQuery.data) return [];
    const query = search.toLowerCase();
    return usersQuery.data.filter(
      (u) => u.email.toLowerCase().includes(query) || `${u.firstName} ${u.lastName}`.toLowerCase().includes(query)
    );
  }, [usersQuery.data, search]);

  async function handleDelete(id: string, name: string) {
    if (id === currentUser?.id) return;
    if (!confirm(`Ta bort användaren ${name}? Detta går inte att ångra.`)) return;
    await deleteMutation.mutateAsync(id);
  }

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-lg font-semibold text-text-primary">Användare</h1>
        <p className="text-[13px] text-text-secondary">Hantera alla registrerade användare.</p>
      </div>

      <div className="mb-4 flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 sm:w-80">
        <Search size={14} className="text-text-muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Sök användare..."
          className="w-full bg-transparent text-[13px] outline-none placeholder:text-text-muted"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
        {usersQuery.isLoading ? (
          <div className="space-y-2 p-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-background" />
            ))}
          </div>
        ) : usersQuery.isError ? (
          <p className="p-6 text-center text-[13px] text-danger">Kunde inte hämta användare.</p>
        ) : filtered.length === 0 ? (
          <p className="p-8 text-center text-[13px] text-text-secondary">Inga användare hittades.</p>
        ) : (
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-border text-[11px] text-text-muted">
                <th className="px-4 py-2.5 font-medium">Namn</th>
                <th className="px-4 py-2.5 font-medium">E-post</th>
                <th className="px-4 py-2.5 font-medium">Roll</th>
                <th className="px-4 py-2.5 font-medium" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-text-primary">
                    {u.firstName} {u.lastName}
                    {u.id === currentUser?.id && <span className="ml-1.5 text-[11px] text-text-muted">(du)</span>}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-background px-2 py-0.5 text-[11px] text-text-secondary">
                      {u.roles.join(", ") || "USER"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(u.id, `${u.firstName} ${u.lastName}`)}
                      disabled={u.id === currentUser?.id}
                      aria-label={`Ta bort ${u.firstName} ${u.lastName}`}
                      className="rounded-md p-1.5 text-text-secondary hover:bg-danger-soft hover:text-danger disabled:pointer-events-none disabled:opacity-30"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}