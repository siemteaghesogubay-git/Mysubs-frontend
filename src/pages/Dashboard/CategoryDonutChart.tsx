import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import type { CategorySummary } from "../../types/subscription";

const COLORS = ["#7c3aed", "#16a34a", "#2563eb", "#db2777", "#d97706"];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
    maximumFractionDigits: 0,
  }).format(value);
}

export function CategoryDonutChart({ data, total }: { data: CategorySummary[]; total: number }) {
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="relative h-40 w-40 shrink-0">
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
              {data.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-base font-semibold text-text-primary">{formatCurrency(total)}</span>
          <span className="text-[11px] text-text-secondary">per månad</span>
        </div>
      </div>

      <ul className="w-full flex-1 space-y-2">
        {data.map((category, index) => (
          <li key={category.categoryName} className="flex items-center justify-between text-[12px]">
            <span className="flex items-center gap-2 text-text-secondary">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
              {category.categoryName}
            </span>
            <span className="text-text-primary">{formatCurrency(category.totalMonthlyCost)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}