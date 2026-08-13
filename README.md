# Priority Grid

A handwritten-notebook-style to-do app with four priority tiers in a 2×2 grid.

## Features

- **1st → 4th priority quadrants** — organize tasks by urgency
- **Add tasks** — type in any quadrant and press Enter or +
- **Drag and drop** — move tasks between tiers as priorities change
- **Checkboxes** — completed items get a strikethrough
- **Persists locally** — tasks are saved in your browser
- **Cloud sync (optional)** — sign in with email via Supabase to sync across devices

## Run locally

Open `index.html` in a browser, or serve the folder:

```bash
./serve.sh
```

Then visit http://127.0.0.1:8765

`./serve.sh` also exposes a local sync API at `/api/sync` for phone + Mac on the same network (no Supabase required).

## Cloud sync with Supabase

For static hosting (e.g. DigitalOcean App Platform) without a custom backend:

1. **Create a Supabase project** at [supabase.com](https://supabase.com).
2. **Run the schema** — paste `supabase/schema.sql` into the Supabase SQL Editor.
3. **Enable email auth** — Authentication → Providers → Email (magic link is on by default).
4. **Add redirect URL** — Authentication → URL Configuration → add your production URL (and `http://127.0.0.1:8765` for local testing).
5. **Configure the app** — copy `supabase-config.example.js` to `supabase-config.js` and set:
   - `url` — Project Settings → API → Project URL
   - `anonKey` — Project Settings → API → anon public key

The anon key is safe to ship in front-end code. Never expose the `service_role` key.

6. **Sign in** — Settings → Data & sync → enter your email and open the magic link.

Sync stores one JSON blob per user (`app_state` table). Local `./serve.sh` sync is still used when Supabase is not configured.

If you already ran the original schema, also run `supabase/schema-history.sql` to enable sync history + restore.

### Sync history

Signed-in devices keep the last ~20 cloud snapshots (Sync now always saves one; auto-saves are throttled). In Settings → Data & sync you can restore any snapshot.

### Optional: live updates

In Supabase, enable replication for `app_state` (Database → Replication) so changes from another device appear without waiting for the poll interval.

## Deploy to DigitalOcean App Platform

1. Connect this repo as a **Static Site** component.
2. Set the output directory to the repo root (or wherever `index.html` lives).
3. Ensure `supabase-config.js` contains your project URL and anon key (commit it, or inject at build time).
4. Add your App Platform URL to Supabase auth redirect URLs.

No web service or Python server is required in production.
