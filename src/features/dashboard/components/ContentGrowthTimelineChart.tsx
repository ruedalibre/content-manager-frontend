import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useTranslation } from "react-i18next";

import {
  sortChartData,
  formatChartLabel,
  formatChartTooltip,
} from "../../../utils/chartDate.ts";

/* =========================
   TYPES
========================= */

export type GrowthTimelineData = {
  month: string;
  total_contents: number;
};

type Props = {
  data: GrowthTimelineData[];
};

/* =========================
   COMPONENT
========================= */

export default function ContentGrowthTimelineChart({ data }: Props) {
  const { t } = useTranslation();

  if (!data || data.length === 0) return null;

  /* -------------------------
     SORT DATA USING HELPER
  ------------------------- */

  const sortedData = sortChartData(data);

  /* -------------------------
     FORMAT DATA
  ------------------------- */

  const formattedData = sortedData.map((item) => ({
    ...item,
    rawLabel: item.month,
  }));

  /* =========================
     RENDER
  ========================= */

  return (
    <div
      style={{
        width: "100%",
        height: 300,
      }}
    >
      <ResponsiveContainer width="100%" height={350}>
        <LineChart
          data={formattedData}
          margin={{ top: 8, right: 8, bottom: 24, left: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            vertical={false}
          />

          {/* X AXIS */}

          <XAxis
            dataKey="rawLabel"
            tickFormatter={(value) => formatChartLabel(value)}
            tick={{ fontSize: 12, fill: "var(--text-muted)", fontFamily: "var(--font-sans)" }}
            axisLine={false}
            tickLine={false}
          />

          {/* Y AXIS */}

          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 12, fill: "var(--text-faint)", fontFamily: "var(--font-sans)" }}
            axisLine={false}
            tickLine={false}
            width={28}
          />

          {/* TOOLTIP */}

          <Tooltip
            labelFormatter={(value, payload) => {
              if (!payload || !payload[0]) return value;

              const raw = payload[0].payload.rawLabel;

              return formatChartTooltip(raw);
            }}
            formatter={(value: number | undefined) => [value ?? 0, t("activity.chartContents")]}
            contentStyle={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-3)",
              fontSize: "12px",
              fontFamily: "var(--font-sans)",
              color: "var(--text)",
              boxShadow: "var(--shadow-md)",
            }}
          />

          {/* LINE */}

          <Line
            type="monotone"
            dataKey="total_contents"
            stroke="var(--primary)"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}