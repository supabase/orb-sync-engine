import type Orb from 'orb-billing';
import type { Customer } from 'orb-billing/resources/customers/customers';
import type { PostgresClient } from '../database/postgres';
import { customerSchema } from '../schemas/customer';
import { CustomersFetchParams } from '../types';

const TABLE = 'customers';
const TIMER_LOGGING_LABEL = 'fetch-customers';

export async function syncCustomers(postgresClient: PostgresClient, customers: Customer[]) {
  return postgresClient.upsertMany(customers, TABLE, customerSchema);
}

export async function fetchAndSyncCustomers(
  postgresClient: PostgresClient,
  orbClient: Orb,
  params: CustomersFetchParams
): Promise<number> {
  let numberOfCustomers = 0;

  console.time(TIMER_LOGGING_LABEL);
  let customersPage = await orbClient.customers.list({
    limit: params.limit || 100,
    'created_at[gt]': params.createdAtGt,
    'created_at[gte]': params.createdAtGte,
    'created_at[lt]': params.createdAtLt,
    'created_at[lte]': params.createdAtLte,
  });
  console.timeEnd(TIMER_LOGGING_LABEL);

  numberOfCustomers += customersPage.data.length;

  await syncCustomers(postgresClient, customersPage.data);

  while (customersPage.hasNextPage()) {
    console.time(TIMER_LOGGING_LABEL);
    customersPage = await customersPage.getNextPage();
    console.timeEnd(TIMER_LOGGING_LABEL);

    numberOfCustomers += customersPage.data.length;

    await syncCustomers(postgresClient, customersPage.data);
  }

  return numberOfCustomers;
}

export async function fetchAndSyncCustomer(postgresClient: PostgresClient, orbClient: Orb, customerId: string) {
  const customer = await orbClient.customers.fetch(customerId);

  await syncCustomers(postgresClient, [customer]);
}
