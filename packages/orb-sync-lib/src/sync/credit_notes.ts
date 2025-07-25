import type { CreditNote } from 'orb-billing/resources';
import type { PostgresClient } from '../database/postgres';
import { creditNoteSchema } from '../schemas/credit_note';
import type Orb from 'orb-billing';
import { CreditNotesFetchParams } from '../types';

const TABLE = 'credit_notes';

export async function syncCreditNotes(
  postgresClient: PostgresClient,
  creditNotes: CreditNote[],
  syncTimestamp?: string
) {
  const timestamp = syncTimestamp || new Date().toISOString();

  return postgresClient.upsertManyWithTimestampProtection(
    creditNotes.map((creditNote) => ({
      ...creditNote,
      customer_id: creditNote.customer.id,
    })),
    TABLE,
    creditNoteSchema,
    timestamp
  );
}

export async function fetchAndSyncCreditNotes(
  postgresClient: PostgresClient,
  orbClient: Orb,
  params: CreditNotesFetchParams
): Promise<number> {
  let numberOfCreditNotes = 0;
  let creditNotesPage = await orbClient.creditNotes.list({ limit: params.limit || 100 });
  numberOfCreditNotes += creditNotesPage.data.length;

  await syncCreditNotes(postgresClient, creditNotesPage.data);

  while (creditNotesPage.hasNextPage()) {
    creditNotesPage = await creditNotesPage.getNextPage();
    numberOfCreditNotes += creditNotesPage.data.length;

    await syncCreditNotes(postgresClient, creditNotesPage.data);
  }

  return numberOfCreditNotes;
}

export async function fetchAndSyncCreditNote(postgresClient: PostgresClient, orbClient: Orb, creditNoteId: string) {
  const creditNote = await orbClient.creditNotes.fetch(creditNoteId);

  await syncCreditNotes(postgresClient, [creditNote]);
}
