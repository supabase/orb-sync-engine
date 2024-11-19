import type { PostgresClient } from '../database/postgres';
import { subscriptionCostExceededSchema } from '../schemas/subscription_cost_exceeded';
import { SubscriptionCostExceededWebhook } from '../types';

const TABLE = 'subscription_cost_exceeded';

export async function syncSubscriptionCostExceeded(
  postgresClient: PostgresClient,
  event: SubscriptionCostExceededWebhook
) {
  return postgresClient.upsertMany(
    [
      {
        subscription_id: event.subscription.id,
        customer_id: event.subscription.customer.id,
        external_customer_id: event.subscription.customer.external_customer_id,
        timeframe_start: event.properties.timeframe_start,
        timeframe_end: event.properties.timeframe_end,
        amount_threshold: event.properties.amount_threshold,
      },
    ],
    TABLE,
    subscriptionCostExceededSchema
  );
}
