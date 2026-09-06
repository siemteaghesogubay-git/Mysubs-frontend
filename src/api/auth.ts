import { apiClient } from "./client";
import type { ChangePasswordRequest, ForgotPasswordRequest, ResetPasswordRequest } from "../types/user";

export async function changePassword(payload: ChangePasswordRequest) {
  await apiClient.post("/api/auth/change-password", payload);
}

export async function forgotPassword(payload: ForgotPasswordRequest) {
  const { data } = await apiClient.post<{ message: string; devToken?: string }>(
    "/api/auth/forgot-password",
    payload
  );
  return data;
}

export async function resetPassword(payload: ResetPasswordRequest) {
  const { data } = await apiClient.post<{ message: string }>("/api/auth/reset-password", payload);
  return data;
}