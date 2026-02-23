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

export default function ActivityHeatmap({
  data,
}: Props) {
  /* =========================
     YEARS
  ========================= */

  const years = useMemo(() => {
    const set = new Set(
      data.map((d) =>
        new Date(d.activity_date).getFullYear(),
      ),
    );

    return Array.from(set).sort(
      (a, b) => b - a,
    );
  }, [data]);

  const [selectedYear, setSelectedYear] =
    useState<number>(
      years[0] ?? new Date().getFullYear(),
    );

  /* =========================
     FILTER YEAR
  ========================= */

  const yearData = useMemo(() => {
    return data.filter(
      (d) =>
        new Date(
          d.activity_date,
        ).getFullYear() === selectedYear,
    );
  }, [data, selectedYear]);

  /* =========================
     MAP DATE → VALUE
  ========================= */

  const activityMap = useMemo(() => {
    const map = new Map<string, number>();

    yearData.forEach((d) => {
      map.set(
        d.activity_date,
        d.total_contents,
      );
    });

    return map;
  }, [yearData]);

  /* =========================
     BUILD CALENDAR
  ========================= */

  const days = useMemo(() => {
    const start = new Date(
      `${selectedYear}-01-01`,
    );

    const end = new Date(
      `${selectedYear}-12-31`,
    );

    const arr: Date[] = [];

    for (
      let d = new Date(start);
      d <= end;
      d.setDate(d.getDate() + 1)
    ) {
      arr.push(new Date(d));
    }

    return arr;
  }, [selectedYear]);

  /* =========================
     MONTH LABELS
  ========================= */

  const monthLabels = useMemo(() => {
    const labels: {
      month: string;
      column: number;
    }[] = [];

    days.forEach((date, index) => {
      if (date.getDate() === 1) {
        const weekIndex = Math.floor(
          index / 7,
        );

        labels.push({
          month: date.toLocaleString(
            "default",
            { month: "short" },
          ),
          column: weekIndex,
        });
      }
    });

    return labels;
  }, [days]);

  /* =========================
     INTENSITY
  ========================= */

  const getIntensity = (
    value: number,
  ) => {
    if (!value) return "heatmap__cell--0";
    if (value === 1)
      return "heatmap__cell--1";
    if (value <= 3)
      return "heatmap__cell--2";
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
            className={
              year === selectedYear
                ? "active"
                : ""
            }
            onClick={() =>
              setSelectedYear(year)
            }
          >
            {year}
          </button>
        ))}
      </div>

      {/* MONTH LABELS */}

      <div className="heatmap__months">
        {monthLabels.map((m, i) => (
          <span
            key={i}
            style={{
              gridColumn: m.column + 1,
            }}
          >
            {m.month}
          </span>
        ))}
      </div>

      <div className="heatmap">
        {/* WEEKDAY LABELS */}

        <div className="heatmap__weekdays">
          <span>Mon</span>
          <span>Wed</span>
          <span>Fri</span>
        </div>

        {/* GRID */}

        <div className="heatmap__grid">
          {days.map((date) => {
            const key = date
              .toISOString()
              .slice(0, 10);

            const value =
              activityMap.get(key) ?? 0;

            return (
              <div
                key={key}
                className={`heatmap__cell ${getIntensity(
                  value,
                )}`}
                title={`${key}: ${value}`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}