import type { Subscription } from 'orb-billing/resources';
import type { PostgresClient } from '../database/postgres';
import { subscriptionSchema } from '../schemas/subscription';

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
