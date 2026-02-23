import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type DataItem = {
  platform_name: string;
  total_contents: number;
};

export default function ContentsByPlatformChart({
  data,
}: {
  data: DataItem[];
}) {
  return (
    <div style={{ width: "100%", height: 300 }}>

      <ResponsiveContainer>

        <BarChart data={data}>

          <XAxis dataKey="platform_name" />

          <YAxis />

          <Tooltip />

          <Bar
            dataKey="total_contents"
            radius={[6, 6, 0, 0]}
          />

        </BarChart>

      </ResponsiveContainer>

    </div>
  );
}
