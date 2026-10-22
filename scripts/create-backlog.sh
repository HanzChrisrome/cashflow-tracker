#!/usr/bin/env bash
# Seeds the cashflow-tracker backlog (T-04 to T-22) as GitHub issues.
#
# Usage (run from inside your repo folder):
#   DRY_RUN=1 bash scripts/create-backlog.sh          # preview only
#   bash scripts/create-backlog.sh                     # create issues
#   PROJECT_TITLE="cashflow-tracker" bash scripts/create-backlog.sh   # also add to a GitHub Project
#
# Optional env vars:
#   REPO=owner/name      target a repo other than the current folder's
#   PROJECT_TITLE=...    exact title of your GitHub Project (needs: gh auth refresh -s project)
#   DRY_RUN=1            print what would be created, create nothing
#
# Issues whose ID (e.g. [T-05]) already exists in the repo are skipped,
# so it is safe to run more than once.

set -euo pipefail

command -v gh >/dev/null 2>&1 || { echo "GitHub CLI (gh) is not installed. See https://cli.github.com"; exit 1; }
gh auth status >/dev/null 2>&1 || { echo "Not logged in. Run: gh auth login"; exit 1; }

REPO_ARGS=()
if [[ -n "${REPO:-}" ]]; then
  REPO_ARGS=(--repo "$REPO")
fi

# ---------- labels ----------
create_label() {
  local name="$1" color="$2" desc="$3"
  if [[ -z "${DRY_RUN:-}" ]]; then
    gh label create "$name" --color "$color" --description "$desc" --force "${REPO_ARGS[@]}" >/dev/null
  fi
}

echo "Creating labels..."
create_label "feature"         "1D76DB" "User-facing feature"
create_label "chore"           "C5DEF5" "Tooling, setup, maintenance"
create_label "spike"           "FBCA04" "Timeboxed research"
create_label "size:S"          "BFD4F2" "Roughly a couple of hours"
create_label "size:M"          "BFD4F2" "Half a day to a day"
create_label "size:L"          "BFD4F2" "Two to three days"
create_label "priority:high"   "B60205" "Do first"
create_label "priority:medium" "D93F0B" "Do next"
create_label "priority:low"    "0E8A16" "Do later"

# ---------- existing issues (for duplicate detection) ----------
if [[ -z "${DRY_RUN:-}" ]]; then
  EXISTING_TITLES="$(gh issue list --state all --limit 500 --json title --jq '.[].title' "${REPO_ARGS[@]}" || true)"
else
  EXISTING_TITLES=""
fi

# ---------- helper ----------
# create_issue "Title" "label1,label2" <<'EOF' ... body ... EOF
create_issue() {
  local title="$1" labels="$2" body id
  body="$(cat)"
  id="${title%%]*}]"   # e.g. "[T-05]"

  if [[ -n "$EXISTING_TITLES" ]] && grep -qF "$id" <<<"$EXISTING_TITLES"; then
    echo "SKIP   $title (already exists)"
    return 0
  fi

  if [[ -n "${DRY_RUN:-}" ]]; then
    echo "DRY    $title  [$labels]"
    return 0
  fi

  local args=(issue create --title "$title" --body "$body" --label "$labels")
  if [[ -n "${PROJECT_TITLE:-}" ]]; then
    args+=(--project "$PROJECT_TITLE")
  fi
  gh "${args[@]}" "${REPO_ARGS[@]}"
  echo "CREATE $title"
}

echo "Creating issues..."

# ============================================================
# Sprint 2 and later: app skeleton and data
# ============================================================

create_issue "[T-04] Authentication (Supabase Auth + RLS)" "feature,size:M,priority:high" <<'EOF'
## User story
As a store owner, I want to log in so that only I (and people I allow) can see the cashflow data.

## Acceptance criteria
- [ ] Login page with email and password using Supabase Auth
- [ ] Login form built with React Hook Form + Zod + shadcn components
- [ ] Wrong credentials show a clear error message
- [ ] Session persists after closing and reopening the browser
- [ ] Logout works and clears the session
- [ ] Auth guard with TanStack Router redirects logged-out users to login
- [ ] Row-level security enabled on all tables, with policies for authenticated users only (added as a migration)
- [ ] Service role key is never used in frontend code or committed
- [ ] Form works well on a phone: large inputs, correct keyboards, show/hide password

