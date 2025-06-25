import { OrbSync } from 'orb-sync-lib';

/**
 * Deletes test data from the database to ensure clean test state.
 *
 * @param orbSync - The OrbSync instance
 * @param table - The table name to delete from
 * @param ids - Array of IDs to delete
 */
export async function deleteTestData(orbSync: OrbSync, table: string, ids: string[]) {
  if (!ids.length) return;
  const postgresClient = orbSync.getPostgresClient();
  const placeholders = ids.map((_, index) => `$${index + 1}`).join(',');
  await postgresClient.query(`DELETE FROM orb.${table} WHERE id IN (${placeholders})`, ids);
}

/**
 * Fetches invoices from the database by their IDs.
 *
 * @param orbSync - The OrbSync instance
 * @param ids - The IDs of the invoices to fetch
 * @returns The invoices
 */
export async function fetchInvoices(orbSync: OrbSync, ids: string[]) {
  const postgresClient = orbSync.getPostgresClient();
  if (ids.length === 0) return [];

  const placeholders = ids.map((_, index) => `$${index + 1}`).join(',');
  const result = await postgresClient.query(
    `SELECT id, invoice_number, customer_id, total, currency, status, updated_at FROM orb.invoices WHERE id IN (${placeholders})`,
    ids
  );
  return result.rows;
}

/**
 * Fetches billing cycles from the database by subscription ID.
 *
 * @param orbSync - The OrbSync instance
 * @param subscriptionId - The ID of the subscription to fetch billing cycles for
 * @returns The billing cycles
 */
export async function fetchBillingCycles(orbSync: OrbSync, subscriptionId: string) {
  const postgresClient = orbSync.getPostgresClient();
  const result = await postgresClient.query(
    'SELECT id, current_billing_period_start_date, current_billing_period_end_date FROM orb.subscriptions WHERE id = $1',
    [subscriptionId]
  );
  return result.rows;
}
