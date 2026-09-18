import { useQuery } from "@tanstack/react-query";
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

async function loadDashboardSummary(): Promise<DashboardSummary> {
  const data: unknown = await getDashboardSummary();

  if (!isDashboardSummary(data)) {
    throw new Error(
      "Översikten kunde inte visas eftersom svaret från servern saknar " +
        "uppgifter eller har ett oväntat format."
    );
  }

  return data;
}

async function loadUpcomingPayments(): Promise<UpcomingPayment[]> {
  const data: unknown = await getUpcomingPayments(UPCOMING_DAYS_AHEAD);

  if (!Array.isArray(data) || !data.every(isUpcomingPayment)) {
    throw new Error(
      "Kommande betalningar kunde inte visas eftersom svaret från " +
        "servern har ett oväntat format."
    );
  }

  return data;
}

function initials(firstName?: string, lastName?: string) {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("sv-SE", {
    day: "numeric",
    month: "short",
  }).format(new Date(iso));
}

export function Dashboard() {
  const { user } = useAuth();

  const summaryQuery = useQuery({
    queryKey: ["dashboard-summary", user?.id],
    queryFn: loadDashboardSummary,
    enabled: Boolean(user?.id),
    retry: false,
  });

  const upcomingQuery = useQuery({
    queryKey: ["upcoming-payments", UPCOMING_DAYS_AHEAD, user?.id],
    queryFn: loadUpcomingPayments,
    enabled: Boolean(user?.id),
    retry: false,
  });

  const summary = summaryQuery.data;
  const payments = upcomingQuery.data;

  if (!user?.id) {
    return (
      <p role="alert" className="text-[13px] text-danger">
        Användaruppgifter saknas. Logga ut och logga in igen.
      </p>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">
            {user.firstName ? `Hej, ${user.firstName}! 👋` : "Hej! 👋"}
          </h1>
          <p className="text-[13px] text-text-secondary">
            Här är din översikt idag.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Notiser"
            className="rounded-full p-2 text-text-secondary hover:bg-surface"
          >
            <Bell size={18} />
          </button>

          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-[11px] font-medium text-white">
            {initials(user.firstName, user.lastName)}
          </div>
        </div>
      </div>

      {summaryQuery.isPending ? (
        <div
          aria-label="Laddar översikten"
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
          className="mb-6 rounded-xl border border-danger-soft bg-danger-soft px-4 py-3 text-[13px] text-danger"
        >
          <p>
            Kunde inte visa översikten. Serverns svar behöver kontrolleras
            om felet kvarstår.
          </p>
          <button
            type="button"
            disabled={summaryQuery.isFetching}
            onClick={() => void summaryQuery.refetch()}
            className="mt-2 font-medium underline disabled:opacity-60"
          >
            {summaryQuery.isFetching ? "Hämtar..." : "Försök igen"}
          </button>
        </div>
      ) : summary ? (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="Månadskostnad"
            value={formatCurrency(summary.totalMonthlyCost)}
          />
          <StatCard
            label="Aktiva prenumerationer"
            value={String(summary.activeSubscriptionCount)}
          />
          <StatCard
            label="Avslutade prenumerationer"
            value={String(summary.cancelledSubscriptionCount)}
          />
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="rounded-xl border border-border bg-surface p-5 shadow-card">
          <h2 className="mb-4 text-[13px] font-medium text-text-primary">
            Kostnad per kategori
          </h2>

          {summaryQuery.isPending ? (
            <div className="h-40 animate-pulse rounded-lg bg-background" />
          ) : summaryQuery.isError || !summary ? (
            <p className="text-[13px] text-text-secondary">
              Kostnadsfördelningen är inte tillgänglig just nu.
            </p>
          ) : summary.costByCategory.length > 0 ? (
            <CategoryDonutChart
              data={summary.costByCategory}
              total={summary.totalMonthlyCost}
            />
          ) : (
            <EmptyState
              title="Ingen kostnadsfördelning att visa"
              description="När det finns kostnader per kategori visas de här."
            />
          )}
        </div>

        <div className="rounded-xl border border-border bg-surface p-5 shadow-card">
          <h2 className="mb-4 text-[13px] font-medium text-text-primary">
            Kommande betalningar{" "}
            <span className="font-normal text-text-secondary">
              (nästa {UPCOMING_DAYS_AHEAD} dagar)
            </span>
          </h2>

          {upcomingQuery.isPending ? (
            <div aria-label="Laddar betalningar" className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-10 animate-pulse rounded-lg bg-background"
                />
              ))}
            </div>
          ) : upcomingQuery.isError ? (
            <div role="alert" className="text-[13px] text-danger">
              <p>Kunde inte visa kommande betalningar.</p>
              <button
                type="button"
                disabled={upcomingQuery.isFetching}
                onClick={() => void upcomingQuery.refetch()}
                className="mt-2 font-medium underline disabled:opacity-60"
              >
                {upcomingQuery.isFetching ? "Hämtar..." : "Försök igen"}
              </button>
            </div>
          ) : payments && payments.length > 0 ? (
            <ul className="space-y-3">
              {payments.map((payment) => (
                <li
                  key={`${payment.subscriptionId}-${payment.nextPaymentDate}`}
                  className="flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="text-[13px] text-text-primary">
                      {payment.name}
                    </div>
                    <div className="text-[11px] text-text-secondary">
                      {payment.categoryName} ·{" "}
                      {formatDate(payment.nextPaymentDate)}
                    </div>
                  </div>
                  <div className="shrink-0 text-[13px] font-medium text-text-primary">
                    {formatCurrency(payment.cost)}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="Inget att betala just nu"
              description={`Inga betalningar planerade de kommande ${UPCOMING_DAYS_AHEAD} dagarna.`}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-card">
      <div className="mb-1 text-[12px] text-text-secondary">{label}</div>
      <div className="text-xl font-semibold text-text-primary">{value}</div>
    </div>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <p className="text-[13px] font-medium text-text-primary">{title}</p>
      <p className="mt-1 text-[12px] text-text-secondary">{description}</p>
    </div>
  );
}