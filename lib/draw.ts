export type Entry = {
  id: string;
  name: string;
  logo: string;
  number: number | null;
};
export type Division = 'men' | 'women';
export type Registration = Record<Division, Entry[]>;
export type Applied = Record<Division, string[]>;
export const divisions: Division[] = ['men', 'women'];
export function register(men: string[], women: string[]): Registration {
  return Object.fromEntries(
    divisions.map((d) => [
      d,
      (d === 'men' ? men : women).map((name, i) => ({
        id: `${d}-${i + 1}`,
        name,
        logo: '',
        number: potNumber(d, i),
      })),
    ]),
  ) as Registration;
}
export function potNumber(d: Division, index: number) {
  return d === 'women'
    ? index + 1
    : index < 4
      ? index * 2 + 1
      : (index - 4) * 2 + 2;
}
export function position(d: Division, n: number) {
  return d === 'women'
    ? `Women · ${n}`
    : `${n % 2 === 1 ? 'Group A' : 'Group B'} · ${Math.ceil(n / 2)}`;
}
export function problem(entries: Entry[]): string | null {
  if (entries.some((t) => !t.name.trim()))
    return 'Enter a name for every team.';
  if (
    new Set(entries.map((t) => t.name.trim().toLowerCase())).size !==
    entries.length
  )
    return 'Each team needs a different name within its competition.';
  if (entries.some((t) => t.number === null))
    return 'Assign a pot number to every team.';
  if (
    entries.some(
      (t) =>
        !Number.isInteger(t.number) ||
        t.number! < 1 ||
        t.number! > entries.length,
    )
  )
    return 'A pot number is outside the allowed range.';
  if (new Set(entries.map((t) => t.number)).size !== entries.length)
    return 'Each pot number can only be used once.';
  return null;
}
export function ordered(entries: Entry[]) {
  if (problem(entries)) throw new Error(problem(entries)!);
  const rank = (n: number) =>
    entries.length === 8 ? (n % 2 === 1 ? 0 : 4) + Math.ceil(n / 2) : n;
  return [...entries].sort((a, b) => rank(a.number!) - rank(b.number!));
}
export function randomDraw(entries: Entry[]): Entry[] {
  const numbers = entries.map((_, i) => i + 1);
  for (let i = numbers.length - 1; i > 0; i--) {
    const bound = i + 1,
      limit = Math.floor(4294967296 / bound) * bound;
    let sample: number;
    do {
      sample = crypto.getRandomValues(new Uint32Array(1))[0];
    } while (sample >= limit);
    const j = sample % bound;
    [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
  }
  return entries.map((t, i) => ({ ...t, number: numbers[i] }));
}
export function readRegistration(
  value: unknown,
  fallback: Registration,
): Registration {
  if (value === undefined) return fallback;
  const r = value as Registration;
  for (const d of divisions) {
    if (!r || !Array.isArray(r[d]) || r[d].length !== (d === 'men' ? 8 : 4))
      throw new Error('Invalid registration list.');
    if (
      r[d].some(
        (t) =>
          !t ||
          typeof t.id !== 'string' ||
          typeof t.name !== 'string' ||
          typeof t.logo !== 'string' ||
          t.logo.length > 350000 ||
          (t.logo !== '' &&
            !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(
              t.logo,
            )) ||
          (t.number !== null &&
            (!Number.isInteger(t.number) ||
              t.number < 1 ||
              t.number > r[d].length)),
      )
    )
      throw new Error('Invalid team details.');
    if (
      new Set(r[d].map((t) => t.id)).size !== r[d].length ||
      new Set(r[d].filter((t) => t.number !== null).map((t) => t.number))
        .size !== r[d].filter((t) => t.number !== null).length
    )
      throw new Error('Duplicate team or pot number.');
  }
  return r;
}
