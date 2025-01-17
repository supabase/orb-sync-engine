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
  let numberOfSubscriptions = 0;
  let subscriptionsPage = await orbClient.subscriptions.list({
    limit: params.limit || 100,
    'created_at[gt]': params.createdAtGt,
    'created_at[gte]': params.createdAtGte,
    'created_at[lt]': params.createdAtLt,
    'created_at[lte]': params.createdAtLte,
  });

  numberOfSubscriptions += subscriptionsPage.data.length;

  await syncSubscriptions(postgresClient, subscriptionsPage.data);

  while (subscriptionsPage.hasNextPage()) {
    subscriptionsPage = await subscriptionsPage.getNextPage();
    numberOfSubscriptions += subscriptionsPage.data.length;

    await syncSubscriptions(postgresClient, subscriptionsPage.data);
  }

  return numberOfSubscriptions;
}

export async function fetchAndSyncSubscription(postgresClient: PostgresClient, orbClient: Orb, subscriptionId: string) {
  const subscription = await orbClient.subscriptions.fetch(subscriptionId);

  await syncSubscriptions(postgresClient, [subscription]);
}

export async function updateBillingCycle(
  postgresClient: PostgresClient,
  {
    subscriptionId,
    billingCycleStart,
    billingCycleEnd,
  }: {
    subscriptionId: string;
    billingCycleStart: string;
    billingCycleEnd: string;
  }
) {
  const isBillingCycleStartInThePast = new Date(billingCycleStart) < new Date();
  const isBillingCycleEndInTheFuture = new Date(billingCycleEnd) > new Date();

  if (!isBillingCycleStartInThePast || !isBillingCycleEndInTheFuture) {
    console.info(
      `Billing cycle of subscription ${subscriptionId} is not being updated. start (${billingCycleStart}) / end (${billingCycleEnd}) not suitable`
    );
    return;
  }

  return postgresClient.updateSubscriptionBillingCycle({ subscriptionId, billingCycleStart, billingCycleEnd });
}
