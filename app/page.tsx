'use client';
import { ADK_LOGO, ADK_WHITE_LOGO } from '@/lib/brand';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTournamentCloud } from '@/lib/use-tournament-cloud';
import CloudAccess from '@/components/cloud-access';
import { qualifiedTeam } from '@/lib/qualification';
import {
  CalendarDays,
  Clipboard,
  Download,
  FileUp,
  Printer,
  RotateCcw,
  Trophy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import DrawPanel, { Logo } from '@/components/draw-panel';
import ScheduleExport from '@/components/schedule-export';
import {
  register,
  readRegistration,
  ordered,
  potNumber,
  problem,
  divisions,
  type Registration,
  type Applied,
  type Division,
  type Entry,
} from '@/lib/draw';
type Div = 'Men A' | 'Men B' | 'Women' | 'Men SF' | 'Men Final' | 'Women Final';
type Match = {
  id: number;
  day: 1 | 2;
  time: string;
  ground: 1 | 2;
  division: Div;
  home: string;
  away: string;
  stage: 'Group' | 'Semifinal' | 'Final';
  hs: string;
  as: string;
};
type Data = {
  title: string;
  venue: string;
  date1: string;
  date2: string;
  men: string[];
  women: string[];
  matches: Match[];
  confirmed: Record<Division, boolean>;
  organizerLogo?: string;
  allocationVersion?: 2;
  registration: Registration;
  applied: Applied;
};
const KEY = 'cup-2026-local',
  pairs = [
    [0, 1],
    [2, 3],
    [0, 2],
    [1, 3],
    [0, 3],
    [1, 2],
  ],
  slots = [
    [1, '20:00', 1],
    [1, '20:00', 2],
    [1, '20:50', 1],
    [1, '20:50', 2],
    [1, '21:30', 1],
    [1, '21:30', 2],
    [2, '07:00', 1],
    [2, '07:00', 2],
    [2, '07:40', 1],
    [2, '07:40', 2],
    [2, '08:30', 1],
    [2, '08:30', 2],
    [2, '09:10', 1],
    [2, '09:10', 2],
    [2, '15:00', 1],
    [2, '15:00', 2],
    [2, '15:50', 1],
    [2, '15:50', 2],
  ] as const;
function games(men: string[], women: string[]) {
  const A = men.slice(0, 4),
    B = men.slice(4),
    all: { division: Div; home: string; away: string }[] = [];
  for (const [a, b] of pairs) {
    all.push(
      { division: 'Men A', home: A[a], away: A[b] },
      { division: 'Men B', home: B[a], away: B[b] },
      { division: 'Women', home: women[a], away: women[b] },
    );
  }
  const order = [
    0, 1, 2, 5, 3, 4, 8, 11, 6, 7, 14, 17, 9, 10, 12, 13, 15, 16,
  ].map((i) => all[i]);
  return [
    ...order.map((g, i) => ({
      ...g,
      id: all.indexOf(g) + 1,
      day: slots[i][0],
      time: slots[i][1],
      ground: slots[i][2],
      stage: 'Group' as const,
      hs: '',
      as: '',
    })),
    {
      id: 19,
      day: 2 as const,
      time: '17:30',
      ground: 1 as const,
      division: 'Men SF' as Div,
      home: 'Group A winner',
      away: 'Group B runner-up',
      stage: 'Semifinal' as const,
      hs: '',
      as: '',
    },
    {
      id: 20,
      day: 2 as const,
      time: '17:30',
      ground: 2 as const,
      division: 'Men SF' as Div,
      home: 'Group B winner',
      away: 'Group A runner-up',
      stage: 'Semifinal' as const,
      hs: '',
      as: '',
    },
    {
      id: 21,
      day: 2 as const,
      time: '20:45',
      ground: 1 as const,
      division: 'Men Final' as Div,
      home: 'SF1 winner',
      away: 'SF2 winner',
      stage: 'Final' as const,
      hs: '',
      as: '',
    },
    {
      id: 22,
      day: 2 as const,
      time: '20:00',
      ground: 1 as const,
      division: 'Women Final' as Div,
      home: "Women's group winner",
      away: "Women's group runner-up",
      stage: 'Final' as const,
      hs: '',
      as: '',
    },
  ].sort(
    (a, b) =>
      a.day - b.day || a.time.localeCompare(b.time) || a.ground - b.ground,
  );
}
function fresh(): Data {
  const men = Array.from({ length: 8 }, (_, i) => `Men’s Team ${i + 1}`),
    women = Array.from({ length: 4 }, (_, i) => `Women’s Team ${i + 1}`);
  return {
    title: 'Dhonkaleyfaanu Cup 2026',
    venue: 'Henveyru Ground',
    date1: '2026-09-17',
    date2: '2026-09-18',
    men,
    women,
    confirmed: {men:false,women:false},
    matches: games(men, women),
    allocationVersion: 2,
    registration: {men:register(men,women).men.map(t=>({...t,number:null})),women:register(men,women).women.map(t=>({...t,number:null}))},
    applied: {
      men: men.map((_, i) => `men-${i + 1}`),
      women: women.map((_, i) => `women-${i + 1}`),
    },
  };
}
const date = (d: string) =>
  new Date(d + 'T00:00:00').toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    weekday: 'long',
  });
