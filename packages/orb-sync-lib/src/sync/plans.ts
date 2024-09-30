import type Orb from 'orb-billing';
import type { Plan } from 'orb-billing/resources/plans/plans';
import type { PostgresClient } from '../database/postgres';
import { PlansFetchParams } from '../types';
import { planSchema } from '../schemas/plan';

const TABLE = 'plans';
const TIMER_LOGGING_LABEL = 'fetch-plans';

export async function syncPlans(postgresClient: PostgresClient, plans: Plan[]) {
  return postgresClient.upsertMany(plans, TABLE, planSchema);
}

export async function fetchAndSyncPlans(
  postgresClient: PostgresClient,
  orbClient: Orb,
  params: PlansFetchParams
): Promise<number> {
  let numberOfPlans = 0;

  console.time(TIMER_LOGGING_LABEL);
  let plansPage = await orbClient.plans.list({
    limit: params.limit || 100,
    'created_at[gt]': params.createdAtGt,
    'created_at[gte]': params.createdAtGte,
    'created_at[lt]': params.createdAtLt,
    'created_at[lte]': params.createdAtLte,
  });
  console.timeEnd(TIMER_LOGGING_LABEL);

  numberOfPlans += plansPage.data.length;

  await syncPlans(postgresClient, plansPage.data);

  while (plansPage.hasNextPage()) {
    console.time(TIMER_LOGGING_LABEL);
    plansPage = await plansPage.getNextPage();
    console.timeEnd(TIMER_LOGGING_LABEL);

    numberOfPlans += plansPage.data.length;

    await syncPlans(postgresClient, plansPage.data);
  }

  return numberOfPlans;
}

export async function fetchAndSyncPlan(postgresClient: PostgresClient, orbClient: Orb, planId: string) {
  const plan = await orbClient.plans.fetch(planId);

  await syncPlans(postgresClient, [plan]);
}
