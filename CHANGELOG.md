# Changelog

All notable changes to this project are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/).

## [Unreleased]

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
