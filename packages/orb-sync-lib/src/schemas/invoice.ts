import type { JsonSchema } from './types';

export const invoiceSchema: JsonSchema = {
  $id: 'invoiceSchema',
  type: 'object',
  properties: {
    id: { type: 'string' },
    auto_collection: { type: 'object' },
    billing_address: { type: 'object' },
    created_at: { type: 'string' },
    credit_notes: { type: 'object' },
    currency: { type: 'string' },
    customer_id: { type: 'string' },
    customer_balance_transactions: { type: 'object' },
    customer_tax_id: { type: 'object' },
    discount: { type: 'object' },
    discounts: { type: 'object' },
    due_date: { type: 'string' },
    eligible_to_issue_at: { type: 'string' },
    hosted_invoice_url: { type: 'string' },
    invoice_date: { type: 'string' },
    invoice_number: { type: 'string' },
    invoice_pdf: { type: 'string' },
    invoice_source: { type: 'string' },
    issue_failed_at: { type: 'string' },
    issued_at: { type: 'string' },
    line_items: { type: 'object' },
    maximum: { type: 'object' },
    maximum_amount: { type: 'number' },
    memo: { type: 'string' },
    metadata: { type: 'object' },
    minimum: { type: 'object' },
    minimum_amount: { type: 'number' },
    paid_at: { type: 'string' },
    payment_failed_at: { type: 'string' },
    scheduled_issue_at: { type: 'string' },
    shipping_address: { type: 'object' },
    status: { type: 'string' },
    subscription_id: { type: 'string' },
    subtotal: { type: 'number' },
    total: { type: 'number' },
    amount_due: { type: 'number' },
    sync_failed_at: { type: 'string' },
    voided_at: { type: 'string' },
    will_auto_issue: { type: 'boolean' },
  },
  required: ['id'],
} as const;