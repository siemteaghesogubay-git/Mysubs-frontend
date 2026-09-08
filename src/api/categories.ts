import { apiClient } from "./client";
import type { CategoryRequest, CategoryResponse } from "../types/category";

export async function getCategories() {
  const { data } = await apiClient.get<CategoryResponse[]>("/api/Categories");
  return data;
}

export async function createCategory(payload: CategoryRequest) {
  const { data } = await apiClient.post<CategoryResponse>("/api/Categories", payload);
  return data;
}

export async function updateCategory(id: number, payload: CategoryRequest) {
  await apiClient.put(`/api/Categories/${id}`, payload);
}

export async function deleteCategory(id: number) {
  await apiClient.delete(`/api/Categories/${id}`);
}