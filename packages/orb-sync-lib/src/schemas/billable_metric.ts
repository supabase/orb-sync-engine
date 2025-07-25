import type { JsonSchema } from './types';

export const billableMetricSchema: JsonSchema = {
  $id: 'billableMetricSchema',
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    description: { type: 'string' },
    status: { type: 'string' },
    item_id: { type: 'string' },
    metadata: { type: 'object' },
    last_synced_at: { type: 'string' },
  },
  required: ['id'],
} as const;
