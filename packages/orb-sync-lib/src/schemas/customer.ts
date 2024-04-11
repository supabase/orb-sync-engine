import type { JsonSchema } from './types';

export const customerSchema: JsonSchema = {
  $id: 'customerSchema',
  type: 'object',
  properties: {
    id: { type: 'string' },
    additional_emails: { type: 'array', items: { type: 'string' } },
    auto_collection: { type: 'boolean' },
    balance: { type: 'number' },
    billing_address: { type: 'object' },
    shipping_address: { type: 'object' },
    created_at: { type: 'string' },
    currency: { type: 'string' },
    email: { type: 'string' },
    email_delivery: { type: 'boolean' },
    external_customer_id: { type: 'string' },
    metadata: { type: 'object' },
    name: { type: 'string' },
    payment_provider: { type: 'string' },
    payment_provider_id: { type: 'string' },
    portal_url: { type: 'string' },
    tax_id: { type: 'object' },
    timezone: { type: 'string' },
    accounting_sync_configuration: { type: 'object' },
    reporting_configuration: { type: 'object' },
  },
  required: ['id'],
} as const;
