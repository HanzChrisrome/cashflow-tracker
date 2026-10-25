# Cashflow Tracker

Mobile-first PWA for tracking cash-in/cash-out across e-wallet and bank accounts.

## Stack

React + TypeScript (Vite), Tailwind, shadcn/ui, TanStack Router, TanStack Query,
React Hook Form + Zod, Supabase (Postgres, Auth, RLS), Vitest + React Testing Library, Package manager: npm.

## Commands

- npm run dev | build | check | typecheck | test
- supabase start | supabase db reset

## Conventions

- Components in src/components, routes in src/routes, hooks in src/hooks
- Forms: Zod schema -> useForm + resolver -> shadcn Form components
- Server data goes through TanStack Query; no fetching inside components directly
- Money is stored as numeric and never handled as floating point
- Use the `@/` import alias
- Prefer shadcn components over custom ones

## Rules

- Work on one ticket at a time; keep diffs small
- Every feature needs tests
- Schema changes only through migrations in supabase/migrations/
- Never use the Supabase service role key in frontend code
- Never commit .env files
- Run check, typecheck, and test before saying a task is done
- Ask before adding a new dependency

## Git

- Branch per ticket: feature/T-XX-short-name
- Conventional Commits; PR description includes "Closes #<issue>"
