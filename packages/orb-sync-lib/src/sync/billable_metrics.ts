import type { BillableMetric } from 'orb-billing/resources/metrics';
import type { PostgresClient } from '../database/postgres';
import { billableMetricSchema } from '../schemas/billable_metric';
import type Orb from 'orb-billing';
import { BillableMetricsFetchParams } from '../types';

const TABLE = 'billable_metrics';

export async function syncBillableMetrics(postgresClient: PostgresClient, billableMetrics: BillableMetric[]) {
  return postgresClient.upsertMany(
    billableMetrics.map((billableMetric) => ({
      ...billableMetric,
      item_id: billableMetric.item.id,
    })),
    TABLE,
    billableMetricSchema
  );
}

export async function fetchAndSyncBillableMetrics(
  postgresClient: PostgresClient,
  orbClient: Orb,
  params: BillableMetricsFetchParams
): Promise<number> {
  let numberOfBillableMetrics = 0;

  let billableMetricsPage = await orbClient.metrics.list({
    limit: params.limit || 50,
    'created_at[gt]': params.createdAtGt,
    'created_at[gte]': params.createdAtGte,
    'created_at[lt]': params.createdAtLt,
    'created_at[lte]': params.createdAtLte,
  });
  numberOfBillableMetrics += billableMetricsPage.data.length;

  await syncBillableMetrics(postgresClient, billableMetricsPage.data);

  while (billableMetricsPage.hasNextPage()) {
    billableMetricsPage = await billableMetricsPage.getNextPage();
    numberOfBillableMetrics += billableMetricsPage.data.length;

    await syncBillableMetrics(postgresClient, billableMetricsPage.data);
  }

  return numberOfBillableMetrics;
}

export async function fetchAndSyncBillableMetric(
  postgresClient: PostgresClient,
  orbClient: Orb,
  billableMetricId: string
) {
  const billableMetric = await orbClient.metrics.fetch(billableMetricId);

  await syncBillableMetrics(postgresClient, [billableMetric]);
}
