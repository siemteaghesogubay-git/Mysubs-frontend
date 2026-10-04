import { useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Plus,
  Pencil,
  Trash2,
  HeartPulse,
  Music,
  Code2,
  Gamepad2,
  Tv,
  GraduationCap,
  Tag,
} from "lucide-react";

import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from "../../api/categories";

import type { CategoryResponse } from "../../types/category";
import { useAuth } from "../../contexts/AuthContext";
import { CategoryModal } from "./CategoryModal";

/**
 * Returnerar en ikon som passar kategorins namn.
 * Tag används som standard om ingen kategori matchar.AI
 */
function getCategoryIcon(categoryName: string) {
  const name = categoryName.toLowerCase();

  if (
    name.includes("hälsa") ||
    name.includes("fitness") ||
    name.includes("gym")
  ) {
    return HeartPulse;
  }

  if (name.includes("music") || name.includes("musik")) {
    return Music;
  }

  if (
    name.includes("programvara") ||
    name.includes("verktyg") ||
    name.includes("software")
  ) {
    return Code2;
  }

  if (name.includes("spel") || name.includes("game")) {
    return Gamepad2;
  }

  if (
    name.includes("streaming") ||
    name.includes("film") ||
    name.includes("tv")
  ) {
    return Tv;
  }

  if (
    name.includes("utbildning") ||
    name.includes("education")
  ) {
    return GraduationCap;
  }

  return Tag;
}

export function Categories() {
  const queryClient = useQueryClient();
  const { user, isAdmin } = useAuth();

  const [editingCategory, setEditingCategory] =
    useState<CategoryResponse | null>(null);

  const [isCreating, setIsCreating] = useState(false);

  const categoriesQuery = useQuery({
    queryKey: ["categories", user?.id],
    queryFn: getCategories,
    enabled: !!user,
  });

  async function refreshCategories() {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["categories"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["subscriptions"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["dashboard-summary"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["upcoming-payments"],
      }),
    ]);
  }

  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: refreshCategories,
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: Parameters<typeof updateCategory>[1];
    }) => updateCategory(id, payload),
    onSuccess: refreshCategories,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: refreshCategories,
    onError: () => {
      alert(
        "Kunde inte ta bort kategorin. Den kan användas av en " +
          "prenumeration, eller så saknar du behörighet. " +
          "Kontrollera också anslutningen."
      );
    },
  });

  function handleDelete(category: CategoryResponse) {
    if (!category.canManage || deleteMutation.isPending) {
      return;
    }

    if (
      !window.confirm(
        `Ta bort kategorin "${category.name}"?`
      )
    ) {
      return;
    }

    deleteMutation.mutate(category.id);
  }

  const categories = categoriesQuery.data ?? [];

  return (
    <div>
      {/* Sidhuvud */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">
            Kategorier
          </h1>

          <p className="text-[13px] text-text-secondary">
            Dina privata kategorier och gemensamma kategorier från admin.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-[13px] font-medium text-white hover:bg-primary-hover"
        >
          <Plus size={15} />
          Ny kategori
        </button>
      </div>

      <p className="mb-4 text-sm text-text-secondary">
        {isAdmin
          ? "Kategorier du skapar som admin blir synliga för alla användare."
          : "Kategorier du skapar är privata. Gemensamma kategorier kan bara ändras av admin."}
      </p>

      {/* Laddning */}
      {categoriesQuery.isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className="h-20 animate-pulse rounded-xl border border-border bg-surface"
            />
          ))}
        </div>
      ) : categoriesQuery.isError ? (
        /* Felmeddelande */
        <p role="alert" className="text-[13px] text-danger">
          Kunde inte hämta kategorier.
        </p>
      ) : categories.length === 0 ? (
        /* Tom lista */
        <div className="rounded-xl border border-border bg-surface p-8 text-center shadow-card">
          <p className="text-[13px] font-medium text-text-primary">
            Inga kategorier än
          </p>

          <p className="mt-1 text-[12px] text-text-secondary">
            Skapa din första kategori för att kunna lägga till
            prenumerationer.
          </p>
        </div>
      ) : (
        /* Kategorikort */
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => {
            const Icon = getCategoryIcon(category.name);

            return (
              <div
                key={category.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4 shadow-card"
              >
                <div className="flex min-w-0 items-center gap-3">
                  {/* Kategoriikon */}
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                    style={{
                      backgroundColor:
                        category.color ?? "#9ca3af",
                    }}
                    aria-hidden="true"
                  >
                    <Icon
                      size={18}
                      color="#ffffff"
                      strokeWidth={2}
                    />
                  </div>

                  {/* Kategorinamn och typ */}
                  <div className="min-w-0">
                    <p className="break-words text-[13px] font-medium text-text-primary">
                      {category.name}
                    </p>

                    <p className="mt-1 text-xs text-text-secondary">
                      {category.isGlobal
                        ? "Gemensam"
                        : "Privat"}
                    </p>
                  </div>
                </div>

                {/* Hanteringsknappar */}
                {category.canManage && (
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        setEditingCategory(category)
                      }
                      aria-label={`Redigera ${category.name}`}
                      className="rounded-md p-1.5 text-text-secondary hover:bg-background hover:text-text-primary"
                    >
                      <Pencil size={14} />
                    </button>

                    <button
                      type="button"
                      disabled={deleteMutation.isPending}
                      onClick={() => handleDelete(category)}
                      aria-label={`Ta bort ${category.name}`}
                      className="rounded-md p-1.5 text-text-secondary hover:bg-danger-soft hover:text-danger disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Skapa kategori */}
      {isCreating && (
        <CategoryModal
          onClose={() => setIsCreating(false)}
          onSubmit={async (payload) => {
            await createMutation.mutateAsync(payload);
          }}
        />
      )}

      {/* Redigera kategori */}
      {editingCategory && (
        <CategoryModal
          initial={editingCategory}
          onClose={() => setEditingCategory(null)}
          onSubmit={async (payload) => {
            await updateMutation.mutateAsync({
              id: editingCategory.id,
              payload,
            });
          }}
        />
      )}
    </div>
  );
}