import type { JsonSchema } from './types';

export const subscriptionCostExceededSchema: JsonSchema = {
  $id: 'subscriptionCostExceededSchema',
  type: 'object',
  properties: {
    subscription_id: { type: 'string' },
    customer_id: { type: 'string' },
    external_customer_id: { type: 'string' },
    timeframe_start: { type: 'string' },
    timeframe_end: { type: 'string' },
    amount_threshold: { type: 'number' },
  },
  required: ['customer_id', 'timeframe_start', 'timeframe_end', 'amount_threshold', 'subscription_id'],
} as const;
