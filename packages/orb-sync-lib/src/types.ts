import type { CreditNote, Customer, Invoice, Subscription } from 'orb-billing/resources';

export type OrbWebhookType =
  | 'billable_metric.edited'
  | 'credit_note.accounting_sync_failed'
  | 'credit_note.accounting_sync_succeeded'
  | 'credit_note.issued'
  | 'credit_note.marked_as_void'
  | 'customer.accounting_sync_failed'
  | 'customer.accounting_sync_succeeded'
  | 'customer.balance_transaction_created'
  | 'customer.created'
  | 'customer.credit_balance_depleted'
  | 'customer.credit_balance_dropped'
  | 'customer.credit_balance_recovered'
  | 'customer.edited'
  | 'data_exports.transfer_error'
  | 'data_exports.transfer_success'
  | 'invoice.accounting_sync_failed'
  | 'invoice.accounting_sync_succeeded'
  | 'invoice.edited'
  | 'invoice.invoice_date_elapsed'
  | 'invoice.issue_failed'
  | 'invoice.issued'
  | 'invoice.manually_marked_as_paid'
  | 'invoice.manually_marked_as_void'
  | 'invoice.payment_failed'
  | 'invoice.payment_processing'
  | 'invoice.payment_succeeded'
  | 'invoice.sync_failed'
  | 'invoice.sync_succeded'
  | 'invoice.undo_mark_as_paid'
  | 'resource_event.test'
  | 'subscription.cancellation_scheduled'
  | 'subscription.cancellation_unscheduled'
  | 'subscription.cost_exceeded'
  | 'subscription.created'
  | 'subscription.edited'
  | 'subscription.ended'
  | 'subscription.fixed_fee_quantity_updated'
  | 'subscription.plan_change_scheduled'
  | 'subscription.plan_changed'
  | 'subscription.plan_version_change_scheduled'
  | 'subscription.plan_version_changed'
  | 'subscription.started'
  | 'subscription.usage_exceeded'
  | 'transaction.accounting_sync_succeeded'
  | 'transaction.accounting_sync_failed'
  ;

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

export type SubscriptionCostExceededWebhook = {
  subscription: Subscription;
  properties: {
    timeframe_start: string;
    timeframe_end: string;
    amount_threshold: number;
  };
} & OrbWebhook;

export type SubscriptionUsageExceededWebhook = {
  subscription: Subscription;
  properties: {
    billable_metric_id: string;
    timeframe_start: string;
    timeframe_end: string;
    quantity_threshold: number;
  };
} & OrbWebhook;

export type BillableMetricsFetchParams = {
  limit?: number;
  createdAtGt?: string | null;
  createdAtGte?: string | null;
  createdAtLt?: string | null;
  createdAtLte?: string | null;
};
