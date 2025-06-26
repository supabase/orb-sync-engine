import { PostgresClient } from 'orb-sync-lib';

export async function deleteTestData(postgresClient: PostgresClient, table: string, ids: string[]) {
  if (ids.length === 0) return;
  const placeholders = ids.map((_, index) => `$${index + 1}`).join(',');
  await postgresClient.query(`DELETE FROM orb.${table} WHERE id IN (${placeholders})`, ids);
}

export async function fetchInvoicesFromDatabase(postgresClient: PostgresClient, invoiceIds: string[]) {
  if (invoiceIds.length === 0) return [];

  const placeholders = invoiceIds.map((_, index) => `$${index + 1}`).join(',');
  const result = await postgresClient.query(
    `SELECT id, invoice_number, customer_id, total, currency, status, updated_at FROM orb.invoices WHERE id IN (${placeholders})`,
    invoiceIds
  );
  return result.rows;
}

export async function fetchBillingCyclesFromDatabase(postgresClient: PostgresClient, subscriptionId: string) {
  const result = await postgresClient.query(
    'SELECT id, current_billing_period_start_date, current_billing_period_end_date FROM orb.subscriptions WHERE id = $1',
    [subscriptionId]
  );
  return result.rows;
}