## Out of scope
Sign-up, password reset, multiple roles. Create one user manually in the Supabase dashboard.

## Test notes
Valid login, wrong password, protected URL while logged out, API call without a session (should be denied), real phone test.
EOF

# ============================================================
# Features
# ============================================================

create_issue "[T-05] Add and edit an account" "feature,size:M,priority:high" <<'EOF'
## User story
As a store owner, I want to add and edit e-wallet/bank accounts so I can track each one separately.

## Acceptance criteria
- [ ] Fields: provider, nickname, owner name, monthly limit, active/inactive
- [ ] Limits are configurable values, not hardcoded
- [ ] Form uses React Hook Form + Zod; mutation uses TanStack Query
- [ ] Validation blocks empty or negative values
- [ ] Component tests cover validation and success
EOF

create_issue "[T-06] Accounts list" "feature,size:S,priority:high" <<'EOF'
## User story
As a store owner, I want to see all my accounts grouped by provider.

## Acceptance criteria
- [ ] Accounts grouped by provider
- [ ] Inactive accounts look distinct and are hidden from the quick-log screen
- [ ] Loading, empty, and error states handled
EOF

create_issue "[T-07] Log a transaction" "feature,size:L,priority:high" <<'EOF'
## User story
As a store owner, I want to record a cash-in or cash-out in a few taps.

## Acceptance criteria
- [ ] Choose type, account, amount, fee; timestamp defaults to now
- [ ] Numeric keypad on mobile
- [ ] No more than 3 taps after entering the amount
- [ ] Invalid amounts rejected with a clear message
- [ ] Form uses React Hook Form + Zod; mutation invalidates relevant queries
- [ ] Component tests cover validation and success
EOF

create_issue "[T-08] Transaction history list" "feature,size:M,priority:high" <<'EOF'
## User story
As a store owner, I want to see today's transactions so I can check what I've recorded.

## Acceptance criteria
- [ ] Today's transactions, newest first
- [ ] Filter by account and by type
- [ ] Friendly empty state
EOF

create_issue "[T-09] Edit and void a transaction" "feature,size:M,priority:medium" <<'EOF'
## User story
As a store owner, I want to fix mistakes without losing the record.

## Acceptance criteria
- [ ] Voiding marks the record as void instead of deleting it
- [ ] Edits are recorded (what changed and when)
- [ ] Voided transactions are excluded from totals
EOF

create_issue "[T-10] Daily dashboard" "feature,size:M,priority:high" <<'EOF'
## User story
As a store owner, I want a daily summary so I know how the day went.

## Acceptance criteria
- [ ] Total cash-in, total cash-out, fees earned, transaction count
- [ ] Expected drawer cash
- [ ] Switch to previous days
EOF

create_issue "[T-11] Monthly usage per account" "feature,size:M,priority:high" <<'EOF'
## User story
As a store owner, I want to see how much has passed through each account this month so I know which QR to put out.

## Acceptance criteria
- [ ] Per-account monthly total with a progress bar against its limit
- [ ] Counters follow the calendar month and roll over automatically
- [ ] Voided transactions excluded
EOF

create_issue "[T-12] Near-limit warning" "feature,size:S,priority:medium" <<'EOF'
## User story
As a store owner, I want a warning before an account hits its limit.

## Acceptance criteria
- [ ] Yellow at a configurable threshold (e.g. 80%), red at 100%
- [ ] Dashboard banner lists accounts near their limit
EOF

create_issue "[T-13] End-of-day cash count" "feature,size:M,priority:medium" <<'EOF'
## User story
As a store owner, I want to compare counted cash with expected cash to catch mistakes.

## Acceptance criteria
- [ ] Enter actual cash counted
- [ ] App shows over/short against expected cash
- [ ] Result saved with date and optional note
EOF

create_issue "[T-14] Opening balance" "feature,size:S,priority:medium" <<'EOF'
## User story
As a store owner, I want each day to start with the previous day's closing cash.

## Acceptance criteria
- [ ] Opening cash carries over from the last closing count
- [ ] Can be adjusted manually with a note
EOF

