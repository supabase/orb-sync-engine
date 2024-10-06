import pg from 'pg';
import { pg as sql } from 'yesql';
import type { JsonSchema } from '../schemas/types';
import { randomUUID } from 'node:crypto';

type PostgresConfig = {
  databaseUrl: string;
  schema: string;
};

export class PostgresClient {
  pool: pg.Pool;

  constructor(private config: PostgresConfig) {
    this.pool = new pg.Pool({ connectionString: config.databaseUrl });
  }

  async upsertMany<
    T extends {
      [Key: string]: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    },
  >(entries: T[], table: string, tableSchema: JsonSchema): Promise<T[]> {
    if (!entries.length) return [];

    // Max 5 in parallel to avoid exhausting connection pool
    const chunkSize = 5;
    const results: pg.QueryResult<T>[] = [];

    const timerLoggingLabel = `upsert-many-${randomUUID()}`;
    console.time(timerLoggingLabel);
    for (let i = 0; i < entries.length; i += chunkSize) {
      const chunk = entries.slice(i, i + chunkSize);

      const queries: Promise<pg.QueryResult<T>>[] = [];
      chunk.forEach((entry) => {
        // Inject the values
        const cleansed = this.cleanseArrayField(entry, tableSchema);
        const upsertSql = this.constructUpsertSql(this.config.schema, table, tableSchema);

        const prepared = sql(upsertSql, {
          useNullForMissing: true,
        })(cleansed);

        queries.push(this.pool.query(prepared.text, prepared.values));
      });

      results.push(...(await Promise.all(queries)));
    }
    console.timeEnd(timerLoggingLabel);

    return results.flatMap((it) => it.rows);
  }

  private constructUpsertSql = (schema: string, table: string, tableSchema: JsonSchema): string => {
    const conflict = 'id';
    const properties = tableSchema.properties;

    return `
      insert into "${schema}"."${table}" (
        ${Object.keys(properties)
          .map((x) => `"${x}"`)
          .join(',')}
      )
      values (
        ${Object.keys(properties)
          .map((x) => `:${x}`)
          .join(',')}
      )
      on conflict (
        ${conflict}
      )
      do update set 
        ${Object.keys(properties)
          .map((x) => `"${x}" = :${x}`)
          .join(',')}
      ;`;
  };

  /**
   * Updates a subscription's billing cycle dates, provided that the current end date is in the past (i.e. the subscription
   * data in the database being stale).
   */
  async updateSubscriptionBillingCycle({
    subscriptionId,
    billingCycleStart,
    billingCycleEnd,
  }: {
    subscriptionId: string;
    billingCycleStart: string;
    billingCycleEnd: string;
  }) {
    const updateSql = `
      update "${this.config.schema}"."subscriptions"
      set (current_billing_period_start_date, current_billing_period_end_date) =
      (:current_billing_period_start_date, :current_billing_period_end_date)
      where id = :id and current_billing_period_end_date < :now`;

    const prepared = sql(updateSql, {
      useNullForMissing: true,
    })({
      id: subscriptionId,
      current_billing_period_start_date: billingCycleStart,
      current_billing_period_end_date: billingCycleEnd,
      now: new Date().toISOString(),
    });

    const result = await this.pool.query(prepared.text, prepared.values);

    return result.rows;
  }

  private cleanseArrayField(
    obj: {
      [Key: string]: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    },
    tableSchema: JsonSchema
  ): {
    [Key: string]: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  } {
    const cleansed = { ...obj };
    Object.keys(cleansed).map((k) => {
      const definition = tableSchema.properties[k];
      if (definition && (definition as { type: string }).type === 'array') return;
      const data = cleansed[k];
      if (Array.isArray(data)) {
        cleansed[k] = JSON.stringify(data);
      }
    });
    return cleansed;
  }
}