function normalize(value: unknown): Data {
  const d = value as Data;
  if (
    !d ||
    !['title', 'venue', 'date1', 'date2'].every(
      (k) => typeof (d as any)[k] === 'string',
    ) ||
    !Array.isArray(d.men) ||
    d.men.length !== 8 ||
    !Array.isArray(d.women) ||
    d.women.length !== 4 ||
    [...d.men, ...d.women].some((n) => typeof n !== 'string') ||
    !Array.isArray(d.matches) ||
    d.matches.length !== 22 ||
    d.matches.some(
      (m) =>
        !m ||
        !Number.isInteger(m.id) ||
        ![1, 2].includes(m.day) ||
        ![1, 2].includes(m.ground) ||
        !['Group', 'Semifinal', 'Final'].includes(m.stage) ||
        ![
          'Men A',
          'Men B',
          'Women',
          'Men SF',
          'Men Final',
          'Women Final',
        ].includes(m.division) ||
        !['home', 'away', 'hs', 'as', 'time'].every(
          (k) => typeof (m as any)[k] === 'string',
        ),
    )
  )
    throw new Error('Invalid tournament file.');
  if (
    d.organizerLogo !== undefined &&
    (typeof d.organizerLogo !== 'string' ||
      d.organizerLogo.length > 350000 ||
      !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(
        d.organizerLogo,
      ))
  )
    throw new Error('Invalid organizer logo.');
  let registration = readRegistration(d.registration, register(d.men, d.women));
  if (d.registration && d.allocationVersion !== 2) {
    registration = {
      ...registration,
      men: registration.men.map((t) => ({
        ...t,
        number: t.number === null ? null : potNumber('men', t.number - 1),
      })),
    };
  }
  const applied = d.applied ?? {
    men: registration.men.map((t) => t.id),
    women: registration.women.map((t) => t.id),
  };
  for (const division of divisions) {
    if (
      !Array.isArray(applied[division]) ||
      applied[division].length !== registration[division].length ||
      new Set(applied[division]).size !== registration[division].length ||
      applied[division].some(
        (id, i) =>
          !registration[division].some(
            (t) => t.id === id && t.name === d[division][i],
          ),
      )
    )
      throw new Error('Invalid confirmed draw.');
  }
  const timing = games(d.men, d.women);
  const matches = timing.map((template) => {
    const old = d.matches.find((m) => m.id === template.id);
    if (!old) throw new Error('Missing fixture.');
    return {
      ...old,
      day: template.day,
      time: template.time,
      ground: template.ground,
    };
  });
  const confirmed = d.confirmed ?? Object.fromEntries(divisions.map(division => [division,
    matches.some(m => (m.division.includes('Women') ? 'women' : 'men') === division && (m.hs !== '' || m.as !== '')) || applied[division].some((id,i)=>id!==registration[division][i].id)
  ])) as Record<Division,boolean>;
  if (divisions.some(division=>typeof confirmed[division] !== 'boolean')) throw new Error('Invalid draw status.');
  return { ...d, confirmed, matches, allocationVersion: 2, registration, applied };
}
export default function Home() {
  const cloud = useTournamentCloud(fresh, normalize);
  const {data, setData, ready, canEdit, error: saveError} = cloud;
  const [tab, setTab] = useState('schedule');
  const file = useRef<HTMLInputElement>(null);
  useEffect(() => { if (!canEdit) setTab(t => ['teams','draw','setup'].includes(t) ? 'schedule' : t); }, [canEdit]);
  const recover = (key: string) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) { alert('No saved tournament was found on this browser. You can import an exported JSON backup in Setup & share.'); return; }
      const imported = normalize(JSON.parse(raw));
      if (confirm('Load this saved tournament as your draft? Review it, then select Save & publish to share it.')) setData(imported);
    } catch { alert('This saved file could not be loaded. Use a valid JSON backup.'); }
  };
  const editTeam = (
    division: Division,
    id: string,
    patch: Partial<Pick<Entry, 'name' | 'logo' | 'number'>>,
  ) =>
    setData((d) => {
      const entries = d.registration[division];
      if (
        patch.number !== undefined &&
        patch.number !== null &&
        (patch.number < 1 ||
          patch.number > entries.length ||
          !Number.isInteger(patch.number) ||
          entries.some((t) => t.id !== id && t.number === patch.number))
      )
        return d;
      const registration = {
        ...d.registration,
        [division]: entries.map((t) => (t.id === id ? { ...t, ...patch } : t)),
      };
      if (patch.name === undefined) return { ...d, registration };
      const names = d.applied[division].map(
        (teamId) => registration[division].find((t) => t.id === teamId)!.name,
      );
      const men = division === 'men' ? names : d.men,
        women = division === 'women' ? names : d.women;
      return {
        ...d,
        registration,
        men,
        women,
        matches: games(men, women).map((m) => ({
          ...m,
          hs: d.matches.find((x) => x.id === m.id)?.hs || '',
          as: d.matches.find((x) => x.id === m.id)?.as || '',
        })),
      };
    });
  const visibleMatches = ready ? data.matches.filter(m=>data.confirmed[m.division.includes('Women')?'women':'men']) : [];
  const clearDraw = () => {
    if(!confirm('Clear both draws, fixtures and scores? Registered teams and logos will be kept. Export a backup first if you need these results.')) return;
    setData(d=>({...d,confirmed:{men:false,women:false},registration:{men:d.registration.men.map(t=>({...t,number:null})),women:d.registration.women.map(t=>({...t,number:null}))},matches:games(d.men,d.women)}));
  };
  const csvDownload = () => {
    const cell = (value:unknown) => {let v=String(value);if(/^[\s]*[=+@-]/.test(v))v="'"+v;return '"'+v.replace(/"/g,'""')+'"';};
    const rows = [['Tournament','Date','Time','Ground','Division','Stage','Home team','Away team','Venue'],...visibleMatches.map(m=>[data.title,m.day===1?data.date1:data.date2,m.time,m.ground,m.division,m.stage,m.home,m.away,data.venue])];
    const url=URL.createObjectURL(new Blob(['\ufeff'+rows.map(row=>row.map(cell).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}));
    const a=document.createElement('a');a.href=url;a.download='tournament-schedule.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  const applyDraw = (division: Division) => {
    const issue = problem(data.registration[division]);
    if (issue) {
      alert(issue);
      return;
    }
    const hasScores = data.matches.some(
      (m) =>
        (division === 'men'
          ? !m.division.includes('Women')
          : m.division.includes('Women')) &&
        (m.hs !== '' || m.as !== ''),
    );
    if (
      !confirm(
        hasScores
          ? 'Apply this draw? This replaces the fixtures and clears existing scores for this competition. The other competition is unchanged.'
          : 'Apply this draw to the fixtures and standings?',
      )
    )
      return;
    setData((d) => {
      const list = ordered(d.registration[division]),
        names = list.map((t) => t.name),
        men = division === 'men' ? names : d.men,
        women = division === 'women' ? names : d.women;
      return {
        ...d,
        men,
        women,
        confirmed: {...d.confirmed,[division]:true},
        applied: { ...d.applied, [division]: list.map((t) => t.id) },
        matches: games(men, women).map((m) =>
          (
            division === 'men'
              ? !m.division.includes('Women')
              : m.division.includes('Women')
          )
            ? m
            : d.matches.find((x) => x.id === m.id)!,
        ),
      };
    });
  };
  const table = (division: Div, list: string[]) =>
    list
      .map((team) => {
        let p = 0,
          w = 0,
          dr = 0,
          l = 0,
          gf = 0,
          ga = 0;
        data.matches
          .filter(
            (m) =>
              m.division === division &&
              m.stage === 'Group' &&
              (m.home === team || m.away === team) &&
              m.hs !== '' &&
              m.as !== '',
          )
          .forEach((m) => {
            let x = m.home === team ? +m.hs : +m.as,
              y = m.home === team ? +m.as : +m.hs;
            p++;
            gf += x;
            ga += y;
            x > y ? w++ : x === y ? dr++ : l++;
          });
        return { team, p, w, d: dr, l, gf, ga, gd: gf - ga, pts: w * 3 + dr };
      })
      .sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
  const st = useMemo(
    () => ({
      a: data.confirmed.men ? table('Men A', data.men.slice(0, 4)) : [],
      b: data.confirmed.men ? table('Men B', data.men.slice(4)) : [],
      w: data.confirmed.women ? table('Women', data.women) : [],
    }),
    [data],
  );
  const score = (id: number, k: 'hs' | 'as', v: string) =>
    setData((d) => ({
      ...d,
      matches: d.matches.map((m) =>
        m.id === id ? { ...m, [k]: v.replace(/\D/g, '').slice(0, 2) } : m,
      ),
    }));
  const download = () => {
    const b = new Blob([ready ? JSON.stringify(data, null, 2) : (localStorage.getItem(KEY) || '{}')], {
        type: 'application/json',
      }),
      a = document.createElement('a');
    a.href = URL.createObjectURL(b);
    a.download = 'cup-2026-data.json';
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const upload = (f?: File) => {
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const imported = normalize(JSON.parse(String(r.result)));
        if (confirm('Replace this tournament with the imported data?')) {
          setData(imported);

        }
      } catch {
        alert(
          'Invalid tournament file. Please choose a valid exported backup.',
        );
      }
    };
    r.readAsText(f);
  };
  const copy = () =>
    navigator.clipboard
      .writeText(
        `${data.title}\n${date(data.date1)} & ${date(data.date2)} · ${data.venue}\nGroup A: ${data.men.slice(0, 4).join(', ')}\nGroup B: ${data.men.slice(4).join(', ')}\nWomen: ${data.women.join(', ')}`,
      )
      .then(() => alert('Tournament summary copied.'));
  return (
    <main>
      <div className="top-rule" />
      <header className="shell header">
        <div className="brand">
          <img
            className="brand-logo brand-logo-screen"
            src={ADK_WHITE_LOGO}
            alt="ADK Synergy"
            width={64}
            height={72}
          />
          <img className="brand-logo brand-logo-print" src={data.organizerLogo || ADK_LOGO} alt="ADK Synergy" width={64} height={72}/>
          <span>
            DHONKALEYFAANU
            <br />
            <b>CUP 2026</b>
          </span>
        </div>
        <div className="meta">
          17 & 18 SEPTEMBER · {data.venue.toUpperCase()}
          {canEdit && <small>{cloud.dirty ? 'UNPUBLISHED CHANGES' : saveError ? 'CONNECTION ERROR' : !ready ? 'CONNECTING…' : cloud.updated ? 'PUBLISHED · UPDATES EVERY 10 SECONDS' : 'AWAITING FIRST PUBLISH'}</small>}
        </div>
      </header>
      {cloud.session && <CloudAccess email={cloud.session?.user.email} canEdit={canEdit} dirty={cloud.dirty} saving={cloud.saving} ready={ready} publish={cloud.publish} recover={recover}/>}
      <nav className="shell nav">
        {[
          ['teams', 'Teams'],
          ['draw', 'Draw'],
          ['schedule', 'Schedule'],
          ['standings', 'Standings'],
          ['bracket', 'Finals'],
          ['setup', 'Setup & share'],
        ].filter(x => canEdit || !['teams','draw','setup'].includes(x[0])).map((x) => (
          <button
            className={tab === x[0] ? 'active' : ''}
            onClick={() => setTab(x[0])}
            key={x[0]}
          >
            {x[1]}
          </button>
        ))}
      </nav>
      <section className="shell content">
        {saveError && (
          <p className="draw-error" role="alert">
            {saveError}
          </p>
        )}
        {canEdit && (tab === 'draw' || tab === 'teams') && (
          <>
            <Head
              k="8 MEN’S TEAMS · 4 WOMEN’S TEAMS"
              t={tab === 'teams' ? 'Teams' : 'Draw'}
              c={
                tab === 'teams'
                  ? 'Add team names and logos in registration order.'
                  : undefined
              }
            />
            {ready ? (
              <DrawPanel
                key={tab}
                teamsOnly={tab === 'teams'}
                registration={data.registration}
                applied={data.applied}
                confirmed={data.confirmed}
                onEdit={editTeam}
                onNumbers={(division, entries) =>
                  setData((d) => ({
                    ...d,
                    registration: { ...d.registration, [division]: entries },
                  }))
                }
                onApply={applyDraw}
              />
            ) : (
              <p>
                {saveError
                  ? 'Open Setup & share to recover your tournament.'
                  : 'Loading your tournament…'}
              </p>
            )}
          </>
        )}
        {tab === 'schedule' && (
          <>
            <Head
              k={`TWO GROUNDS · ${visibleMatches.length} MATCHES`}
              t="Match schedule"
              c={canEdit ? "Enter scores, then Save & publish to update the public view." : undefined}
              a={canEdit &&
                <Button
                  variant="outline"
                  className="dark"
                  disabled={!visibleMatches.length}
                  onClick={() => window.print()}
                >
                  <Printer />
                  Print schedule
                </Button>
              }
            />
            {canEdit && <div className="schedule-actions"><Button className="dark" disabled={!visibleMatches.length} onClick={csvDownload}><Download/>Export CSV for Excel</Button>{canEdit && <Button className="dark" disabled={!ready || cloud.saving} onClick={clearDraw}>Clear draw & schedule</Button>}</div>}
            {!visibleMatches.length && <p className="draw-error">{ready ? (canEdit ? 'No confirmed draw yet. Confirm your draw, then Save & publish.' : 'The schedule will appear after the organizers publish the draw.') : 'Loading tournament…'}</p>}
            {canEdit && visibleMatches.length>0 && <ScheduleExport data={{...data,matches:visibleMatches}}/>}
            {canEdit && <p className="schedule-note">
              Men: 2 × 20 minutes · Women: 2 × 15 minutes. Allow 5 minutes for
              half-time.
            </p>}
            {[1, 2].filter(day=>visibleMatches.some(m=>m.day===day)).map((day) => (
              <div className="day" key={day}>
                <h3>
                  <CalendarDays />
                  {date(day === 1 ? data.date1 : data.date2)}
                </h3>
                <p className="schedule-break">
                  {day === 1
                    ? 'Tournament starts at 20:00 · Both grounds'
                    : canEdit ? 'Prayer break: 10:00–15:00 · No matches on either ground' : 'Prayer break: 10:00–15:00'}
                </p>
                <div className="fixtures">
                  {[...new Set(visibleMatches.filter(m=>m.day===day).map(m=>m.time))].map(time => (
                    <div className="fixture-pair" key={time}>
                    {visibleMatches.filter(m=>m.day===day && m.time===time).map((m) => (
                      <article
                        className={
                          'fixture ' +
                          (m.division.includes('Women') ? 'women' : '')
                        }
                        key={m.id}
                      >
                        <div className="when">
                          <b>{m.time}</b>
                          <span>GROUND {m.ground}</span>
                          <small>{m.division}</small>
                        </div>
                        <FixtureTeam
                          name={m.home}
                          entries={
                            data.registration[
                              m.division.includes('Women') ? 'women' : 'men'
                            ]
                          }
                          home
                        />
                        {canEdit ? <input
                          className="score"
                          readOnly={!canEdit || cloud.saving}
                          aria-label="Team score"
                          value={m.hs}
                          inputMode="numeric"
                          onChange={(e) => score(m.id, 'hs', e.target.value)}
                        /> : <span className="score public-score">{m.hs || "–"}</span>}
                        <i className="fixture-versus">
                          <span className="screen-dash">—</span>
                          <span className="print-vs">vs</span>
                        </i>
                        {canEdit ? <input
                          className="score"
                          readOnly={!canEdit || cloud.saving}
                          aria-label="Team score"
                          value={m.as}
                          inputMode="numeric"
                          onChange={(e) => score(m.id, 'as', e.target.value)}
                        /> : <span className="score public-score">{m.as || "–"}</span>}
                        <FixtureTeam
                          name={m.away}
                          entries={
                            data.registration[
                              m.division.includes('Women') ? 'women' : 'men'
                            ]
                          }
                        />
                      </article>
                    ))}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
        {tab === 'standings' && !data.confirmed.men && !data.confirmed.women && <p>No confirmed draw yet.</p>}
        {tab === 'standings' && (data.confirmed.men || data.confirmed.women) && (
          <>
            <Head
              k="LIVE FROM GROUP SCORES"
              t="Standings"
              c="Ranked by points, goal difference, then goals scored."
            />
            {[
              ['MEN’S GROUP A', st.a],
              ['MEN’S GROUP B', st.b],
              ['WOMEN’S GROUP', st.w],
            ].map((x) => (
              <Stand
                key={String(x[0])}
                title={String(x[0])}
                rows={x[1] as any[]}
              />
            ))}
          </>
        )}
        {tab === 'bracket' && !(data.confirmed.men && data.confirmed.women) && <p>Confirm both draws to see the finals bracket.</p>}
        {tab === 'bracket' && data.confirmed.men && data.confirmed.women && (
          <>
            <Head
              k="FINALS NIGHT · 18 SEPTEMBER"
              t="Semifinals & Finals"
              c={canEdit ? "Teams qualify after all group results are entered and ranking ties are resolved." : undefined}
            />
            <div className="bracket">
              <Final
                label="SEMIFINAL 1"
                a={qualifiedTeam(data.matches, 'Men A', data.confirmed.men, st.a, 0)}
                b={qualifiedTeam(data.matches, 'Men B', data.confirmed.men, st.b, 1)}
                time="17:30 · Ground 1"
              />
              <Final
                label="SEMIFINAL 2"
                a={qualifiedTeam(data.matches, 'Men B', data.confirmed.men, st.b, 0)}
                b={qualifiedTeam(data.matches, 'Men A', data.confirmed.men, st.a, 1)}
                time="17:30 · Ground 2"
              />
              <Final
                label="MEN’S FINAL"
                a="Semifinal 1 winner"
                b="Semifinal 2 winner"
                time="20:45 · Ground 1"
                final
              />
              <Final
                label="WOMEN’S FINAL"
                a={qualifiedTeam(data.matches, 'Women', data.confirmed.women, st.w, 0)}
                b={qualifiedTeam(data.matches, 'Women', data.confirmed.women, st.w, 1)}
                time="20:00 · Ground 1"
                women
              />
            </div>
          </>
        )}
        {canEdit && tab === 'setup' && (
          <>
            <p>Select Save & publish to save changes to the shared database. Export data keeps a backup of teams, logos, draws and scores; CSV shares the schedule with organizers.</p>
            <Head
              k="SHARED TOURNAMENT"
              t="Setup & share"
              c="Drafts stay on this device until you select Save & publish."
            />
            <div className="settings">
              <div className="panel">
                <h3>TOURNAMENT DETAILS</h3>
                {[
                  ['Name', 'title', 'text'],
                  ['Venue', 'venue', 'text'],
                  ['Day one', 'date1', 'date'],
                  ['Day two', 'date2', 'date'],
                ].filter(x => canEdit || !['teams','draw','setup'].includes(x[0])).map((x) => (
                  <label key={x[1]}>
                    {x[0]}
                    <Input
                      type={x[2]}
                      value={(data as any)[x[1]]}
                      onChange={(e) =>
                        setData({ ...data, [x[1]]: e.target.value })
                      }
                    />
                  </label>
                ))}
              </div>
              <div className="panel">
                <h3>SHARE & BACKUP</h3>
                <Button className="wide action" onClick={copy}>
                  <Clipboard />
                  Copy summary
                </Button>
                <Button
                  className="wide dark"
                  variant="outline"
                  onClick={() => window.print()}
                >
                  <Printer />
                  Print / save PDF
                </Button>
                <Button
                  className="wide dark"
                  variant="outline"
                  onClick={download}
                >
                  <Download />
                  Export data
                </Button>
                <Button
                  className="wide dark"
                  variant="outline"
                  onClick={() => file.current?.click()}
                >
                  <FileUp />
                  Import data
                </Button>
                <input
                  hidden
                  ref={file}
                  type="file"
                  accept="application/json"
                  onChange={(e) => upload(e.target.files?.[0])}
                />
                <Button
                  className="wide reset"
                  variant="ghost"
                  onClick={() =>
                    confirm('Reset all teams, logos, draws and scores?') &&
                    setData(fresh())
                  }
                >
                  <RotateCcw />
                  Reset tournament
                </Button>
              </div>
            </div>
          </>
        )}
        {tab === 'schedule' && visibleMatches.length>0 && <div className="print-sponsors"><img src="/sponsors-transparent.png" alt="Our sponsors"/></div>}
      </section>
      <footer className="shell footer">
        <div className="footer-sponsors"><img src="/sponsors-transparent.png" alt="Our sponsors" loading="lazy"/></div>
        <div className="footer-title"><b>{data.title}</b>
      {!cloud.session && <div className="footer-login footer-login-inline"><CloudAccess canEdit={canEdit} dirty={cloud.dirty} saving={cloud.saving} ready={ready} publish={cloud.publish} recover={recover}/></div>}
        </div>
        <span>
          {date(data.date1)} & {date(data.date2)} · {data.venue}
        </span>
      </footer>
    </main>
  );
}
function Head({
  k,
  t,
  c,
  a,
}: {
  k: string;
  t: string;
  c?: string;
  a?: React.ReactNode;
}) {
  return (
    <div className="head">
      <div>
        <p className="kicker">{k}</p>
        <h1>{t}</h1>
        {c && <p>{c}</p>}
      </div>
      {a}
    </div>
  );
}
function Stand({ title, rows }: { title: string; rows: any[] }) {
  return (
    <div className="stand">
      <h3>{title}</h3>
      <p className="stand-scroll-hint">Swipe sideways to see all statistics →</p>
      <div className="stand-scroll" role="region" aria-label={title + " standings"} tabIndex={0}>
      <table>
        <thead>
          <tr>
            <th>Team</th>
            {['P', 'W', 'D', 'L', 'GF', 'GA', 'GD', 'PTS'].map((x) => (
              <th key={x}>{x}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.team}>
              <td>
                <b>{i + 1}</b>
                {r.team}
              </td>
              {['p', 'w', 'd', 'l', 'gf', 'ga', 'gd', 'pts'].map((x) => (
                <td className={x === 'pts' ? 'pts' : ''} key={x}>
                  {r[x]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
function Final({
  label,
  a,
  b,
  time,
  final,
  women,
}: {
  label: string;
  a?: string;
  b?: string;
  time: string;
  final?: boolean;
  women?: boolean;
}) {
  return (
    <article
      className={'final ' + (final ? 'gold ' : '') + (women ? 'women' : '')}
    >
      <header>
        <b>{label}</b>
        <small>{time}</small>
      </header>
      <p>
        <span>{a || 'To be confirmed'}</span>
        <i>VS</i>
        <span>{b || 'To be confirmed'}</span>
      </p>
    </article>
  );
}

function FixtureTeam({
  name,
  entries,
  home,
}: {
  name: string;
  entries: Entry[];
  home?: boolean;
}) {
  const team = entries.find((t) => t.name === name);
  return (
    <div className={`fixture-team ${home ? 'home' : 'away'}`}>
      {team && <Logo team={team} />}
      <span>{name}</span>
    </div>
  );
}
