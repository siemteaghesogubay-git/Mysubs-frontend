import { apiClient } from "./client";

import type {
  ChangePasswordRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from "../types/user";

export interface MessageResponse {
  message: string;
}

export interface VerifyEmailRequest {
  email: string;
  code: string;
}

export interface ResendVerificationCodeRequest {
  email: string;
}

export async function changePassword(payload: ChangePasswordRequest) {
  await apiClient.post("/api/auth/change-password", payload);
}

export async function forgotPassword(payload: ForgotPasswordRequest) {
  const { data } = await apiClient.post<MessageResponse>(
    "/api/auth/forgot-password",
    payload,
  );

  return data;
}

export async function resetPassword(payload: ResetPasswordRequest) {
  const { data } = await apiClient.post<MessageResponse>(
    "/api/auth/reset-password",
    payload,
  );

  return data;
}

export async function verifyEmail(payload: VerifyEmailRequest) {
  const { data } = await apiClient.post<MessageResponse>(
    "/api/auth/verify-email",
    payload,
  );

  return data;
}

export async function resendVerificationCode(
  payload: ResendVerificationCodeRequest,
) {
  const { data } = await apiClient.post<MessageResponse>(
    "/api/auth/resend-verification-code",
    payload,
  );

  return data;
}