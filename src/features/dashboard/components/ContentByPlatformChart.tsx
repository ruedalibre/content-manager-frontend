import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from "recharts"

type DataItem = {
  platform_name: string
  total_contents: number
}

export default function ContentsByPlatformChart({
  data,
}: {
  data: DataItem[]
}) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        margin={{ top: 8, right: 8, bottom: 24, left: 0 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--border)"
          vertical={false}
        />
        <XAxis
          dataKey="platform_name"
          tick={{ fontSize: 12, fill: "var(--text-muted)",
            fontFamily: "var(--font-sans)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 12, fill: "var(--text-faint)",
            fontFamily: "var(--font-sans)" }}
          axisLine={false}
          tickLine={false}
          width={28}
        />
        <Tooltip
          contentStyle={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-3)",
            fontSize: "12px",
            fontFamily: "var(--font-sans)",
            color: "var(--text)",
            boxShadow: "var(--shadow-md)",
          }}
          cursor={{ fill: "var(--bg-muted)" }}
        />
        <Bar
          dataKey="total_contents"
          fill="var(--accent)"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
