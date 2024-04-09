import type { Customer } from 'orb-billing/resources';
import type { PostgresClient } from '../database/postgres';
import { customerSchema } from '../schemas/customer';

const TABLE = 'customers';

export async function syncCustomers(postgresClient: PostgresClient, customers: Customer[]) {
  return postgresClient.upsertMany(customers, TABLE, customerSchema);
}
