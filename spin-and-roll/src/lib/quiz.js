// Ceremony questions: a random draw from each quiz's pool, with the answers shuffled.
// A draw is stored on the session as strings like 's12:2031' (question id, then the
// option order), so the phone, the TV and the GM all show the same thing.

const shuffle = (arr, rand) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// How many of each kind to ask: a number (any kind) or { wood: 3, core: 2 }.
const wanted = (quiz) => (typeof quiz.pick === 'object' ? quiz.pick : { any: quiz.pick ?? 5 });

// Pick fresh questions, skipping ones already asked this session until the pool runs dry.
// Returns { qs, used } where used is the updated list of asked ids.
export function drawQuestions(quiz, used = [], rand = Math.random) {
  if (!quiz?.pool) return { qs: null, used };
  let seen = new Set(used);
  const qs = [];
  for (const [kind, n] of Object.entries(wanted(quiz))) {
    const ofKind = quiz.pool.filter((q) => kind === 'any' || q.kind === kind);
    const fresh = shuffle(ofKind.filter((q) => !seen.has(q.id)), rand);
    let chosen = fresh.slice(0, n);
    if (chosen.length < n) {
      // The pool has run out: ask the last fresh ones, then start the cycle again.
      seen = new Set([...seen].filter((id) => !ofKind.some((q) => q.id === id)));
      const rest = shuffle(ofKind.filter((q) => !chosen.includes(q)), rand);
      chosen = [...chosen, ...rest.slice(0, n - chosen.length)];
    }
    for (const q of chosen) {
      const order = shuffle(q.options.map((_, i) => i), rand).join('');
      qs.push(`${q.id}:${order}`);
      seen.add(q.id);
    }
  }
  return { qs, used: [...seen] };
}

// The quiz as this student sees it: the drawn questions, answers in the drawn order.
export function resolveQuiz(quiz, quizState) {
  if (!quiz?.pool) return quiz;
  const byId = Object.fromEntries(quiz.pool.map((q) => [q.id, q]));
  let qs = quizState?.qs;
  if (!qs?.length) {
    // An old ceremony started before pools existed: ask the first few in order.
    const n = Object.values(wanted(quiz)).reduce((a, b) => a + b, 0);
    qs = Object.entries(wanted(quiz)).flatMap(([kind, k]) => quiz.pool
      .filter((q) => kind === 'any' || q.kind === kind).slice(0, k).map((q) => q.id)).slice(0, n);
  }
  const questions = qs.map((code) => {
    const [id, order] = code.split(':');
    const q = byId[id];
    if (!q) return null;
    const idx = order ? order.split('').map(Number) : q.options.map((_, i) => i);
    return { ...q, options: idx.map((i) => q.options[i]).filter(Boolean) };
  }).filter(Boolean);
  return { ...quiz, questions };
}

// Number of a question in the printed Ceremony Book, e.g. 's12' -> 'S12'.
export const bookRef = (id) => (id ? id.toUpperCase() : '');
