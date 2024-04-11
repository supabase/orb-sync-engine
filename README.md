# Orb Sync Engine

Continuously synchronizes an [Orb](https://www.withorb.com/) account to a Postgres database.

## Motivation

Sometimes you want to analyze your billing data using SQL. Even more importantly, you want to join your billing data to your product/business data.

This server synchronizes your [Orb](https://www.withorb.com/) account to a Postgres database. It can be a new database, or an existing Postgres database.

## How it works

![How it works](./docs/sync-engine-how.png)

- Creates a new schema `orb` in a Postgres database, with tables & columns matching Orb.
- Exposes a `/webhooks` endpoint that listens to any Orb webhooks.
- Inserts/updates/deletes changes into the tables whenever there is a change to Orb.

**Not implemented**

- This will not do an initial load of existing Orb data. You should use CSV loads for this. We might implement this in the future.
- Backfill of data
- Entities that are not supported through webhooks like plans and billable metrics
- `orb-sync-lib` is not yet published as standalone npm package (could be used in serverless functions or anywhere else)

## Supported Webhooks

- [x] customer.created
- [x] customer.credit_balance_depleted
- [x] customer.credit_balance_dropped
- [x] customer.edited
- [x] subscription.created
- [x] subscription.started
- [x] subscription.fixed_fee_quantity_updated
- [x] subscription.ended
- [x] subscription.plan_changed
- [x] subscription.usage_exceeded
- [x] subscription.cost_exceeded
- [x] subscription.plan_version_change_scheduled
- [x] subscription.plan_version_changed
- [x] invoice.invoice_date_elapsed
- [x] invoice.issue_failed
- [x] invoice.issued
- [x] invoice.payment_failed
- [x] invoice.payment_processing
- [x] invoice.payment_succeeded
- [x] invoice.edited
- [x] invoice.manually_marked_as_void
- [x] invoice.manually_marked_as_paid
- [x] invoice.undo_mark_as_paid
- [x] invoice.sync_succeded
- [x] invoice.sync_failed
- [x] credit_note.issued
- [x] credit_note.marked_as_void
- [x] resource_event.test

## Development

**Develop**

- Start a Postgres instance using `cd docker && docker-compose up`
- `mv .env.sample .env` and adjust values as necessary
- `npm run dev:node-fastify` to start the local server
- `npm run test` to run tests across the repo

**Building Docker**

```bash
cd apps/node-fastify
docker build -t orb-sync-engine .
# Ensure env vars are set
docker run -p 8080:8080 orb-sync-engine
```

## Inspiration

Inspired by [stripe-sync-engine](https://github.com/supabase/stripe-sync-engine)
