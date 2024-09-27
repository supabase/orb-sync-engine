import type Orb from 'orb-billing';
import type { Subscription } from 'orb-billing/resources/subscriptions';
import type { PostgresClient } from '../database/postgres';
import { subscriptionSchema } from '../schemas/subscription';
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

export async function fetchAndSyncSubscriptions(
  postgresClient: PostgresClient,
  orbClient: Orb,
  params: SubscriptionsFetchParams
): Promise<number> {
  const subscriptions = [];

  let subscriptionsPage = await orbClient.subscriptions.list({
    limit: params.limit || 100,
    'created_at[gt]': params.createdAtGt,
    'created_at[gte]': params.createdAtGte,
    'created_at[lt]': params.createdAtLt,
    'created_at[lte]': params.createdAtLte,
  });
  subscriptions.push(...subscriptionsPage.data);

  while (subscriptionsPage.hasNextPage()) {
    subscriptionsPage = await subscriptionsPage.getNextPage();
    subscriptions.push(...subscriptionsPage.data);
  }

  await syncSubscriptions(postgresClient, subscriptions);

  return subscriptions.length;
}

export async function fetchAndSyncSubscription(postgresClient: PostgresClient, orbClient: Orb, subscriptionId: string) {
  const subscription = await orbClient.subscriptions.fetch(subscriptionId);

  await syncSubscriptions(postgresClient, [subscription]);
}
