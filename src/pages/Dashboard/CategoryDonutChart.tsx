import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import {
  ShoppingCart,
  House,
  Car,
  HeartPulse,
  Clapperboard,
  Utensils,
  Zap,
  Smartphone,
  GraduationCap,
  Briefcase,
  CreditCard,
  CircleDollarSign,
  Package,
  Plane,
  PawPrint,
  Dumbbell,
  Sparkles,
  Tag,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { CategorySummary } from "../../types/subscription";

const COLORS = [
  "#7c3aed",
  "#16a34a",
  "#2563eb",
  "#db2777",
  "#d97706",
  "#0891b2",
  "#4f46e5",
  "#65a30d",
];

const CATEGORY_ICONS: Array<{
  keywords: string[];
  icon: LucideIcon;
}> = [
  {
    keywords: ["food", "mat", "grocery", "livsmedel"],
    icon: Utensils,
  },
  {
    keywords: ["home", "hem", "rent", "hyra", "housing", "boende"],
    icon: House,
  },
  {
    keywords: ["transport", "car", "bil", "fuel", "bränsle"],
    icon: Car,
  },
  {
    keywords: ["health", "hälsa", "medical", "vård", "fitness"],
    icon: HeartPulse,
  },
  {
    keywords: ["entertainment", "underhållning", "movie", "film"],
    icon: Clapperboard,
  },
  {
    keywords: ["shopping", "clothes", "kläder", "fashion"],
    icon: ShoppingCart,
  },
  {
    keywords: ["electricity", "el", "energy", "energi"],
    icon: Zap,
  },
  {
    keywords: ["phone", "mobile", "telefon", "mobil", "internet"],
    icon: Smartphone,
  },
  {
    keywords: ["education", "utbildning", "school", "skola"],
    icon: GraduationCap,
  },
  {
    keywords: ["work", "arbete", "business", "företag"],
    icon: Briefcase,
  },
  {
    keywords: ["subscription", "prenumeration", "membership", "medlemskap"],
    icon: CreditCard,
  },
  {
    keywords: ["travel", "resa", "flight", "flyg", "vacation", "semester"],
    icon: Plane,
  },
  {
    keywords: ["pet", "pets", "djur", "husdjur"],
    icon: PawPrint,
  },
  {
    keywords: ["sport", "gym", "träning", "exercise"],
    icon: Dumbbell,
  },
  {
    keywords: ["beauty", "skönhet", "self-care", "hudvård"],
    icon: Sparkles,
  },
  {
    keywords: ["package", "delivery", "leverans", "frakt"],
    icon: Package,
  },
  {
    keywords: ["tax", "skatt", "fee", "avgift", "bank"],
    icon: CircleDollarSign,
  },
];

function getCategoryIcon(categoryName: string): LucideIcon {
  const normalizedName = categoryName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase();

  const match = CATEGORY_ICONS.find(({ keywords }) =>
    keywords.some((keyword) => {
      const normalizedKeyword = keyword
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLocaleLowerCase();

      return normalizedName.includes(normalizedKeyword);
    }),
  );

  return match?.icon ?? Tag;
}

function toLocale(language: string) {
  return language.startsWith("sv") ? "sv-SE" : "en-GB";
}

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
    i18n.resolvedLanguage ?? i18n.language,
  );

  return (
    <div className="flex min-w-0 flex-col items-center gap-5 sm:flex-row sm:items-center">
      {/* Diagrammet är dekorativt. */}
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

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-center text-sm font-semibold text-text-primary">
            {formatCurrency(total, locale)}
          </span>

          <span className="text-center text-[11px] text-text-secondary">
            {t("dashboard.perMonth")}
          </span>
        </div>
      </div>

      {/* Kategorier med ikoner och belopp */}
      <ul className="w-full min-w-0 flex-1 space-y-3">
        {data.map((category, index) => {
          const Icon = getCategoryIcon(category.categoryName);
          const color = COLORS[index % COLORS.length];

          return (
            <li
              key={`${category.categoryName}-${index}`}
              className="flex min-w-0 items-center justify-between gap-3 text-xs"
            >
              <span className="flex min-w-0 items-center gap-2 text-text-secondary">
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                  style={{
                    backgroundColor: `${color}18`,
                    color,
                  }}
                  aria-hidden="true"
                >
                  <Icon size={15} strokeWidth={2} />
                </span>

                <span className="min-w-0 break-words">
                  {category.categoryName}
                </span>
              </span>

              <span className="shrink-0 text-right font-medium text-text-primary">
                {formatCurrency(
                  category.totalMonthlyCost,
                  locale,
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
