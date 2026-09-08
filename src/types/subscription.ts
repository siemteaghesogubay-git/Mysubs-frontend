export const BILLING_INTERVAL = { Monthly: 0, Yearly: 1 } as const;
export type BillingInterval = (typeof BILLING_INTERVAL)[keyof typeof BILLING_INTERVAL];

export const BILLING_INTERVAL_LABELS: Record<BillingInterval, string> = {
  [BILLING_INTERVAL.Monthly]: "Per månad",
  [BILLING_INTERVAL.Yearly]: "Per år",
};

export interface SubscriptionResponse {
  id: number;
  name: string;
  cost: number;
  interval: BillingInterval;
  startDate: string;
  cancelledDate: string | null;
  categoryId: number;
  categoryName: string;
}

export interface SubscriptionRequest {
  name: string;
  cost: number;
  interval: BillingInterval;
  startDate: string;
  categoryId: number;
  cancelledDate?: string | null;
}

export interface CategorySummary {
  categoryName: string;
  totalMonthlyCost: number;
  subscriptionCount: number;
}

export interface DashboardSummary {
  totalMonthlyCost: number;
  activeSubscriptionCount: number;
  cancelledSubscriptionCount: number;
  costByCategory: CategorySummary[];
}

export interface UpcomingPayment {
  subscriptionId: number;
  name: string;
  cost: number;
  nextPaymentDate: string;
  categoryName: string;
}