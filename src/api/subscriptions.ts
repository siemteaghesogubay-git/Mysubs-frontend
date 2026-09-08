import { apiClient } from "./client";
import type {
  DashboardSummary, SubscriptionRequest, SubscriptionResponse, UpcomingPayment,
} from "../types/subscription";

export async function getDashboardSummary() {
  const { data } = await apiClient.get<DashboardSummary>("/api/Subscriptions/summary");
  return data;
}

export async function getUpcomingPayments(daysAhead = 7) {
  const { data } = await apiClient.get<UpcomingPayment[]>("/api/Subscriptions/upcoming", {
    params: { daysAhead },
  });
  return data;
}

export async function getSubscriptions() {
  const { data } = await apiClient.get<SubscriptionResponse[]>("/api/Subscriptions");
  return data;
}

export async function createSubscription(payload: SubscriptionRequest) {
  const { data } = await apiClient.post<SubscriptionResponse>("/api/Subscriptions", payload);
  return data;
}

export async function updateSubscription(id: number, payload: SubscriptionRequest) {
  await apiClient.put(`/api/Subscriptions/${id}`, payload);
}

export async function deleteSubscription(id: number) {
  await apiClient.delete(`/api/Subscriptions/${id}`);
}