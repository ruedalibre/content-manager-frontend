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

type Data = {
  month: string;
  cumulative_total: number;
};

type Props = {
  data: Data[];
};

export default function ContentGrowthCumulativeChart({ data }: Props) {
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
            tickFormatter={(value) => formatChartLabel(value)}
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
            formatter={(value: number | undefined) => [value ?? 0, t("activity.chartCumulative")]}
          />

          {/* LINE */}

          <Line
            type="monotone"
            dataKey="cumulative_total"
            stroke="#16a34a"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}