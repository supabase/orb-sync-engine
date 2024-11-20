import type { PostgresClient } from '../database/postgres';
import { subscriptionUsageExceededSchema } from '../schemas/subscription_usage_exceeded';
import { SubscriptionUsageExceededWebhook } from '../types';

const TABLE = 'subscription_usage_exceeded';

export async function syncSubscriptionUsageExceeded(
  postgresClient: PostgresClient,
  event: SubscriptionUsageExceededWebhook
) {
  return postgresClient.upsertMany(
    [
      {
        subscription_id: event.subscription.id,
        customer_id: event.subscription.customer.id,
        external_customer_id: event.subscription.customer.external_customer_id,
        timeframe_start: event.properties.timeframe_start,
        timeframe_end: event.properties.timeframe_end,
        quantity_threshold: event.properties.quantity_threshold,
        billable_metric_id: event.properties.billable_metric_id,
      },
    ],
    TABLE,
    subscriptionUsageExceededSchema
  );
}
