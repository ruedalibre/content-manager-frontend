import "./InsightsPanel.scss";

export type Insight = {
  title: string;
  insight: string;
  strategy: string;
  action: string;
  confidence: number;
};

type Props = {
  data: Insight[];
};

export default function InsightsPanel({ data }: Props) {
  if (!data.length) {
    return <p>No insights available</p>;
  }

  return (
    <div className="insights">
      {data.map((insight, index) => (
        <div key={index} className="insight-card">
          <h4>{insight.title}</h4>

          <p>{insight.insight}</p>

          <p className="insight-strategy">{insight.strategy}</p>

          <p className="insight-action">{insight.action}</p>

          <span className="confidence">
            Confidence: {(insight.confidence * 100).toFixed(0)}%
          </span>
        </div>
      ))}
    </div>
  );
}
