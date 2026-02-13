import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

type Data = {
  month: string;
  cumulative_total: number;
};

type Props = {
  data: Data[];
};

export default function ContentGrowthCumulativeChart({
  data,
}: Props) {
  const formattedData = data.map(
    (item) => {
      const parsedDate =
        new Date(item.month + "-01");

      return {
        ...item,
        label:
          parsedDate.toLocaleDateString(
            "en-US",
            {
              month: "short",
              year: "numeric",
            }
          ),
      };
    }
  );

  return (
    <div
      style={{
        width: "100%",
        height: 300,
      }}
    >
      <ResponsiveContainer>
        <LineChart
          data={formattedData}
        >
          <CartesianGrid
            strokeDasharray="3 3"
          />

          <XAxis dataKey="label" />

          <YAxis allowDecimals={false} />

          <Tooltip />

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
