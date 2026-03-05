import { useMemo, useState } from "react";
import "./ActivityHeatmap.scss";

/* =========================
   TYPES
========================= */

type HeatmapData = {
  activity_date: string;
  total_contents: number;
};

type Props = {
  data: HeatmapData[];
};

/* =========================
   COMPONENT
========================= */

export default function ActivityHeatmap({ data }: Props) {
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    value: number;
    date: string;
  } | null>(null);

  /* =========================
     YEARS
  ========================= */

  const years = useMemo(() => {
    const set = new Set(
      data.map((d) => new Date(d.activity_date).getFullYear()),
    );

    return Array.from(set).sort((a, b) => b - a);
  }, [data]);

  const [selectedYear, setSelectedYear] = useState<number>(
    years[0] ?? new Date().getFullYear(),
  );

  /* =========================
     FILTER YEAR
  ========================= */

  const yearData = useMemo(() => {
    return data.filter(
      (d) => new Date(d.activity_date).getFullYear() === selectedYear,
    );
  }, [data, selectedYear]);

  /* =========================
     MAP DATE → VALUE
  ========================= */

  const activityMap = useMemo(() => {
    const map = new Map<string, number>();

    yearData.forEach((d) => {
      map.set(d.activity_date, d.total_contents);
    });

    return map;
  }, [yearData]);

  /* =========================
     BUILD CALENDAR
========================= */

  const days = useMemo(() => {
    const startOfYear = new Date(selectedYear, 0, 1);

    const endOfYear = new Date(selectedYear, 11, 31);

    const start = new Date(startOfYear);
    const end = new Date(endOfYear);

    const startDay = start.getDay() || 7;
    start.setDate(start.getDate() - (startDay - 1));

    const endDay = end.getDay() || 7;
    end.setDate(end.getDate() + (7 - endDay));

    const arr: Date[] = [];

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      arr.push(new Date(d));
    }

    return arr;
  }, [selectedYear]);

  const totalWeeks = Math.ceil(days.length / 7);

  /* =========================
     MONTH LABELS
========================= */

  const monthLabels = useMemo(() => {
    const labels: { month: string; column: number }[] = [];

    const gridStart = days[0];

    for (let m = 0; m < 12; m++) {
      const firstDay = new Date(selectedYear, m, 1);

      const diff =
        (firstDay.getTime() - gridStart.getTime()) / (1000 * 60 * 60 * 24);

      const weekIndex = Math.round(diff / 7);

      labels.push({
        month: firstDay.toLocaleString("default", {
          month: "short",
        }),
        column: Math.max(weekIndex, 0),
      });
    }

    return labels;
  }, [days, selectedYear]);

  /* =========================
     INTENSITY
========================= */

  const getIntensity = (value: number) => {
    if (!value) return "heatmap__cell--0";
    if (value === 1) return "heatmap__cell--1";
    if (value <= 3) return "heatmap__cell--2";
    return "heatmap__cell--3";
  };

  /* =========================
     RENDER
========================= */

  return (
    <div className="heatmap-wrapper">
      {/* YEAR SELECTOR */}

      <div className="heatmap__years">
        {years.map((year) => (
          <button
            key={year}
            className={year === selectedYear ? "active" : ""}
            onClick={() => setSelectedYear(year)}
          >
            {year}
          </button>
        ))}
      </div>

      {/* MONTH LABELS */}

      <div
        className="heatmap__months"
        style={{
          gridTemplateColumns: `repeat(${totalWeeks}, 16px)`,
          width: `${totalWeeks * 16 + (totalWeeks - 1) * 4}px`,
        }}
      >
        {monthLabels.map((m, i) => (
          <span
            key={i}
            style={{
              gridColumnStart: m.column + 1,
            }}
          >
            {m.month}
          </span>
        ))}
      </div>

      <div className="heatmap">
        {/* WEEKDAY LABELS */}

        <div className="heatmap__weekdays">
          <span style={{ gridRow: 1 }}>Mon</span>
          <span style={{ gridRow: 3 }}>Wed</span>
          <span style={{ gridRow: 5 }}>Fri</span>
          <span style={{ gridRow: 7 }}>Sun</span>
        </div>

        {/* GRID */}

        <div
          className="heatmap__grid"
          style={{
            gridTemplateColumns: `repeat(${totalWeeks}, 16px)`,
            width: `${totalWeeks * 16 + (totalWeeks - 1) * 4}px`,
          }}
        >
          {days.map((date) => {
            const key = date.toISOString().slice(0, 10);

            const value = activityMap.get(key) ?? 0;

            const isCurrentYear = date.getFullYear() === selectedYear;

            return (
              <div
                key={key}
                className={`heatmap__cell ${getIntensity(value)} ${
                  !isCurrentYear ? "heatmap__cell--outside" : ""
                }`}
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();

                  setTooltip({
                    x: rect.left + rect.width / 2,
                    y: rect.top,
                    value,
                    date: key,
                  });
                }}
                onMouseLeave={() => setTooltip(null)}
              />
            );
          })}
        </div>
      </div>
      
      {tooltip && (
        <div
          className="heatmap__tooltip"
          style={{
            left: tooltip.x,
            top: tooltip.y,
          }}
        >
          <strong>{tooltip.value}</strong> publication
          {tooltip.value !== 1 ? "s" : ""} on{" "}
          {new Date(tooltip.date).toLocaleDateString()}
        </div>
      )}
    </div>
  );
}
