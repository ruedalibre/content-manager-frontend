import "./ActivityHeatmap.scss";

type HeatmapData = {
  activity_date: string;
  total_contents: number;
};

type Props = {
  data: HeatmapData[];
};

export default function ActivityHeatmap({
  data,
}: Props) {
  const getIntensity = (
    value: number,
  ) => {
    if (value === 0)
      return "heatmap__cell--0";
    if (value === 1)
      return "heatmap__cell--1";
    if (value <= 3)
      return "heatmap__cell--2";
    return "heatmap__cell--3";
  };

  return (
    <div className="heatmap">
      {data.map((item) => (
        <div
          key={item.activity_date}
          className={`heatmap__cell ${getIntensity(
            item.total_contents,
          )}`}
          title={`${item.activity_date}: ${item.total_contents}`}
        />
      ))}
    </div>
  );
}
