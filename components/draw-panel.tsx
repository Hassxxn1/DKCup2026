'use client';
import { useState } from 'react';
import { Shuffle, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  divisions,
  ordered,
  position,
  potNumber,
  problem,
  randomDraw,
  type Applied,
  type Division,
  type Entry,
  type Registration,
} from '@/lib/draw';

export function Logo({ team }: { team: Entry }) {
  return team.logo ? (
    <img
      className="team-logo"
      src={team.logo}
      alt={`${team.name} logo`}
      width={44}
      height={44}
    />
  ) : (
    <span className="team-logo initials" aria-hidden="true">
      {team.name.trim().slice(0, 2).toUpperCase() || '—'}
    </span>
  );
}
export async function loadLogo(file: File): Promise<string> {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type))
    throw new Error('Choose a PNG, JPG or WebP logo.');
  if (file.size > 5 * 1024 * 1024)
    throw new Error('Choose a logo smaller than 5 MB.');
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const scale = Math.min(1, 256 / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not prepare this logo.');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const result = canvas.toDataURL('image/png');
    if (result.length > 350000)
      throw new Error(
        'This logo is too detailed. Please choose a smaller image.',
      );
    return result;
  } finally {
    URL.revokeObjectURL(url);
  }
}
export default function DrawPanel({
  teamsOnly = false,
  registration,
  applied,
  confirmed,
  onEdit,
  onNumbers,
  onApply,
}: {
  teamsOnly?: boolean;
  registration: Registration;
  applied: Applied;
  confirmed: Record<Division,boolean>;
  onEdit: (
    d: Division,
    id: string,
    patch: Partial<Pick<Entry, 'name' | 'logo' | 'number'>>,
  ) => void;
  onNumbers: (d: Division, entries: Entry[]) => void;
  onApply: (d: Division) => void;
}) {
  const [mode, setMode] = useState<'manual' | 'random'>('manual');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(0);
  return (
    <div
      className={`draw-workspace ${teamsOnly ? 'teams-workspace' : 'live-draw'}`}
    >
      {!teamsOnly && (
        <>
          <div className="draw-modes" role="group" aria-label="Draw method">
            <Button
              className={mode === 'manual' ? 'action' : 'dark'}
              onClick={() => setMode('manual')}
            >
              Manual pot draw
            </Button>
            <Button
              className={mode === 'random' ? 'action' : 'dark'}
              onClick={() => setMode('random')}
            >
              <Shuffle />
              Random draw
            </Button>
          </div>
        </>
      )}
      {error && (
        <p className="draw-error" role="alert">
          {error}
        </p>
      )}
      {divisions.map((d) => {
        const entries = registration[d],
          issue = problem(entries);
        const isApplied =
          confirmed[d] && !issue && ordered(entries).every((t, i) => t.id === applied[d][i]);
        return (
          <section
            className={`registration ${d}`}
            key={d}
            aria-label={`${d === 'men' ? 'Men’s' : 'Women’s'} ${teamsOnly ? 'teams' : 'draw'}`}
          >
            <div className="registration-heading">
              <div>
                <p className="kicker">{entries.length} TEAMS</p>
                <h2>
                  {d === 'men' ? 'Men’s competition' : 'Women’s competition'}
                </h2>
              </div>
              {!teamsOnly && (
                <Button
                  className="dark"
                  disabled={busy > 0}
                  onClick={() => {
                    setError('');
                    onNumbers(
                      d,
                      mode === 'random'
                        ? randomDraw(entries)
                        : entries.map((t) => ({ ...t, number: null })),
                    );
                  }}
                >
                  {mode === 'random' ? (
                    <>
                      <Shuffle />
                      Generate random draw
                    </>
                  ) : (
                    'Clear pot numbers'
                  )}
                </Button>
              )}
            </div>
            {!teamsOnly && (
              <p className="number-guide">
                {d === 'men'
                  ? 'Pot 1 → A1 · 2 → B1 · 3 → A2 · 4 → B2 · 5 → A3 · 6 → B3 · 7 → A4 · 8 → B4'
                  : 'Separate women’s pot: 1 → position 1 · 2 → position 2 · 3 → position 3 · 4 → position 4'}
              </p>
            )}
            <div className="registration-labels" aria-hidden="true">
              <span>No.</span>
              <span>Team & logo</span>
              {!teamsOnly && (
                <>
                  <span>Pot number</span>
                  <span>Allocation</span>
                </>
              )}
            </div>
            {entries.map((t, i) => (
              <div className="registration-row" key={t.id}>
                <span className="registration-number">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="team-editor">
                  <Logo team={t} />
                  {teamsOnly ? (
                    <div className="team-fields">
                      <Input
                        aria-label={`${d} team ${i + 1} name`}
                        value={t.name}
                        maxLength={80}
                        onChange={(e) =>
                          onEdit(d, t.id, { name: e.target.value })
                        }
                      />
                      <div className="logo-actions">
                        <label className="logo-upload">
                          <Upload size={14} />
                          {t.logo ? 'Change logo' : 'Add logo'}
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            aria-label={`Upload logo for ${t.name}`}
                            disabled={busy > 0}
                            onChange={async (e) => {
                              const f = e.target.files?.[0];
                              e.target.value = '';
                              if (!f) return;
                              setBusy((n) => n + 1);
                              setError('');
                              try {
                                onEdit(d, t.id, { logo: await loadLogo(f) });
                              } catch (err) {
                                setError(
                                  err instanceof Error
                                    ? err.message
                                    : 'Could not read logo.',
                                );
                              } finally {
                                setBusy((n) => n - 1);
                              }
                            }}
                          />
                        </label>
                        {t.logo && (
                          <button
                            type="button"
                            onClick={() => onEdit(d, t.id, { logo: '' })}
                          >
                            Remove logo
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <strong className="draw-team-name">
                      {t.name || 'Unnamed team'}
                    </strong>
                  )}
                </div>
                {!teamsOnly && (
                  <>
                    <select
                      aria-label={`Pot number for ${t.name}`}
                      value={t.number ?? ''}
                      disabled={mode === 'random'}
                      onChange={(e) =>
                        onEdit(d, t.id, {
                          number: e.target.value
                            ? Number(e.target.value)
                            : null,
                        })
                      }
                    >
                      <option value="">Not drawn</option>
                      {entries.map((_, n) => (
                        <option
                          key={n}
                          value={n + 1}
                          disabled={entries.some(
                            (other) =>
                              other.id !== t.id && other.number === n + 1,
                          )}
                        >
                          {n + 1}
                        </option>
                      ))}
                    </select>
                    <span className="allocation">
                      {t.number === null
                        ? 'Awaiting number'
                        : position(d, t.number)}
                    </span>
                  </>
                )}
              </div>
            ))}
            {!teamsOnly && (
              <>
                <div className="draw-review">
                  <div>
                    <strong>
                      {isApplied
                        ? 'Current draw applied'
                        : `${entries.filter((t) => t.number !== null).length} of ${entries.length} numbers assigned`}
                    </strong>
                    <p>
                      {issue ||
                        (isApplied
                          ? 'These positions are used by the schedule and standings.'
                          : 'Review the group positions below before confirming.')}
                    </p>
                  </div>
                  <Button
                    className="action"
                    disabled={Boolean(issue) || isApplied || busy > 0}
                    onClick={() => onApply(d)}
                  >
                    Confirm {d === 'men' ? 'men’s' : 'women’s'} draw
                  </Button>
                </div>
                <div className="draw-preview">
                  {(d === 'men' ? [0, 4] : [0]).map((start) => (
                    <article className="team-card" key={start}>
                      <h3>
                        {d === 'women'
                          ? 'Women’s group'
                          : start === 0
                            ? 'Group A'
                            : 'Group B'}
                      </h3>
                      {Array.from({ length: 4 }, (_, i) => {
                        const n = potNumber(d, start + i),
                          team = entries.find((t) => t.number === n);
                        return (
                          <div className="draw-slot" key={n}>
                            <b>
                              {d === 'men' ? (start === 0 ? 'A' : 'B') : 'W'}
                              {i + 1}
                            </b>
                            {team ? (
                              <>
                                <Logo team={team} />
                                <span>{team.name || 'Unnamed team'}</span>
                              </>
                            ) : (
                              <span className="unassigned">
                                Awaiting pot {n}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </article>
                  ))}
                </div>
              </>
            )}
          </section>
        );
      })}
    </div>
  );
}
