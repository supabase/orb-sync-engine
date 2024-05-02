import type Orb from 'orb-billing';
import type { Invoice } from 'orb-billing/resources/invoices';
import type { PostgresClient } from '../database/postgres';
import { invoiceSchema } from '../schemas/invoice';
import { InvoicesFetchParams } from '../types';

const TABLE = 'invoices';

export async function syncInvoices(postgresClient: PostgresClient, invoices: Invoice[]) {
  return postgresClient.upsertMany(
    invoices.map((invoice) => ({
      ...invoice,
      customer_id: invoice.customer.id,
      subscription_id: invoice.subscription?.id,
    })),
    TABLE,
    invoiceSchema
  );
}

export async function fetchAndSyncInvoices(
  postgresClient: PostgresClient,
  orbClient: Orb,
  params: InvoicesFetchParams
): Promise<number> {
  const invoices = [];

  for await (const invoice of orbClient.invoices.list({
    limit: params.limit || 100,
    'invoice_date[gt]': params.createdAtGt,
    'invoice_date[gte]': params.createdAtGte,
    'invoice_date[lt]': params.createdAtLt,
    'invoice_date[lte]': params.createdAtLte,
  })) {
    invoices.push(invoice);
  }

  await syncInvoices(postgresClient, invoices);

  return invoices.length;
}
