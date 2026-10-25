# Cashflow Tracker

A web app to track cash in/out transactions across e-wallets and bank accounts.

## Requirements

- Node.js 20+ and npm
- Docker (running), for the local Supabase stack

## Getting started

```bash
git clone <repo-url>
cd cashflow-tracker
npm install
cp .env.example .env
npm run dev
```

The app runs at http://localhost:5173.

## Scripts

| Script                            | Description                                  |
| --------------------------------- | -------------------------------------------- |
| `npm run dev`                     | Start the dev server                         |
| `npm run build`                   | Typecheck and build for production           |
| `npm run lint`                    | Run ESLint                                   |
| `npm run typecheck`               | Run the TypeScript compiler without emitting |
| `npm run format` / `format:check` | Format with / check Prettier                 |
| `npm test`                        | Run tests (placeholder for now)              |

## Database (Supabase)

The schema lives in `supabase/migrations/` as versioned SQL files, so every environment is built the same way.
**Never change the schema by hand in the Supabase dashboard or Studio.** Create a migration instead.

### Run locally

```bash
npx supabase start      # start the local stack (first run downloads images and is slow)
npx supabase db reset   # rebuild the local DB from migrations, then run supabase/seed.sql
npx supabase stop       # stop the local stack
```

`supabase start` prints the local Project URL, API keys, and Studio URL.
Studio (the local GUI) is at http://127.0.0.1:54323.

`db reset` wipes the local database, so any test rows you added are lost. This is expected.

### Make a schema change

```bash
npx supabase migration new <short_description>
```

Write the SQL in the generated file under `supabase/migrations/`, then run `npx supabase db reset` to confirm it applies cleanly from scratch.

### Link to a remote project

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push    # apply local migrations to the remote project
```

Find the project ref in the Supabase dashboard URL or under Project Settings.

### Schema

| Table          | Purpose                                                           |
| -------------- | ----------------------------------------------------------------- |
| `providers`    | E-wallet or bank providers (GCash, Maya)                          |
| `accounts`     | Individual accounts under a provider, with a monthly limit        |
| `transactions` | Cash in/out entries per account; `amount` and `fee` are `numeric` |

## Definition of Done

- Acceptance criteria met
- Tests added where applicable
- CI is green
- PR reviewed (self-review the next day)
- No new lint or type errors
