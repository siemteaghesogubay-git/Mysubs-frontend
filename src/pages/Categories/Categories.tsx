import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { createCategory, deleteCategory, getCategories, updateCategory } from "../../api/categories";
import type { CategoryResponse } from "../../types/category";
import { CategoryModal } from "./CategoryModal";

export function Categories() {
  const queryClient = useQueryClient();
  const [editingCategory, setEditingCategory] = useState<CategoryResponse | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const categoriesQuery = useQuery({ queryKey: ["categories"], queryFn: getCategories });

  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Parameters<typeof updateCategory>[1] }) =>
      updateCategory(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
    onError: () => {
      alert("Kunde inte ta bort kategorin. Den används troligen av en eller flera prenumerationer.");
    },
  });

  async function handleDelete(category: CategoryResponse) {
    if (!confirm(`Ta bort kategorin "${category.name}"?`)) return;
    await deleteMutation.mutateAsync(category.id);
  }

  const categories = categoriesQuery.data ?? [];

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">Kategorier</h1>
          <p className="text-[13px] text-text-secondary">Hantera dina kategorier för prenumerationer.</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-[13px] font-medium text-white hover:bg-primary-hover"
        >
          <Plus size={15} />
          Ny kategori
        </button>
      </div>

      {categoriesQuery.isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl border border-border bg-surface" />
          ))}
        </div>
      ) : categoriesQuery.isError ? (
        <p className="text-[13px] text-danger">Kunde inte hämta kategorier.</p>
      ) : categories.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-8 text-center shadow-card">
          <p className="text-[13px] font-medium text-text-primary">Inga kategorier än</p>
          <p className="mt-1 text-[12px] text-text-secondary">
            Skapa din första kategori för att kunna lägga till prenumerationer.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <div
              key={category.id}
              className="flex items-center justify-between rounded-xl border border-border bg-surface p-4 shadow-card"
            >
              <div className="flex items-center gap-3">
                <span
                  className="h-8 w-8 shrink-0 rounded-lg"
                  style={{ backgroundColor: category.color ?? "#9ca3af" }}
                />
                <span className="text-[13px] font-medium text-text-primary">{category.name}</span>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setEditingCategory(category)}
                  aria-label={`Redigera ${category.name}`}
                  className="rounded-md p-1.5 text-text-secondary hover:bg-background hover:text-text-primary"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleDelete(category)}
                  aria-label={`Ta bort ${category.name}`}
                  className="rounded-md p-1.5 text-text-secondary hover:bg-danger-soft hover:text-danger"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isCreating && (
        <CategoryModal
          onClose={() => setIsCreating(false)}
          onSubmit={async (payload) => {
            await createMutation.mutateAsync(payload);
          }}
        />
      )}

      {editingCategory && (
        <CategoryModal
          initial={editingCategory}
          onClose={() => setEditingCategory(null)}
          onSubmit={async (payload) => {
            await updateMutation.mutateAsync({ id: editingCategory.id, payload });
          }}
        />
      )}
    </div>
  );
}