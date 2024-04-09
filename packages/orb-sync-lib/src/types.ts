import type { CreditNote, Customer, Invoice, Subscription } from 'orb-billing/resources';

export type OrbWebhookType =
  | 'customer.created'
  | 'customer.credit_balance_depleted'
  | 'customer.credit_balance_dropped'
  | 'subscription.created'
  | 'subscription.started'
  | 'subscription.ended'
  | 'subscription.plan_changed'
  | 'subscription.usage_exceeded'
  | 'subscription.cost_exceeded'
  | 'invoice.issued'
  | 'invoice.payment_failed'
  | 'invoice.payment_succeeded'
  | 'invoice.edited'
  | 'invoice.manually_marked_as_void'
  | 'credit_note.issued'
  | 'credit_note.marked_as_void';

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
