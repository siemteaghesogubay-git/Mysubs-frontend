
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Bell } from "lucide-react";

import { useAuth } from "../../contexts/AuthContext";

import {
  getDashboardSummary,
  getUpcomingPayments,
} from "../../api/subscriptions";

import type {
  DashboardSummary,
  UpcomingPayment,
} from "../../types/subscription";

import { CategoryDonutChart } from "./CategoryDonutChart";

const UPCOMING_DAYS_AHEAD = 7;

// -----------------------------
// Validering av API-data
// -----------------------------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isCount(value: unknown): value is number {
  return isFiniteNumber(value) && Number.isInteger(value) && value >= 0;
}

function isDashboardSummary(value: unknown): value is DashboardSummary {
  if (!isRecord(value)) return false;

  return (
    isFiniteNumber(value.totalMonthlyCost) &&
    isCount(value.activeSubscriptionCount) &&
    isCount(value.cancelledSubscriptionCount) &&
    Array.isArray(value.costByCategory) &&
    value.costByCategory.every(
      (category: unknown) =>
        isRecord(category) &&
        typeof category.categoryName === "string" &&
        isFiniteNumber(category.totalMonthlyCost) &&
        isCount(category.subscriptionCount)
    )
  );
}

function isUpcomingPayment(value: unknown): value is UpcomingPayment {
  return (
    isRecord(value) &&
    isFiniteNumber(value.subscriptionId) &&
    typeof value.name === "string" &&
    isFiniteNumber(value.cost) &&
    typeof value.categoryName === "string" &&
    typeof value.nextPaymentDate === "string" &&
    Number.isFinite(Date.parse(value.nextPaymentDate))
  );
}

// -----------------------------
// API-anrop
// -----------------------------

async function loadDashboardSummary(): Promise<DashboardSummary> {
  const data: unknown = await getDashboardSummary();

  if (!isDashboardSummary(data)) {
    throw new Error("Invalid dashboard summary response");
  }

  return data;
}

async function loadUpcomingPayments(): Promise<UpcomingPayment[]> {
  const data: unknown = await getUpcomingPayments(UPCOMING_DAYS_AHEAD);

  if (!Array.isArray(data) || !data.every(isUpcomingPayment)) {
    throw new Error("Invalid upcoming payments response");
  }

  return data;
}

// -----------------------------
// Hjälpfunktioner
// -----------------------------

function initials(firstName?: string, lastName?: string) {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();
}

function getLocale(language: string) {
  return language.startsWith("sv") ? "sv-SE" : "en-GB";
}

function formatCurrency(value: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "SEK",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(iso: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
  }).format(new Date(iso));
}

// -----------------------------
// Dashboard
// -----------------------------

