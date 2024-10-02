import type Orb from 'orb-billing';
import type { Subscription } from 'orb-billing/resources/subscriptions';
import type { PostgresClient } from '../database/postgres';
import { subscriptionSchema, updateSubscriptionBillingCycleSchema } from '../schemas/subscription';
import { SubscriptionsFetchParams } from '../types';

const TABLE = 'subscriptions';

export async function syncSubscriptions(postgresClient: PostgresClient, subscriptions: Subscription[]) {
  return postgresClient.upsertMany(
    subscriptions.map((subscription) => ({
      ...subscription,
      customer_id: subscription.customer.id,
      plan_id: subscription.plan.id,
    })),
    TABLE,
    subscriptionSchema
  );
}

export async function syncCurrentBillingCycle(postgresClient: PostgresClient, subscriptions: Subscription[]) {
  return postgresClient.updateMany(
    subscriptions.map((subscription) => ({
      id: subscription.id,
      current_billing_period_start_date: subscription.current_billing_period_start_date,
      current_billing_period_end_date: subscription.current_billing_period_end_date,
    })),
    TABLE,
    updateSubscriptionBillingCycleSchema
  );
}

export async function fetchAndSyncSubscriptions(
  postgresClient: PostgresClient,
  orbClient: Orb,
  params: SubscriptionsFetchParams
): Promise<number> {
  const subscriptions = [];

  for await (const invoice of orbClient.subscriptions.list({
    limit: params.limit || 100,
    'created_at[gt]': params.createdAtGt,
    'created_at[gte]': params.createdAtGte,
    'created_at[lt]': params.createdAtLt,
    'created_at[lte]': params.createdAtLte,
  })) {
    subscriptions.push(invoice);
  }

  await syncSubscriptions(postgresClient, subscriptions);

  return subscriptions.length;
}

export async function fetchAndSyncSubscription(postgresClient: PostgresClient, orbClient: Orb, subscriptionId: string) {
  const subscription = await orbClient.subscriptions.fetch(subscriptionId);

  await syncSubscriptions(postgresClient, [subscription]);
}
