import type Orb from 'orb-billing';
import type { Price } from 'orb-billing/resources/shared';
import type { PostgresClient } from '../database/postgres';
import { priceSchema } from '../schemas/price';

const TABLE = 'prices';

function toPriceRow(price: Price) {
  const { item, model_type, ...rest } = price as Price & Record<string, unknown>;

  return {
    ...rest,
    model_type,
    item_id: item.id,
    model_config: rest[`${model_type}_config`],
  };
}

export async function syncPrices(postgresClient: PostgresClient, prices: Price[], syncTimestamp?: string) {
  const timestamp = syncTimestamp || new Date().toISOString();

  return postgresClient.upsertManyWithTimestampProtection(prices.map(toPriceRow), TABLE, priceSchema, timestamp);
}

export async function fetchAndSyncPrices(postgresClient: PostgresClient, orbClient: Orb): Promise<number> {
  let numberOfPrices = 0;

  const prices: Price[] = [];

  for await (const price of orbClient.prices.list()) {
    prices.push(price);
  }

  numberOfPrices += prices.length;

  await syncPrices(postgresClient, prices);

  return numberOfPrices;
}

export async function fetchAndSyncPrice(postgresClient: PostgresClient, orbClient: Orb, priceId: string) {
  const price = await orbClient.prices.fetch(priceId);

  await syncPrices(postgresClient, [price]);
}
