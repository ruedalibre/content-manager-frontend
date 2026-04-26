import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

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
        <LineChart data={formattedData}>
          <CartesianGrid strokeDasharray="3 3" />

          {/* X AXIS */}

          <XAxis
            dataKey="rawLabel"
            tickFormatter={(value) =>
              formatChartLabel(value)
            }
          />

          {/* Y AXIS */}

          <YAxis allowDecimals={false} />

          {/* TOOLTIP */}

          <Tooltip
            labelFormatter={(value, payload) => {
              if (!payload || !payload[0]) return value;

              const raw = payload[0].payload.rawLabel;

              return formatChartTooltip(raw);
            }}
          />

          {/* LINE */}

          <Line
            type="monotone"
            dataKey="total_contents"
            stroke="#2563eb"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}