export function Dashboard() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();

  const locale = getLocale(
    i18n.resolvedLanguage ?? i18n.language
  );

  const summaryQuery = useQuery({
    queryKey: ["dashboard-summary", user?.id],
    queryFn: loadDashboardSummary,
    enabled: Boolean(user?.id),
    retry: false,
  });

  const upcomingQuery = useQuery({
    queryKey: [
      "upcoming-payments",
      UPCOMING_DAYS_AHEAD,
      user?.id,
    ],
    queryFn: loadUpcomingPayments,
    enabled: Boolean(user?.id),
    retry: false,
  });

  const summary = summaryQuery.data;
  const payments = upcomingQuery.data;

  if (!user?.id) {
    return (
      <p role="alert" className="text-sm text-danger">
        {t("dashboard.missingUser")}
      </p>
    );
  }

  return (
    <div className="min-w-0">
      {/* Sidhuvud */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold text-text-primary sm:text-xl">
            {user.firstName
              ? t("dashboard.greeting", {
                  name: user.firstName,
                })
              : t("dashboard.greetingNoName")}
          </h1>

          <p className="mt-1 text-sm text-text-secondary">
            {t("dashboard.subtitle")}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            aria-label={t("dashboard.notifications")}
            className="flex h-10 w-10 items-center justify-center rounded-full text-text-secondary hover:bg-surface"
          >
            <Bell size={18} aria-hidden="true" />
          </button>

          <div
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-medium text-white"
          >
            {initials(user.firstName, user.lastName)}
          </div>
        </div>
      </div>

      {/* Statistikkort */}
      {summaryQuery.isPending ? (
        <div
          aria-label={t("dashboard.loadingSummary")}
          className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3"
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-xl border border-border bg-surface"
            />
          ))}
        </div>
      ) : summaryQuery.isError ? (
        <div
          role="alert"
          className="mb-6 rounded-xl border border-danger-soft bg-danger-soft px-4 py-3 text-sm text-danger"
        >
          <p>{t("dashboard.summaryError")}</p>

          <button
            type="button"
            disabled={summaryQuery.isFetching}
            onClick={() => void summaryQuery.refetch()}
            className="mt-2 min-h-11 font-medium underline disabled:opacity-60"
          >
            {summaryQuery.isFetching
              ? t("common.fetching")
              : t("common.retry")}
          </button>
        </div>
      ) : summary ? (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label={t("dashboard.monthlyCost")}
            value={formatCurrency(
              summary.totalMonthlyCost,
              locale
            )}
          />

          <StatCard
            label={t("dashboard.active")}
            value={String(summary.activeSubscriptionCount)}
          />

          <StatCard
            label={t("dashboard.cancelled")}
            value={String(summary.cancelledSubscriptionCount)}
          />
        </div>
      ) : null}

      {/* Diagram och kommande betalningar */}
      <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        {/* Kostnad per kategori */}
        <section className="min-w-0 rounded-xl border border-border bg-surface p-4 shadow-card sm:p-5">
          <h2 className="mb-4 text-sm font-medium text-text-primary">
            {t("dashboard.costByCategory")}
          </h2>

          {summaryQuery.isPending ? (
            <div className="h-40 animate-pulse rounded-lg bg-background" />
          ) : summaryQuery.isError || !summary ? (
            <p className="text-sm text-text-secondary">
              {t("dashboard.costByCategoryUnavailable")}
            </p>
          ) : summary.costByCategory.length > 0 ? (
            <CategoryDonutChart
              data={summary.costByCategory}
              total={summary.totalMonthlyCost}
            />
          ) : (
            <EmptyState
              title={t("dashboard.noCategoryCostTitle")}
              description={t("dashboard.noCategoryCostDescription")}
            />
          )}
        </section>

        {/* Kommande betalningar */}
        <section className="min-w-0 rounded-xl border border-border bg-surface p-4 shadow-card sm:p-5">
          <h2 className="mb-4 text-sm font-medium text-text-primary">
            {t("dashboard.upcoming")}{" "}
            <span className="font-normal text-text-secondary">
              {t("dashboard.nextDays", {
                days: UPCOMING_DAYS_AHEAD,
              })}
            </span>
          </h2>

          {upcomingQuery.isPending ? (
            <div
              aria-label={t("dashboard.loadingPayments")}
              className="space-y-3"
            >
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-10 animate-pulse rounded-lg bg-background"
                />
              ))}
            </div>
          ) : upcomingQuery.isError ? (
            <div role="alert" className="text-sm text-danger">
              <p>{t("dashboard.paymentsError")}</p>

              <button
                type="button"
                disabled={upcomingQuery.isFetching}
                onClick={() => void upcomingQuery.refetch()}
                className="mt-2 min-h-11 font-medium underline disabled:opacity-60"
              >
                {upcomingQuery.isFetching
                  ? t("common.fetching")
                  : t("common.retry")}
              </button>
            </div>
          ) : payments && payments.length > 0 ? (
            <ul className="space-y-3">
              {payments.map((payment) => (
                <li
                  key={`${payment.subscriptionId}-${payment.nextPaymentDate}`}
                  className="flex min-w-0 items-start justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="break-words text-sm font-medium text-text-primary">
                      {payment.name}
                    </div>

                    <div className="mt-1 break-words text-xs text-text-secondary">
                      {payment.categoryName} ·{" "}
                      {formatDate(
                        payment.nextPaymentDate,
                        locale
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 text-right text-sm font-medium text-text-primary">
                    {formatCurrency(payment.cost, locale)}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title={t("dashboard.noPaymentsTitle")}
              description={t("dashboard.noPaymentsDescription", {
                days: UPCOMING_DAYS_AHEAD,
              })}
            />
          )}
        </section>
      </div>
    </div>
  );
}

// -----------------------------
// Statistikkort
// -----------------------------

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-border bg-surface p-4 shadow-card">
      <div className="mb-1 text-sm text-text-secondary">
        {label}
      </div>

      <div className="break-words text-xl font-semibold text-text-primary">
        {value}
      </div>
    </div>
  );
}

// -----------------------------
// Tomt tillstånd
// -----------------------------

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <p className="text-sm font-medium text-text-primary">
        {title}
      </p>

      <p className="mt-1 text-xs text-text-secondary">
        {description}
      </p>
    </div>
  );
}
