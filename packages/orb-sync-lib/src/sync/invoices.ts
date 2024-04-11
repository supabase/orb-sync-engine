import type { Invoice } from 'orb-billing/resources/invoices';
import type { PostgresClient } from '../database/postgres';
import { invoiceSchema } from '../schemas/invoice';

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
