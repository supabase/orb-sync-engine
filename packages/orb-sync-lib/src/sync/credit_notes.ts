import type { CreditNote } from 'orb-billing/resources/credit-notes';
import type { PostgresClient } from '../database/postgres';
import { creditNoteSchema } from '../schemas/credit_note';
import type Orb from 'orb-billing';
import { CreditNotesFetchParams } from '../types';

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

export async function fetchAndSyncCreditNotes(
  postgresClient: PostgresClient,
  orbClient: Orb,
  params: CreditNotesFetchParams
): Promise<number> {
  const creditNotes = [];

  for await (const creditNote of orbClient.creditNotes.list({ limit: params.limit || 100 })) {
    creditNotes.push(creditNote);
  }

  await syncCreditNotes(postgresClient, creditNotes);

  return creditNotes.length;
}
