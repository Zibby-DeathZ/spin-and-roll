const LABELS = { lobby: 'Waiting for players', active: 'In progress', won: 'Won', lost: 'Lost' };
export default function StatusPill({ status }) {
  return <span className={`pill pill-${status}`}>{LABELS[status] ?? status}</span>;
}
