"use client";

import { useState } from "react";

type Bucket = { label: string; created: number; completed: number };

const SERIES = [
  { key: "created", label: "Dibuat", color: "var(--chart-1)" },
  { key: "completed", label: "Diselesaikan", color: "var(--chart-2)" },
] as const;

const HEIGHT = 180;
const PAD = { top: 12, right: 8, bottom: 26, left: 30 };
const BAR = 12;
const GAP = 2; // celah permukaan antar batang berdampingan

/** Batang berkelompok: tugas dibuat vs diselesaikan per minggu (satu sumbu, hover tooltip, tabel). */
export default function TrendChart({ data }: { data: Bucket[] }) {
  const [hover, setHover] = useState<{ index: number; key: (typeof SERIES)[number]["key"] } | null>(null);
  const [asTable, setAsTable] = useState(false);
  const max = Math.max(1, ...data.flatMap((row) => [row.created, row.completed]));
  // Garis bantu di angka bulat.
  const step = max <= 5 ? 1 : max <= 10 ? 2 : Math.ceil(max / 5);
  const top = Math.ceil(max / step) * step;
  const ticks = Array.from({ length: top / step + 1 }, (_, index) => index * step);
  const groupWidth = BAR * 2 + GAP;
  const slot = 44;
  const width = PAD.left + PAD.right + slot * data.length;
  const plot = HEIGHT - PAD.top - PAD.bottom;
  const y = (value: number) => PAD.top + plot - (value / top) * plot;
  const active = hover ? data[hover.index] : null;

  return (
    <div className="trend-chart">
      <div className="trend-head">
        <ul className="trend-legend" aria-label="Legenda">
          {SERIES.map((series) => (
            <li key={series.key}>
              <span className="trend-swatch" style={{ background: series.color }} />
              {series.label}
            </li>
          ))}
        </ul>
        <button type="button" className="text-button" onClick={() => setAsTable((value) => !value)}>
          {asTable ? "Lihat grafik" : "Lihat tabel"}
        </button>
      </div>

      {asTable ? (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>MINGGU MULAI</th>
                <th>DIBUAT</th>
                <th>DISELESAIKAN</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.label}>
                  <td>{row.label}</td>
                  <td>{row.created}</td>
                  <td>{row.completed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="trend-plot">
          <svg
            viewBox={`0 0 ${width} ${HEIGHT}`}
            role="img"
            aria-label={`Tugas dibuat dan diselesaikan per minggu, ${data.length} minggu terakhir`}
            onMouseLeave={() => setHover(null)}
          >
            {ticks.map((tick) => (
              <g key={tick}>
                <line className="trend-grid" x1={PAD.left} x2={width - PAD.right} y1={y(tick)} y2={y(tick)} />
                <text className="trend-axis" x={PAD.left - 6} y={y(tick) + 3} textAnchor="end">
                  {tick}
                </text>
              </g>
            ))}
            {data.map((row, index) => {
              const x0 = PAD.left + slot * index + (slot - groupWidth) / 2;
              return (
                <g key={row.label}>
                  {SERIES.map((series, position) => {
                    const value = row[series.key];
                    const barTop = y(value);
                    const h = HEIGHT - PAD.bottom - barTop;
                    const x = x0 + position * (BAR + GAP);
                    const isActive = hover?.index === index && hover.key === series.key;
                    return (
                      <g key={series.key}>
                        {/* Area sentuh lebih besar dari batang. */}
                        <rect
                          x={x - 1}
                          y={PAD.top}
                          width={BAR + 2}
                          height={plot}
                          fill="transparent"
                          tabIndex={0}
                          aria-label={`${row.label}: ${value} ${series.label.toLowerCase()}`}
                          onMouseEnter={() => setHover({ index, key: series.key })}
                          onFocus={() => setHover({ index, key: series.key })}
                          onBlur={() => setHover(null)}
                        />
                        {value > 0 && (
                          <path
                            className={`trend-bar ${hover && !isActive ? "dim" : ""}`}
                            fill={series.color}
                            d={`M${x},${barTop + Math.min(4, h)} a4,4 0 0 1 4,-4 h${BAR - 8} a4,4 0 0 1 4,4 v${Math.max(0, h - 4)} h${-BAR} z`}
                            pointerEvents="none"
                          />
                        )}
                      </g>
                    );
                  })}
                  <text className="trend-axis" x={x0 + groupWidth / 2} y={HEIGHT - 8} textAnchor="middle">
                    {row.label}
                  </text>
                </g>
              );
            })}
            <line className="trend-baseline" x1={PAD.left} x2={width - PAD.right} y1={HEIGHT - PAD.bottom} y2={HEIGHT - PAD.bottom} />
          </svg>
          {active && hover && (
            <div
              className="trend-tooltip"
              role="status"
              style={{ left: `${((PAD.left + slot * hover.index + slot / 2) / width) * 100}%` }}
            >
              <strong>Minggu {active.label}</strong>
              {SERIES.map((series) => (
                <span key={series.key} className={hover.key === series.key ? "current" : ""}>
                  <i style={{ background: series.color }} />
                  {series.label} <b>{active[series.key]}</b>
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
