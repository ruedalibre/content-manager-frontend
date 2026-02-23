import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

/* =========================
   TYPES
========================= */

export type GrowthTimelineData = {
  month: string; // "2026-01"
  total_contents: number;
};

type Props = {
  data: GrowthTimelineData[];
};

/* =========================
   COMPONENT
========================= */

export default function ContentGrowthTimelineChart({
  data,
}: Props) {
  /* -------------------------
     FORMAT DATA FOR CHART
     Convert YYYY-MM → Date
  ------------------------- */

  const formattedData = data.map((item) => {
    const parsedDate = new Date(
      item.month + "-01"
    );

    return {
      ...item,

      // Label para eje X
      label: parsedDate.toLocaleDateString(
        "en-US",
        {
          month: "short",
          year: "numeric",
        }
      ),

      // Fecha real por si se usa en tooltip
      fullDate: parsedDate,
    };
  });

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
      <ResponsiveContainer>
        <LineChart data={formattedData}>
          <CartesianGrid
            strokeDasharray="3 3"
          />

          {/* X AXIS */}
          <XAxis dataKey="label" />

          {/* Y AXIS */}
          <YAxis allowDecimals={false} />

          {/* TOOLTIP */}
          <Tooltip
            labelFormatter={(
              value
            ) => `Month: ${value}`}
          />

          {/* LINE */}
          <Line
            type="monotone"
            dataKey="total_contents"
            stroke="#2563eb"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
