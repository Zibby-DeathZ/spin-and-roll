// Covers the phone and swallows taps while everyone should be watching the TV.
export default function MainEventLock({ title = 'Main Event', sub = 'Pay attention to the screen' }) {
  return (
    <div className="main-event" role="alertdialog" aria-label="Main event: watch the TV"
      onClickCapture={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
      <span className="me-eye" aria-hidden="true">📺</span>
      <p className="me-title">{title}</p>
      <p className="me-sub">{sub}</p>
    </div>
  );
}
