export default function Bar({ label, value, max, tone }) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return (
    <div className="bar">
      <div className="bar-label">
        <span>{label}</span>
        <span>{value}{max != null && ` / ${max}`}</span>
      </div>
      <div className="bar-track" role="progressbar" aria-valuenow={value} aria-valuemax={max}>
        <div className={`bar-fill ${tone}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
