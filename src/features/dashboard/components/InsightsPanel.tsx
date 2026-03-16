import "./InsightsPanel.scss";

export type Insight = {
  title: string;
  message: string;
};

type Props = {
  data: Insight[];
};

export default function InsightsPanel({
  data,
}: Props) {
  if (!data.length) {
    return <p>No insights available</p>;
  }

  return (
    <div className="insights">
      {data.map((insight, index) => (
        <div
          key={index}
          className="insight-card"
        >
          <h4>{insight.title}</h4>

          <p>{insight.message}</p>
        </div>
      ))}
    </div>
  );
}
