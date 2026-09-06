import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { getDashboardSummary, getUpcomingPayments } from "../../api/subscriptions";
import { CategoryDonutChart } from "./CategoryDonutChart";

const UPCOMING_DAYS_AHEAD = 7;

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
  return new Intl.DateTimeFormat("sv-SE", { day: "numeric", month: "short" }).format(new Date(iso));
}

export function Dashboard() {
  const { user } = useAuth();

  const summaryQuery = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: getDashboardSummary,
  });

  const upcomingQuery = useQuery({
    queryKey: ["upcoming-payments", UPCOMING_DAYS_AHEAD],
    queryFn: () => getUpcomingPayments(UPCOMING_DAYS_AHEAD),
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">Hej, {user?.firstName}! 👋</h1>
          <p className="text-[13px] text-text-secondary">Här är din översikt idag.</p>
        </div>
        <div className="flex items-center gap-3">
          <button aria-label="Notiser" className="rounded-full p-2 text-text-secondary hover:bg-surface">
            <Bell size={18} />
          </button>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-[11px] font-medium text-white">
            {initials(user?.firstName, user?.lastName)}
          </div>
        </div>
      </div>

      {summaryQuery.isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl border border-border bg-surface" />
          ))}
        </div>
      ) : summaryQuery.isError ? (
        <div className="rounded-xl border border-danger-soft bg-danger-soft px-4 py-3 text-[13px] text-danger">
          Kunde inte hämta översikten. Försök ladda om sidan.
        </div>
      ) : summaryQuery.data ? (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Månadskostnad" value={formatCurrency(summaryQuery.data.totalMonthlyCost)} />
            <StatCard label="Aktiva prenumerationer" value={summaryQuery.data.activeSubscriptionCount.toString()} />
            <StatCard label="Avslutade prenumerationer" value={summaryQuery.data.cancelledSubscriptionCount.toString()} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_1fr]">
            <div className="rounded-xl border border-border bg-surface p-5 shadow-card">
              <h2 className="mb-4 text-[13px] font-medium text-text-primary">Kostnad per kategori</h2>
              {summaryQuery.data.costByCategory.length > 0 ? (
                <CategoryDonutChart data={summaryQuery.data.costByCategory} total={summaryQuery.data.totalMonthlyCost} />
              ) : (
                <EmptyState
                  title="Inga prenumerationer än"
                  description="Lägg till din första prenumeration för att se kostnadsfördelningen per kategori."
                />
              )}
            </div>

            <div className="rounded-xl border border-border bg-surface p-5 shadow-card">
              <h2 className="mb-4 text-[13px] font-medium text-text-primary">
                Kommande betalningar{" "}
                <span className="font-normal text-text-secondary">(nästa {UPCOMING_DAYS_AHEAD} dagar)</span>
              </h2>

              {upcomingQuery.isLoading ? (
                <div className="space-y-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-10 animate-pulse rounded-lg bg-background" />
                  ))}
                </div>
              ) : upcomingQuery.isError ? (
                <p className="text-[13px] text-danger">Kunde inte hämta kommande betalningar.</p>
              ) : upcomingQuery.data && upcomingQuery.data.length > 0 ? (
                <ul className="space-y-3">
                  {upcomingQuery.data.map((payment) => (
                    <li key={payment.subscriptionId} className="flex items-center justify-between">
                      <div>
                        <div className="text-[13px] text-text-primary">{payment.name}</div>
                        <div className="text-[11px] text-text-secondary">
                          {payment.categoryName} · {formatDate(payment.nextPaymentDate)}
                        </div>
                      </div>
                      <div className="text-[13px] font-medium text-text-primary">{formatCurrency(payment.cost)}</div>
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
        </>
      ) : null}
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

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <p className="text-[13px] font-medium text-text-primary">{title}</p>
      <p className="mt-1 text-[12px] text-text-secondary">{description}</p>
    </div>
  );
}