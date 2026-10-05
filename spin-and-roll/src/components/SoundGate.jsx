import { useState } from 'react';
import { audioReady, play, unlockAudio } from '../lib/sound';

// Browsers need one click before a page can make sound. Shown on the TV.
export default function SoundGate() {
  const [ready, setReady] = useState(audioReady());
  if (ready) return null;
  return (
    <button className="sound-gate" onClick={async () => { await unlockAudio(); play('chime'); setReady(true); }}>
      <span className="sg-icon" aria-hidden="true">🔊</span>
      <span>Click to enable sound</span>
      <span className="muted small">Do this once on the TV before you start.</span>
    </button>
  );
}
