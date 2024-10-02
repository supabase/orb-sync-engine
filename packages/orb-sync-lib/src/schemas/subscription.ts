import type { JsonSchema } from './types';

export const subscriptionSchema: JsonSchema = {
  $id: 'subscriptionSchema',
  type: 'object',
  properties: {
    id: { type: 'string' },
    active_plan_phase_order: { type: 'number' },
    auto_collection: { type: 'boolean' },
    billing_cycle_day: { type: 'number' },
    created_at: { type: 'string' },
    current_billing_period_end_date: { type: 'string' },
    current_billing_period_start_date: { type: 'string' },
    customer_id: { type: 'string' },
    default_invoice_memo: { type: 'string' },
    discount_intervals: { type: 'object' },
    end_date: { type: 'string' },
    fixed_fee_quantity_schedule: { type: 'object' },
    invoicing_threshold: { type: 'string' },
    maximum_intervals: { type: 'object' },
    metadata: { type: 'object' },
    minimum_intervals: { type: 'object' },
    net_terms: { type: 'number' },
    plan: { type: 'object' },
    plan_id: { type: 'string' },
    price_intervals: { type: 'object' },
    redeemed_coupon: { type: 'object' },
    start_date: { type: 'string' },
    status: { type: 'string' },
    trial_info: { type: 'object' },
  },
  required: ['id'],
} as const;

export const updateSubscriptionBillingCycleSchema: JsonSchema = {
  $id: 'updateSubscriptionBillingCycleSchema',
  type: 'object',
  properties: {
    id: { type: 'string' },
    current_billing_period_end_date: { type: 'string' },
    current_billing_period_start_date: { type: 'string' },
  },
  required: ['id', 'current_billing_period_end_date', 'current_billing_period_start_date'],
} as const;
