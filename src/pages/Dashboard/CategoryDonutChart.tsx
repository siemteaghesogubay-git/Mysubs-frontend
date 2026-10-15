import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { useTranslation } from "react-i18next";
import type { CategorySummary } from "../../types/subscription";

// Diagrammets färger
const COLORS = [
  "#7c3aed",
  "#16a34a",
  "#2563eb",
  "#db2777",
  "#d97706",
];

// Anpassa format efter valt språk
function toLocale(language: string) {
  return language.startsWith("sv") ? "sv-SE" : "en-GB";
}

// Formatera belopp i SEK
function formatCurrency(value: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "SEK",
    maximumFractionDigits: 0,
  }).format(value);
}

type CategoryDonutChartProps = {
  data: CategorySummary[];
  total: number;
};

export function CategoryDonutChart({
  data,
  total,
}: CategoryDonutChartProps) {
  const { t, i18n } = useTranslation();

  const locale = toLocale(
    i18n.resolvedLanguage ?? i18n.language
  );

  return (
    <div className="flex min-w-0 flex-col items-center gap-5 sm:flex-row sm:items-center">

      {/* Donutdiagram */}
      <div
        className="relative h-40 w-40 shrink-0"
        aria-hidden="true"
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="totalMonthlyCost"
              nameKey="categoryName"
              innerRadius={55}
              outerRadius={75}
              paddingAngle={2}
              stroke="none"
              isAnimationActive={true}
            >
              {data.map((category, index) => (
                <Cell
                  key={`${category.categoryName}-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Total månadskostnad */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-2">
          <span className="max-w-full break-words text-center text-sm font-semibold leading-tight text-text-primary">
            {formatCurrency(total, locale)}
          </span>

          <span className="mt-1 text-center text-[11px] text-text-secondary">
            {t("dashboard.perMonth")}
          </span>
        </div>
      </div>

      {/* Kategorilista */}
      <ul className="w-full min-w-0 flex-1 space-y-3">
        {data.map((category, index) => (
          <li
            key={`${category.categoryName}-${index}`}
            className="flex min-w-0 items-start justify-between gap-3 text-xs"
          >
            <span className="flex min-w-0 items-start gap-2 text-text-secondary">
              <span
                aria-hidden="true"
                className="mt-1 h-2 w-2 shrink-0 rounded-full"
                style={{
                  backgroundColor: COLORS[index % COLORS.length],
                }}
              />

              <span className="min-w-0 break-words">
                {category.categoryName}
              </span>
            </span>

            <span className="shrink-0 text-right font-medium text-text-primary">
              {formatCurrency(
                category.totalMonthlyCost,
                locale
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
