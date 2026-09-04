export interface BarDatum {
  label: string;
  value: number;
  color: string;
}

interface Props {
  data: BarDatum[];
}

export default function BarChart({ data }: Props) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="pago-barchart">
      {data.map((d) => (
        <div className="pago-barchart-row" key={d.label}>
          <span className="pago-barchart-label" title={d.label}>
            {d.label}
          </span>
          <div className="pago-barchart-track">
            <div
              className="pago-barchart-fill"
              style={{ width: `${(d.value / max) * 100}%`, backgroundColor: d.color }}
            />
          </div>
          <span className="pago-barchart-value">{d.value.toLocaleString("fr-FR")}</span>
        </div>
      ))}
    </div>
  );
}
