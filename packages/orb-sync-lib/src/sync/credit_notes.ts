import type { CreditNote } from 'orb-billing/resources';
import type { PostgresClient } from '../database/postgres';
import { creditNoteSchema } from '../schemas/credit_note';

const TABLE = 'credit_notes';

export async function syncCreditNotes(postgresClient: PostgresClient, creditNotes: CreditNote[]) {
  return postgresClient.upsertMany(
    creditNotes.map((creditNote) => ({
      ...creditNote,
      customer_id: creditNote.customer.id,
    })),
    TABLE,
    creditNoteSchema
  );
}
