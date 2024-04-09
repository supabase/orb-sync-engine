import type { JsonSchema } from './types';

export const creditNoteSchema: JsonSchema = {
  $id: 'creditNoteSchema',
  type: 'object',
  properties: {
    id: { type: 'string' },
    created_at: { type: 'createad_at' },
    credit_note_number: { type: 'string' },
    credit_note_pdf: { type: 'string' },
    customer_id: { type: 'string' },
    discounts: { type: 'object' },
    invoice_id: { type: 'string' },
    line_items: { type: 'object' },
    maximum_amount_adjustment: { type: 'object' },
    memo: { type: 'string' },
    minimum_amount_refunded: { type: 'number' },
    reason: { type: 'string' },
    subtotal: { type: 'number' },
    total: { type: 'number' },
    type: { type: 'string' },
    voided_at: { type: 'string' },
  },
  required: ['id'],
} as const;
