import type Orb from 'orb-billing';
import type { Plan } from 'orb-billing/resources/plans/plans';
import type { PostgresClient } from '../database/postgres';
import { PlansFetchParams } from '../types';
import { planSchema } from '../schemas/plan';

const TABLE = 'plans';

export async function syncPlans(postgresClient: PostgresClient, plans: Plan[]) {
  return postgresClient.upsertMany(plans, TABLE, planSchema);
}

export async function fetchAndSyncPlans(
  postgresClient: PostgresClient,
  orbClient: Orb,
  params: PlansFetchParams
): Promise<number> {
  const plans = [];

  for await (const plan of orbClient.plans.list({
    limit: params.limit || 100,
    'created_at[gt]': params.createdAtGt,
    'created_at[gte]': params.createdAtGte,
    'created_at[lt]': params.createdAtLt,
    'created_at[lte]': params.createdAtLte,
  })) {
    plans.push(plan);
  }

  await syncPlans(postgresClient, plans);

  return plans.length;
}

export async function fetchAndSyncPlan(postgresClient: PostgresClient, orbClient: Orb, planId: string) {
  const plan = await orbClient.plans.fetch(planId);

  await syncPlans(postgresClient, [plan]);
}
