-- Add last_synced_at column to all relevant entity tables
-- This column tracks when each entity was last synchronized with Orb.
-- It enables timestamp-based protection to prevent old webhooks from overwriting newer data.

alter table orb.invoices
add column last_synced_at timestamptz;

alter table orb.customers
add column last_synced_at timestamptz;

alter table orb.subscriptions
add column last_synced_at timestamptz;

alter table orb.credit_notes
add column last_synced_at timestamptz;

alter table orb.plans
add column last_synced_at timestamptz;

alter table orb.billable_metrics
add column last_synced_at timestamptz;
