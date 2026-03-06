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
  month: string;
  total_contents: number;
};

type Props = {
  data: GrowthTimelineData[];
};

/* =========================
   HELPERS
========================= */

function detectGranularity(value: string) {
  if (value.includes("W")) return "weekly";
  if (value.length === 10) return "daily";
  return "monthly";
}

function parseWeek(value: string) {
  const [year, week] = value.split("-W").map(Number);
  return year * 100 + week;
}

function formatLabel(value: string, granularity: string) {
  if (granularity === "monthly") {
    const parsedDate = new Date(value + "-01T00:00:00");

    return parsedDate.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  }

  if (granularity === "daily") {
    const parsedDate = new Date(value + "T00:00:00");

    return parsedDate.toLocaleDateString("en-US", {
      weekday: "short",
    });
  }

  if (granularity === "weekly") {
    return value.replace("W", "Week ");
  }

  return value;
}

function formatTooltip(value: string, granularity: string) {
  if (granularity === "monthly") {
    const parsedDate = new Date(value + "-01T00:00:00");

    return parsedDate.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  }

  if (granularity === "daily") {
    const parsedDate = new Date(value + "T00:00:00");

    return parsedDate.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  }

  if (granularity === "weekly") {
    return value.replace("W", "Week ");
  }

  return value;
}

/* =========================
   COMPONENT
========================= */

export default function ContentGrowthTimelineChart({ data }: Props) {
  if (!data || data.length === 0) return null;

  const granularity = detectGranularity(data[0].month);

  /* -------------------------
     SORT DATA CORRECTLY
  ------------------------- */

  const sortedData = [...data].sort((a, b) => {
    if (granularity === "weekly") {
      return parseWeek(a.month) - parseWeek(b.month);
    }

    const dateA = new Date(a.month + "T00:00:00").getTime();
    const dateB = new Date(b.month + "T00:00:00").getTime();

    return dateA - dateB;
  });

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

          <XAxis
            dataKey="rawLabel"
            tickFormatter={(value) =>
              formatLabel(value, granularity)
            }
          />

          <YAxis allowDecimals={false} />

          <Tooltip
            labelFormatter={(value, payload) => {
              if (!payload || !payload[0]) return value;

              const raw = payload[0].payload.rawLabel;

              return formatTooltip(raw, granularity);
            }}
          />

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