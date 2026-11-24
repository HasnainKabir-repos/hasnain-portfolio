import type { ReactNode } from "react";

export function Finding({
  title, big, note, children,
}: { title?: string; big?: string; note: ReactNode; children: ReactNode }) {
  return (
    <div className="row">
      <div>
        {title && <h3>{title}</h3>}
        {children}
      </div>
      <aside className="note">
        {big && <span className="big">{big}</span>}
        {note}
      </aside>
    </div>
  );
}

type BarRow = { name: string; value: number; text?: string; tone?: "q" | "w" };

export function Bars({ rows, label, caption }: { rows: BarRow[]; label: string; caption: string }) {
  const max = Math.max(...rows.map((r) => r.value));
  return (
    <>
      <div className="bars" aria-label={label}>
        {rows.map((r) => (
          <div className="bar" key={r.name}>
            <span>{r.name}</span>
            <i className={r.tone} style={{ width: `${((100 * r.value) / max).toFixed(0)}%` }} />
            <span>{r.text ?? r.value.toFixed(2)}</span>
          </div>
        ))}
      </div>
      <p className="cap">{caption}</p>
    </>
  );
}
