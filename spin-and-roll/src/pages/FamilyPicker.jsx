import { useState } from 'react';
import { claimFamily, fmtMod, mod, STATS } from '../lib/game';
import Wheel from '../components/Wheel';
import Portrait from '../components/Portrait';
import { useHeroes } from '../lib/heroes';

// Each family can be claimed by one player; the rest see it as taken.
export default function FamilyPicker({ sid, uid, data, claims, title }) {
  const [chosen, setChosen] = useState(null);
  const [first, setFirst] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const heroes = useHeroes(uid);
  // A character saved at the end of an earlier year of this series can carry on.
  const hero = heroes.find((h) => h.series === data.series && (h.year ?? 0) < (data.year ?? 1));
  const mine = Object.entries(claims).find(([, c]) => c.uid === uid);
  if (mine) {
    const fam = data.families.find((f) => f.id === mine[0]);
    return (
      <main className="login">
        <Wheel size={96} />
        <h1>{mine[1].firstName} {fam?.name}</h1>
        <p className="muted">Writing your character into the story…</p>
      </main>
    );
  }

  const claim = async () => {
    setError('');
    setSending(true);
    try {
      await claimFamily(sid, uid, chosen.id, first.trim());
    } catch {
      setError(`Someone just claimed the ${chosen.name} family. Pick another.`);
      setChosen(null);
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="phone-body picker-page">
      <h1>{title}</h1>
      {hero && (
        <div className="continue-card">
          <Portrait family={hero.family} name={hero.name} className="picker-portrait" />
          <div>
            <p className="muted small">Your character from Year {hero.year}</p>
            <strong>{hero.name}</strong>
            <p className="muted small">{hero.house}, level {hero.level}, {(hero.spells ?? []).length} spells, {hero.gold} Galleons</p>
          </div>
          <button className="btn gold" disabled={!!claims[hero.family] || sending}
            onClick={async () => { setSending(true); try { await claimFamily(sid, uid, hero.family, hero.firstName, true); } finally { setSending(false); } }}>
            {claims[hero.family] ? 'Family taken' : `Continue as ${hero.firstName}`}
          </button>
        </div>
      )}
      <p className="muted">{hero ? 'Or start fresh: ' : ''}Choose the family you were born into. Once someone claims a family, it’s theirs.</p>
      {error && <p className="error">{error}</p>}
      <ul className="families">
        {data.families.map((f) => {
          const taken = claims[f.id];
          const isChosen = chosen?.id === f.id;
          return (
            <li key={f.id} className={`family ${taken ? 'taken' : ''} ${isChosen ? 'chosen' : ''}`}>
              <button className="family-btn" disabled={!!taken} onClick={() => setChosen(f)} aria-pressed={isChosen}>
                <span className="family-top">
                  <Portrait family={f.id} name={f.name} className="picker-portrait" />
                  <strong>{f.name}</strong>
                  <span className="muted small">{taken ? `Taken by ${taken.firstName}` : `${f.blood}, ${f.wealth.toLowerCase()}`}</span>
                </span>
                <span className="family-story">{f.story}</span>
                {f.ability && (
                  <span className="family-ability">
                    <strong>{f.ability.icon} {f.ability.name}</strong>
                    <span>{f.ability.passive}</span>
                  </span>
                )}
                <span className="family-stats">
                  {STATS.map(([k]) => (
                    <span key={k}><b>{k.toUpperCase()}</b> {f.stats[k]} <i>{fmtMod(mod(f.stats[k]))}</i></span>
                  ))}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {chosen && (
        <div className="sheet-overlay" role="dialog" aria-label={`Join the ${chosen.name} family`}>
          <div className="sheet-panel">
            <h3>You are a {chosen.name}</h3>
            <p className="muted">What’s your first name?</p>
            <div className="join">
              <input value={first} onChange={(e) => setFirst(e.target.value)} maxLength={20}
                placeholder="First name" aria-label="First name" autoFocus />
            </div>
            <div className="actions">
              <button className="btn ghost" onClick={() => setChosen(null)}>Back</button>
              <button className="btn gold" disabled={!first.trim() || sending} onClick={claim}>
                {sending ? 'Claiming…' : `Become ${first.trim() || '…'} ${chosen.name}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
