import { apiClient } from "./client";
import type { UpdateProfileRequest, UserProfile } from "../types/user";

export async function getMyProfile() {
  const { data } = await apiClient.get<UserProfile>("/api/Users/me");
  return data;
}

export async function updateMyProfile(payload: UpdateProfileRequest) {
  await apiClient.put("/api/Users/me", payload);
}

export async function deleteMyAccount() {
  const { data } = await apiClient.delete<{ message: string }>("/api/Users/me");
  return data;
}

export async function getAllUsers() {
  const { data } = await apiClient.get<UserProfile[]>("/api/Users");
  return data;
}

export async function deleteUser(id: string) {
  await apiClient.delete(`/api/Users/${id}`);
}