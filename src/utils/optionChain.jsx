// src/utils/optionChain.js

// Parse numbers like "57,470" or "-" -> number | null
export function parseNum(x) {
  if (x == null) return null;
  const s = String(x).trim();
  if (s === '-' || s === '') return null;
  const cleaned = s.replace(/,/g, '');
  const m = cleaned.match(/^-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : null;
}

// "161.00(1.58%)" -> { ltpChange: 161, pct: 1.58 }
export function parseLTPChange(s) {
  if (!s || s === '-') return { ltpChange: null, pct: null };
  const m = String(s).match(/-?\d+(\.\d+)?/g);
  if (!m || !m.length) return { ltpChange: null, pct: null };
  const ltpChange = Number(m[0]);
  const pct = m[1] != null ? Number(m[1]) : null;
  return { ltpChange, pct };
}

export function delta(cur, prev) {
  if (cur == null || prev == null) return null;
  return cur - prev;
}

export function getLatestPair(snapshots = []) {
  if (!snapshots.length) return { latest: null, prev: null };
  if (snapshots.length === 1) return { latest: snapshots[0], prev: null };
  return {
    latest: snapshots[snapshots.length - 1],
    prev: snapshots[snapshots.length - 2],
  };
}
