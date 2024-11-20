import type { JsonSchema } from './types';

export const subscriptionUsageExceededSchema: JsonSchema = {
  $id: 'subscriptionUsageExceededSchema',
  type: 'object',
  properties: {
    subscription_id: { type: 'string' },
    customer_id: { type: 'string' },
    external_customer_id: { type: 'string' },
    billable_metric_id: { type: 'string' },
    timeframe_start: { type: 'string' },
    timeframe_end: { type: 'string' },
    quantity_threshold: { type: 'number' },
  },
  required: ['billable_metric_id', 'timeframe_start', 'timeframe_end', 'quantity_threshold', 'subscription_id', 'customer_id'],
} as const;
