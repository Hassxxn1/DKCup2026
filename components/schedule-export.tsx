'use client';
import { useState } from 'react';
import { ADK_WHITE_LOGO, BRAND } from '@/lib/brand';
import { Download, ImageDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Registration } from '@/lib/draw';

type Fixture = {
  day: number;
  time: string;
  ground: number;
  division: string;
  home: string;
  away: string;
};
type Schedule = {
  title: string;
  venue: string;
  date1: string;
  date2: string;
  matches: Fixture[];
  registration: Registration;
  organizerLogo?: string;
};
const SPONSOR_STRIP = '/sponsors-transparent.png';
type Poster = { url: string; name: string; label: string };
async function decode(src: string) {
  const img = new Image();
  img.src = src;
  await img.decode();
  return img;
}
export async function renderSchedule(data: Schedule): Promise<Poster[]> {
  const sources = [
    ...new Set(
      [
        ADK_WHITE_LOGO,
        SPONSOR_STRIP,
        ...data.registration.men.map((t) => t.logo),
        ...data.registration.women.map((t) => t.logo),
      ].filter((s): s is string => Boolean(s)),
    ),
  ];
  const images = new Map(
    await Promise.all(
      sources.map(async (src) => [src, await decode(src)] as const),
    ),
  );
  const posters: Poster[] = [];
  for (const day of [1, 2]) {
    const matches = data.matches
      .filter((m) => m.day === day)
      .sort((a, b) => a.time.localeCompare(b.time) || a.ground - b.ground);
    const total = Math.ceil(matches.length / 8);
    for (let page = 0; page < total; page++) {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1350;
      const c = canvas.getContext('2d');
      if (!c) throw new Error('PNG export is not supported in this browser.');
      const text = (
        value: string,
        x: number,
        y: number,
        size: number,
        color = '#f6f3ef',
        max = 960,
        align: CanvasTextAlign = 'left',
      ) => {
        c.textAlign = align;
        c.fillStyle = color;
        let n = size;
        c.font = `700 ${n}px Arial, sans-serif`;
        while (c.measureText(value).width > max && n > 16) {
          n--;
          c.font = `700 ${n}px Arial, sans-serif`;
        }
        let label = value;
        while (c.measureText(label).width > max && label.length > 1)
          label = label.slice(0, -2) + '…';
        c.fillText(label, x, y);
        c.textAlign = 'left';
      };
      const logo = (
        src: string | undefined,
        x: number,
        y: number,
        w: number,
        h: number,
        background = true,
      ) => {
        if (!src) return;
        const img = images.get(src);
        if (!img) return;
        const ratio = Math.min((w - 10) / img.width, (h - 10) / img.height);
        if (background) { c.fillStyle = '#ffffff'; c.fillRect(x, y, w, h); }
        c.drawImage(
          img,
          x + (w - img.width * ratio) / 2,
          y + (h - img.height * ratio) / 2,
          img.width * ratio,
          img.height * ratio,
        );
      };
      c.fillStyle = '#0b0c0e';
      c.fillRect(0, 0, 1080, 1350);
      [BRAND.blue, BRAND.green, BRAND.orange, BRAND.red].forEach((color, i) => {
        c.fillStyle = color;
        c.fillRect(i * 270, 0, 270, 12);
      });
      text('MATCH SCHEDULE', 48, 62, 18, '#00afef', 730);
      text(data.title, 48, 112, 42, '#ffffff', 730);
      text(data.venue, 48, 149, 22, '#bdbfc1', 730);
      logo(ADK_WHITE_LOGO, 862, 18, 170, 150, false);
      const date = day === 1 ? data.date1 : data.date2;
      const dateLabel = new Date(date + 'T00:00:00').toLocaleDateString(
        'en-GB',
        { weekday: 'long', day: 'numeric', month: 'long' },
      );
      c.fillStyle = '#00afef';
      c.fillRect(48, 178, 984, 60);
      text(dateLabel.toUpperCase(), 68, 218, 28, '#111111', 790);
      text(`${page + 1}/${total}`, 1012, 217, 22, '#111111', 90, 'right');
      text('TIME / GROUND', 64, 273, 16, '#94949d', 190);
      text('FIXTURE', 272, 273, 16, '#94949d');
      const batch = matches.slice(page * 8, page * 8 + 8);
      batch.forEach((m, i) => {
        const y = 292 + i * 108,
          women = m.division.includes('Women');
        c.fillStyle = i % 2 ? '#1b1c20' : '#141519';
        c.fillRect(48, y, 984, 100);
        c.fillStyle = women ? '#00a859' : '#00afef';
        c.fillRect(48, y, 4, 100);
        text(m.time, 68, y + 43, 30, '#ffffff', 160);
        text(`GROUND ${m.ground}`, 68, y + 72, 15, '#bdbdc5', 170);
        text(
          m.division.toUpperCase(),
          272,
          y + 23,
          14,
          women ? '#70d6a5' : '#70d9ff',
          730,
        );
        const entries = data.registration[women ? 'women' : 'men'];
        const home = entries.find((t) => t.name === m.home),
          away = entries.find((t) => t.name === m.away);
        logo(home?.logo, 272, y + 39, 42, 42);
        logo(away?.logo, 686, y + 39, 42, 42);
        text(
          m.home,
          home?.logo ? 326 : 272,
          y + 67,
          23,
          '#ffffff',
          home?.logo ? 280 : 334,
        );
        text('VS', 649, y + 65, 15, '#909099', 40, 'center');
        text(
          m.away,
          away?.logo ? 740 : 686,
          y + 67,
          23,
          '#ffffff',
          away?.logo ? 274 : 328,
        );
      });
      const sponsors = images.get(SPONSOR_STRIP)!;
      const sponsorScale = Math.min(984 / sponsors.width, 180 / sponsors.height);
      const sponsorWidth = sponsors.width * sponsorScale;
      const sponsorHeight = sponsors.height * sponsorScale;
      c.drawImage(sponsors, (1080 - sponsorWidth) / 2, 1160 + (180 - sponsorHeight) / 2, sponsorWidth, sponsorHeight);
      posters.push({
        url: canvas.toDataURL('image/png'),
        name: `tournament-day-${day}-${date}-part-${page + 1}.png`,
        label: `${dateLabel} · ${page + 1} of ${total}`,
      });
    }
  }
  return posters;
}
export default function ScheduleExport({
  data,
}: {
  data: Schedule;
}) {
  const [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [posters, setPosters] = useState<Poster[]>([]),
    [snapshot, setSnapshot] = useState('');
  const current = JSON.stringify(data);
  const stale = snapshot !== current;
  const generate = async () => {
    setBusy(true);
    setError('');
    try {
      setPosters(await renderSchedule(data));
      setSnapshot(current);
    } catch {
      setError(
        'Could not create the PNG. Please check the uploaded logos and try again.',
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="schedule-export">
      <Button className="action" onClick={() => setOpen(!open)}>
        <ImageDown />
        Export PNG
      </Button>
      {open && (
        <section
          className="png-panel"
          aria-label="Social media schedule export"
        >
          <div>
            <h3>Share the schedule</h3>
            <p>1080 × 1350 PNG posters, with team logos, sponsors and no scores.</p>
          </div>
          <div className="png-brand">
            {
              <img
                src={ADK_WHITE_LOGO}
                alt="ADK Synergy logo"
                width={110}
                height={70}
              />
            }
            <span>ADK Synergy · white logo</span>
          </div>
          <p>The same white, transparent logo used in the app is included automatically.</p>
          {error && (
            <p role="alert" className="draw-error">
              {error}
            </p>
          )}
          <Button className="action" disabled={busy} onClick={generate}>
            {busy
              ? 'Preparing…'
              : posters.length
                ? 'Refresh PNG previews'
                : 'Create PNG previews'}
          </Button>
          {posters.length > 0 && stale && (
            <p role="status">
              The schedule or logos have changed. Refresh the previews before
              downloading.
            </p>
          )}
          {!stale && (
            <div className="png-previews">
              {posters.map((p) => (
                <figure key={p.name}>
                  <img
                    src={p.url}
                    alt={`Schedule poster: ${p.label}`}
                    width={1080}
                    height={1350}
                  />
                  <figcaption>{p.label}</figcaption>
                  <a className="png-download" href={p.url} download={p.name}>
                    <Download size={16} />
                    Download PNG
                  </a>
                </figure>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
