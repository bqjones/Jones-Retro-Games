# Cross-device sync setup (Supabase)

The competition feature syncs the TV, station laptops, host phone, and
spectator phones through a free Supabase project. Without it, everything still
works — but only as multiple tabs of one browser (fine for testing, not for
the reunion).

Total setup time: about 10 minutes, once.

## 1. Create the project

1. Go to [supabase.com](https://supabase.com), sign up (free), and create a
   new project. Any name/region; the free tier is far more than this needs.
2. Wait for the project to finish provisioning (~1 minute).

## 2. Create the tables

In the Supabase dashboard, open **SQL Editor**, paste this, and click Run:

```sql
create table competitions (
  code text primary key,
  data jsonb not null,
  rev int not null default 1,
  updated_at timestamptz default now()
);

create table runs (
  id uuid primary key,
  code text not null,
  data jsonb not null,
  ts bigint
);

create index runs_code_idx on runs (code);

-- Realtime: pushes changes to every connected screen instantly
alter publication supabase_realtime add table competitions;
alter publication supabase_realtime add table runs;

-- This is a family app with obscure join codes, not a bank: allow the
-- anon key to read/write. (Rows are only findable by 5-character code.)
alter table competitions enable row level security;
alter table runs enable row level security;
create policy "anon all" on competitions for all using (true) with check (true);
create policy "anon all" on runs for all using (true) with check (true);
```

## 3. Wire up the site

1. In the dashboard: **Settings → API**. Copy the **Project URL** and the
   **anon public** key.
2. Local dev: copy `.env.example` to `.env` and paste both values in.
3. Vercel: Project → **Settings → Environment Variables**, add
   `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, then redeploy.

## 4. Verify

1. Open the deployed site on two different devices (e.g. laptop + phone).
2. Create a competition on one; the screens show a green **SYNCED** badge.
3. Join by code on the other device — it should find the competition and
   live-update as scores come in.

## Offline behavior (the cabin plan)

- Game files are cached on each device after one online visit (service
  worker) — gameplay never needs the internet.
- If Starlink drops mid-event, screens show **OFFLINE — QUEUED**: score
  entry keeps working, writes queue locally, and everything reconciles
  automatically when the connection returns.
- The night before: open the site once on every device while online, and
  load the competition screens on their assigned devices.
