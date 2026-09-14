# Dhonkaleyfaanu Cup 2026

Tournament registration, manual/random draws, fixtures, scores, standings and PDF/PNG/CSV exports.

## Local use

Requires Node.js 22.13 or later.

```sh
npm ci
npm run dev
```

Open http://localhost:3000 and keep the server running.

## Netlify

Import this repository into Netlify. The included `netlify.toml` sets:

- Build command: `npm run build:netlify`
- Publish directory: `dist-netlify`
- Production branch: `main`

The Netlify build is a static React app. The original local development setup remains available.

## Shared data and officials

Supabase stores the published tournament for all devices. Anyone can view the schedule, scores and standings. The public view checks for updates every 10 seconds; a version check avoids downloading team logos again when nothing has changed.

Officials sign in using a Supabase Auth email/password account and must also appear in `tournament_editors`. There is no public signup or public database write access. Changes remain a local draft until **Save & publish** succeeds. The database rejects stale saves if another official has published first. Export a JSON backup, reload, then reapply the intended changes when a conflict occurs.

### Database setup (once)

1. Run `supabase/setup.sql` in the project's Supabase SQL Editor.
2. In Authentication → Users, create the official's account with an email and password (auto-confirm the email if creating it manually).
3. Authorize that account by running the following SQL, replacing the example email:

```sql
insert into public.tournament_editors (user_id)
select id from auth.users where lower(email) = lower('official@example.com')
on conflict do nothing;
```

Check that one account was found. Signing up or logging in alone never grants editing rights. Never add secret/service-role keys to this app. Its checked-in publishable key is intentionally public; database grants and row-level security enforce access.

### Transfer the existing tournament

Original local data is preserved under its old browser storage key. On localhost, sign in as an official and use **Import this device’s tournament**, review it, then **Save & publish**. The hosted site will show the same published data.

Alternatively, export a JSON backup from the original browser and import it through Setup & share on the hosted app. Browser storage is separate for every address and device. **Restore local draft** recovers unpublished changes after a reload. Keep JSON backups; CSV shares fixtures but cannot restore the complete tournament.

Use https://dkcup2026.netlify.app/ for the public staff view and official sign-in. A connection error means the current display may be stale; do not assume a failed publish was saved. The setup SQL is repeatable and does not delete tournament records.

## Team rosters

The public Teams page lists the 12 registered teams and 128 players imported from the supplied team PDFs. Team-level companies come from the existing mapping; each player keeps the company and jersey number listed in the source PDF. Managers/coaches are not included in player rosters.

Officials can select a team, choose Edit roster, edit/add/remove players, then Save & publish. Overrides are stored by stable registration ID in the same protected Supabase tournament state and included in JSON backups. Initial rosters are bundled as defaults for existing tournaments; loading an older state fills only missing roster keys. An explicitly empty roster stays empty. The admin team-name/logo editor is now labeled Registration.
