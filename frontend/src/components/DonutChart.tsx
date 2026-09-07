export interface DonutDatum {
  label: string;
  value: number;
  color: string;
}

interface Props {
  data: DonutDatum[];
}

export default function DonutChart({ data }: Props) {
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1;

  const stops = data.reduce<{ cursor: number; segments: string[] }>(
    (acc, d) => {
      const start = (acc.cursor / total) * 100;
      const cursor = acc.cursor + d.value;
      const end = (cursor / total) * 100;
      return { cursor, segments: [...acc.segments, `${d.color} ${start}% ${end}%`] };
    },
    { cursor: 0, segments: [] },
  ).segments;

  return (
    <div className="pago-donut">
      <div className="pago-donut-ring" style={{ background: `conic-gradient(${stops.join(", ")})` }}>
        <div className="pago-donut-hole">
          <span className="pago-donut-total">{total.toLocaleString("fr-FR")}</span>
        </div>
      </div>
      <div className="pago-donut-legend">
        {data.map((d) => (
          <div className="pago-donut-legend-row" key={d.label}>
            <span className="pago-donut-swatch" style={{ backgroundColor: d.color }} />
            <span className="pago-donut-legend-label">{d.label}</span>
            <span className="pago-donut-legend-value">
              {d.value.toLocaleString("fr-FR")} ({((d.value / total) * 100).toFixed(0)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
