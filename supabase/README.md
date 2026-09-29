# Anonymous top 3 per map

The static game calls a single public Edge Function, `leaderboard`. No player account is created. Only the public project URL and publishable key are in `leaderboard-config.js`.

## Deploy

A Supabase administrator must authenticate locally first. Never put a management token, database password, or service-role key in a browser file, commit, or chat.

```sh
npx supabase login
node scripts/prepare-leaderboard.mjs
npx supabase db query --linked --project-ref zgacwqtkmvxjzipbhhvo --file supabase/migrations/202609280001_leaderboard.sql
npx supabase functions deploy leaderboard --project-ref zgacwqtkmvxjzipbhhvo --use-api
```

Run the initial SQL migration once, against a project without these tables. It can also be run in the Supabase SQL Editor. It creates three dedicated tables and three RPCs, without modifying existing application tables. Future database changes should use a new migration.

This uses the current CLI's Management API SQL command and does not require a database password. The Edge Function reads `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from Supabase's server environment; no secret is shipped to the browser. JWT verification is disabled because this endpoint intentionally accepts anonymous players, including clients using the new publishable key. Database tables/RPCs remain inaccessible to anonymous and authenticated API roles.

Deploy and verify the backend before publishing the new browser interface. Browser publication is the existing GitHub Pages push to main.

## Rules

- GET `?map=europe` returns the three public nicknames, scores and timestamps for the current map revision.
- POST `evaluate` accepts a map ID, a random UUID `requestId`, and projected drawing coordinates. It validates size, coordinate bounds and length, then recalculates the score using bundled trusted border geometry. Any client-provided percentage is ignored.
- A qualifying attempt receives a random claim token, valid for 15 minutes. The browser asks for a 1–20 character nickname.
- POST `claim` accepts that token and nickname. A database transaction locks the map's ranking, rechecks qualification and retains only its top 3. Equal scores keep the first published entry. A repeated claim is idempotent.
- Database permission revocations and RLS prevent clients from inserting scores directly or invoking the privileged RPCs.
- The rate limiter allows 12 POSTs per minute per hashed forwarded client IP. It is an abuse guard, not proof of a player's identity. IPs are stored as service-key HMACs, never raw strings. Old buckets and attempts are cleaned on subsequent POSTs; public podium records persist until displaced or administratively removed.
- Traces are not stored. Anonymous players may hold multiple places. There is no identity verification or automated nickname moderation. Nicknames are rendered as text, never HTML.
- Public map geometry permits automated perfect drawings; server validation prevents arbitrary forged percentages, not determined automation. A competitive public launch may also need CAPTCHA and infrastructure-level rate limiting.

Map data and scoring code are bundled by `scripts/prepare-leaderboard.mjs`. Run it after geometry/scoring changes and redeploy the Edge Function. The content-derived revision isolates old rankings after a rules change. `npm test` detects stale generated scoring code or target geometry.

Allowed browser origins: `https://cwoodrow.github.io`, `http://localhost:8000`, and `http://127.0.0.1:8000`. CORS is browser access control, not authentication.

## Checks

```sh
npm test
npx deno check supabase/functions/leaderboard/index.ts
```

Additional development checks were run against temporary PostgreSQL (PGlite): ranking/pruning, ties, stale qualification, repeated claims, expiry, map separation, rate limits and blocked anonymous access. Browser tests use mocked API responses so no fake records are posted to the public leaderboard. The backend is deployed. Live checks verified all five podiums, CORS, server-side score calculation, rejection of invalid drawings, and denied direct access to the tables and RPCs. No public test score was submitted.

## Administration

To remove an abusive nickname, use the SQL Editor as an administrator:

```sql
-- Inspect the target first, then delete by its exact UUID.
select id, map_id, nickname, score from public.leaderboard_entries;
-- delete from public.leaderboard_entries where id = 'THE-EXACT-UUID';
```

Scores are public and supplied nicknames are unverified. Users are told that their nickname and score will be published before submitting.
