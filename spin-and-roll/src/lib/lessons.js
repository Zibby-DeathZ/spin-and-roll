// Class minigames: starting a class, saving attempts, and teaching whoever passes.
import {
  collection, deleteField, doc, onSnapshot, runTransaction, serverTimestamp, setDoc, updateDoc,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { clockInfo, lessonName, logEvent, taughtKey, teachLesson } from './game';
import { movePlayers, professorTo } from './world';

export const MAX_ATTEMPTS = 2;
const sessionRef = (sid) => doc(db, 'sessions', sid);
const resultRef = (sid, lessonId, uid) => doc(db, 'sessions', sid, 'lessons', `${lessonId}_${uid}`);

export const difficultyFor = (day) => (day <= 2 ? 1 : day <= 5 ? 2 : 3);

export async function startLesson(sid, data, clk, uids, session, chars) {
  const info = clockInfo(data, clk);
  const slot = info.slot;
  const id = `${clk.day}-${clk.block}-${Date.now().toString(36)}`;
  await updateDoc(sessionRef(sid), {
    'state.lesson': {
      id, key: taughtKey(info), cls: slot.class, game: info.cls.game,
      diff: difficultyFor(clk.day), uids, lesson: slot.lesson, lessonName: lessonName(data, slot.lesson),
    },
  });
  if (info.cls.room && session && chars) {
    if (info.cls.prof) await professorTo(sid, data, session, info.cls.prof, info.cls.room);
    await movePlayers(sid, data, info.cls.room, uids, chars, true);
  }
  await logEvent(sid, { type: 'lesson_start', payload: { cls: info.cls.name, prof: info.cls.professor, lesson: lessonName(data, slot.lesson) } });
}

export async function endLesson(sid, lesson) {
  await updateDoc(sessionRef(sid), { 'state.lesson': deleteField(), [`state.taught.${lesson.key}`]: true });
}

// Player saves after each attempt.
export const saveAttempt = (sid, lessonId, uid, attempts, passed, score) =>
  setDoc(resultRef(sid, lessonId, uid), { uid, lessonId, attempts, passed, score, updatedAt: serverTimestamp() }, { merge: true });

export function useLessonResults(sid, lessonId) {
  const [results, setResults] = useState({});
  useEffect(() => {
    if (!lessonId) { setResults({}); return undefined; }
    return onSnapshot(collection(db, 'sessions', sid, 'lessons'), (snap) => {
      const out = {};
      snap.docs.forEach((d) => { const r = d.data(); if (r.lessonId === lessonId) out[r.uid] = { id: d.id, ...r }; });
      setResults(out);
    });
  }, [sid, lessonId]);
  return results;
}

// GM screen: teach passes and announce failures, exactly once each.
export function useLessonEngine(sid, data, lesson) {
  const results = useLessonResults(sid, lesson?.id);
  useEffect(() => {
    if (!lesson || !data) return;
    Object.values(results).forEach(async (r) => {
      const done = r.passed || r.attempts >= MAX_ATTEMPTS;
      if (!done || r.announced) return;
      const ref = doc(db, 'sessions', sid, 'lessons', r.id);
      let claimed = false;
      await runTransaction(db, async (tx) => {
        const cur = (await tx.get(ref)).data();
        if (!cur || cur.announced) return;
        tx.update(ref, { announced: true });
        claimed = true;
      });
      if (!claimed) return;
      if (r.passed) {
        await teachLesson(sid, data, r.uid, lesson.lesson);
        await logEvent(sid, { type: 'lesson_passed', targetUid: r.uid, payload: { lesson: lesson.lessonName, score: r.score ?? null } });
      } else {
        await logEvent(sid, { type: 'lesson_failed', targetUid: r.uid, payload: { lesson: lesson.lessonName } });
      }
    });
  }, [sid, data, lesson, results]);
  return results;
}
