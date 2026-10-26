export function toDateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function startOfMonth(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

export function addDays(d: Date, days: number) {
  const next = new Date(d);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function monthMatrix(anchor: Date) {
  const first = startOfMonth(anchor);
  const startPad = first.getUTCDay(); // Sun=0
  const gridStart = addDays(first, -startPad);
  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) cells.push(addDays(gridStart, i));
  return { first, cells };
}

export function parseMonthParam(raw: string | undefined) {
  if (raw && /^\d{4}-\d{2}$/.test(raw)) {
    const [y, m] = raw.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, 1));
  }
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}
