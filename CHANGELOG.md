# Changelog

All notable changes to this project are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [1.2.2] - 2026-10-30

### Added

- Added a today date filter in the transaction page for ease of filtering
- Adjusted the filtering of date to be in a query level instead of just hiding the rows.

## [1.2.1] - 2026-10-28

### Added

- Added an account filter for the transaction page for viewing specific data for each account.
- Added a new status card in the transaction page for showing the total income, removing the net cash flow.
- Added a transaction button in the dashboard page that redirects to the transaction page and automatically opens the form.

## [1.1.1] - 2026-10-28

### Added

### Security

- Enabled row-level security and added user-specific fetching for the transactions table.
- Updated gitignore to exclude database backup files.

## [1.1.0] - 2026-10-28

### Added

- Filter transactions by all-time, last-month, this-month, and custom dates
- Removed navigation items that are not working or has no specific route
- Added a note textarea in the transaction create/edit forms (no migration created as the transaction table already has the note row)
- Added pagination to the transactions table.
- Enhanced the alert dialog for deletion of transactions.

## [1.0.0] - 2026-10-27

### Added

- Login with Supabase Auth (email and password)
- Add/edit e-wallet and bank accounts with monthly limits
- Limit warnings (yellow at threshold, red at 100%) and dashboard alert banner
- Fee tier table per user and per provider
- Log transactions (cash-in, cash-out, transfer) with automatic balance updates
- Deployment on Cloudflare with the production Supabase project
