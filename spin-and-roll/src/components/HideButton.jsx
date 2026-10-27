import { useState } from 'react';
import { hideGame, unhideGame } from '../lib/hidden';

// "Remove from my profile" for one game, or "Bring back" when it is already hidden.
export default function HideButton({ uid, sid, hidden, title }) {
  const [busy, setBusy] = useState(false);
  const go = async () => {
    if (!hidden && !confirm(`Remove ${title ?? 'this game'} from your profile?\n\nNothing is deleted. You can bring it back with "Show hidden".`)) return;
    setBusy(true);
    try { await (hidden ? unhideGame(uid, sid) : hideGame(uid, sid)); } finally { setBusy(false); }
  };
  return (
    <button className={`hide-btn ${hidden ? 'is-hidden' : ''}`} disabled={busy} onClick={go}
      aria-label={hidden ? `Bring back ${title}` : `Remove ${title} from my profile`} title={hidden ? 'Bring back' : 'Remove from my profile'}>
      {hidden ? '↺ Bring back' : '✕'}
    </button>
  );
}