create_issue "[T-15] Installable PWA" "feature,size:M,priority:medium" <<'EOF'
## User story
As a store owner, I want to add the app to my phone's home screen.

## Acceptance criteria
- [ ] Web manifest, icons, and splash screen
- [ ] Installable on Android Chrome
- [ ] Lighthouse PWA and accessibility checks pass
EOF

create_issue "[T-16] Offline logging" "feature,size:L,priority:low" <<'EOF'
## User story
As a store owner, I want to keep logging transactions when the internet is down.

## Acceptance criteria
- [ ] Transactions save offline and sync when back online
- [ ] "Pending sync" indicator visible
- [ ] No duplicate transactions after sync

## Notes
Highest-risk ticket. Consider a spike first.
EOF

create_issue "[T-17] Export to CSV" "feature,size:S,priority:low" <<'EOF'
## User story
As a store owner, I want to export transactions for a date range.

## Acceptance criteria
- [ ] Choose a date range and download a CSV
- [ ] Includes account, type, amount, fee, status, timestamp
EOF

# ============================================================
# Setup / enabler tickets
# ============================================================

create_issue "[T-18] Set up Vitest + React Testing Library" "chore,size:S,priority:high" <<'EOF'
## User story
As a developer, I want a test setup so every feature can ship with tests.

## Acceptance criteria
- [ ] Vitest configured with the jsdom environment
- [ ] React Testing Library and `@testing-library/jest-dom` installed, with a setup file
- [ ] `npm run test` runs once and `npm run test:watch` runs in watch mode
- [ ] One example component test passes
- [ ] README documents how to write and run tests

## Out of scope
End-to-end tests (Playwright comes later).
EOF

create_issue "[T-19] Set up shadcn/ui" "chore,size:M,priority:high" <<'EOF'
## User story
As a developer, I want a consistent component library so screens are built quickly and look cohesive.

## Acceptance criteria
- [ ] shadcn/ui initialized following the current official Vite setup guide
- [ ] `components.json` committed, and the `@/components/ui` alias works
- [ ] Base components added: Button, Input, Label, Card, Form, Select, Sonner (toasts)
- [ ] A theme (colors, radius, font) defined in CSS variables, with a note on why those choices were made
- [ ] A demo page renders each component on a phone-sized viewport
- [ ] Biome check still passes with the generated components

## Notes
shadcn's setup steps change with Tailwind and Vite versions, so follow the official docs instead of old tutorials.
EOF

create_issue "[T-20] Set up TanStack Router" "chore,size:M,priority:high" <<'EOF'
## User story
As a developer, I want type-safe routing so navigation and protected pages are easy to manage.

## Acceptance criteria
- [ ] TanStack Router installed and configured (file-based routing with the Vite plugin)
- [ ] Routes exist: `/login`, `/` (home), and a 404 page
- [ ] A layout route wraps authenticated pages (used later for auth guards)
- [ ] Links and navigation use typed route helpers
- [ ] Biome and typecheck pass with the generated route tree

## Out of scope
Auth guard logic (T-04).
EOF

create_issue "[T-21] Set up TanStack Query + Supabase client" "chore,size:S,priority:high" <<'EOF'
## User story
As a developer, I want a standard way to fetch and cache server data.

## Acceptance criteria
- [ ] TanStack Query installed, with `QueryClientProvider` at the app root
- [ ] Supabase client created in one module using env variables
- [ ] Query keys follow a documented convention (e.g. `['accounts']`, `['transactions', { date }]`)
- [ ] One example query hook (e.g. `useProviders`) with loading and error states handled
- [ ] A test covers the hook or component using a test QueryClient

## Out of scope
Mutations for transactions (T-07).
EOF

create_issue "[T-22] Set up React Hook Form + Zod form pattern" "chore,size:S,priority:high" <<'EOF'
## User story
As a developer, I want one standard form pattern so validation is consistent everywhere.

## Acceptance criteria
- [ ] React Hook Form, Zod, and `@hookform/resolvers` installed
- [ ] Pattern documented in `docs/forms.md`: Zod schema -> `useForm` + resolver -> shadcn `Form` components
- [ ] One example form (the login form skeleton) built with this pattern
- [ ] Validation errors show next to the field with clear messages
- [ ] A test submits invalid and valid input and checks the messages
EOF

echo "Done."
