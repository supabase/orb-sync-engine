import type { CreditNote, Customer, Invoice, Subscription } from 'orb-billing/resources';

export type OrbWebhookType =
  | 'customer.created'
  | 'customer.credit_balance_depleted'
  | 'customer.credit_balance_dropped'
  | 'customer.edited'
  | 'subscription.created'
  | 'subscription.started'
  | 'subscription.edited'
  | 'subscription.fixed_fee_quantity_updated'
  | 'subscription.ended'
  | 'subscription.plan_changed'
  | 'subscription.usage_exceeded'
  | 'subscription.cost_exceeded'
  | 'subscription.plan_version_change_scheduled'
  | 'subscription.plan_version_changed'
  | 'invoice.invoice_date_elapsed'
  | 'invoice.issue_failed'
  | 'invoice.issued'
  | 'invoice.payment_failed'
  | 'invoice.payment_processing'
  | 'invoice.payment_succeeded'
  | 'invoice.edited'
  | 'invoice.manually_marked_as_void'
  | 'invoice.manually_marked_as_paid'
  | 'invoice.undo_mark_as_paid'
  | 'invoice.sync_succeded'
  | 'invoice.sync_failed'
  | 'credit_note.issued'
  | 'credit_note.marked_as_void'
  | 'resource_event.test';

export type OrbWebhook = {
  // Unique to this WebhookEvent resource, and can be used for idempotency (process-once) purposes
  id: string;
  // ISO8601 `created_at` timestamp of the `WebhookEvent` resource
  created_at: string;
  // Identifies the type of webhook event being triggered
  type: OrbWebhookType;
  // Additional properties specific to this event
  properties: object;
};

export type CustomerWebhook = {
  customer: Customer;
} & OrbWebhook;

export type InvoiceWebhook = {
  invoice: Invoice;
} & OrbWebhook;

export type SubscriptionWebhook = {
  subscription: Subscription;
} & OrbWebhook;

export type CreditNoteWebhook = {
  credit_note: CreditNote;
} & OrbWebhook;

export type SubscriptionsFetchParams = {
  limit?: number;
  createdAtGt?: string | null;
  createdAtGte?: string | null;
  createdAtLt?: string | null;
  createdAtLte?: string | null;
};

export type InvoicesFetchParams = {
  limit?: number;
  createdAtGt?: string | null;
  createdAtGte?: string | null;
  createdAtLt?: string | null;
  createdAtLte?: string | null;
};

export type CustomersFetchParams = {
  limit?: number;
  createdAtGt?: string | null;
  createdAtGte?: string | null;
  createdAtLt?: string | null;
  createdAtLte?: string | null;
};

export type PlansFetchParams = {
  limit?: number;
  createdAtGt?: string | null;
  createdAtGte?: string | null;
  createdAtLt?: string | null;
  createdAtLte?: string | null;
};

export type CreditNotesFetchParams = {
  limit?: number;
};
