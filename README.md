# Cashflow Tracker

A web app to track cash in/out transactions across e-wallets and bank accounts.

## Requirements

- Node.js 20+ and npm

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

## Definition of Done

- Acceptance criteria met
- Tests added where applicable
- CI is green
- PR reviewed (self-review the next day)
- No new lint or type errors
