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

## Data and current deployment status

This version saves tournament data in the current browser's local storage. Hosting does not synchronize scores between staff devices. Supabase shared storage, realtime updates and officials' authentication are not yet implemented.

Before moving from localhost to the hosted site, choose Setup & share → Export data. Import that JSON file on the hosted site to transfer your tournament, team logos and scores. Browser storage is separate for each address and device. Keep JSON backups; CSV is for sharing fixtures and cannot restore all app data.

Do not commit passwords, API secrets, local environment files or tournament backup files. Team data stored in the browser is not included in this repository.
