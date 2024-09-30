import type { CreditNote } from 'orb-billing/resources/credit-notes';
import type { PostgresClient } from '../database/postgres';
import { creditNoteSchema } from '../schemas/credit_note';
import type Orb from 'orb-billing';
import { CreditNotesFetchParams } from '../types';

const TABLE = 'credit_notes';
const TIMER_LOGGING_LABEL = 'fetch-credit-notes';

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
  let numberOfCreditNotes = 0;

  console.time(TIMER_LOGGING_LABEL);
  let creditNotesPage = await orbClient.creditNotes.list({ limit: params.limit || 100 });
  console.timeEnd(TIMER_LOGGING_LABEL);

  numberOfCreditNotes += creditNotesPage.data.length;

  await syncCreditNotes(postgresClient, creditNotesPage.data);

  while (creditNotesPage.hasNextPage()) {
    console.time(TIMER_LOGGING_LABEL);
    creditNotesPage = await creditNotesPage.getNextPage();
    console.timeEnd(TIMER_LOGGING_LABEL);

    numberOfCreditNotes += creditNotesPage.data.length;

    await syncCreditNotes(postgresClient, creditNotesPage.data);
  }

  return numberOfCreditNotes;
}

export async function fetchAndSyncCreditNote(postgresClient: PostgresClient, orbClient: Orb, creditNoteId: string) {
  const creditNote = await orbClient.creditNotes.fetch(creditNoteId);

  await syncCreditNotes(postgresClient, [creditNote]);
}
