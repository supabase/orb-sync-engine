/**
 * Orb currently has no webhook whenever a billing cycle is reset, so subscription billing cycle information may be outdated.
 *
 * As a temporary solution, we use a CRON to look at active subscriptions with a billing cycle end date in the past.
 *
 * Orb provides an API that takes multiple customer ids when looking for subscriptions.
 */

import { OrbSync } from 'orb-sync-lib';
import { logger } from '../utils/logger';

export async function refreshStaleSubscriptions(orbSync: OrbSync) {
  logger.info(`Starting to refresh stale subscriptions`);

  const customerIdsWithOutdatedSubscriptionsData = await orbSync.postgresClient
    .selectMany<{ customer_id: string }>(
      `
        SELECT customer_id FROM orb.subscriptions
        WHERE status = 'active'
        AND current_billing_period_end_date < :now
        LIMIT 2500
        `,
      { now: new Date().toISOString() }
    )
    .then((res) => res.map((it) => it.customer_id));

  const chunkSize = 100;

  logger.info(`${customerIdsWithOutdatedSubscriptionsData.length} customers with stale subscriptions to refresh.`);

  for (let i = 0; i < customerIdsWithOutdatedSubscriptionsData.length; i += chunkSize) {
    const customerIdChunk = customerIdsWithOutdatedSubscriptionsData.slice(i, i + chunkSize);

    const subscriptions = await orbSync.orb.subscriptions.list({
      customer_id: customerIdChunk,
      limit: chunkSize,
    });

    await orbSync.syncCurrentBillingCycle(subscriptions.data);
  }

  logger.info(`Done refreshing stale subscriptions`);
}
