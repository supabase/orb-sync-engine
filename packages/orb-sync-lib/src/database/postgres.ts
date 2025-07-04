import pg, { QueryResult } from 'pg';
import { pg as sql } from 'yesql';
import type { JsonSchema } from '../schemas/types';

type PostgresConfig = {
  databaseUrl: string;
  schema: string;
};

export class PostgresClient {
  pool: pg.Pool;

  constructor(private config: PostgresConfig) {
    this.pool = new pg.Pool({ connectionString: config.databaseUrl, max: 25, keepAlive: true });
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

    return results.flatMap((it) => it.rows);
  }

  async upsertManyWithTimestampProtection<
    T extends {
      [Key: string]: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    },
  >(
    entries: T[],
    table: string,
    tableSchema: JsonSchema,
    syncTimestamp: string
  ): Promise<T[]> {
    if (!entries.length) return [];

    // Max 5 in parallel to avoid exhausting connection pool
    const chunkSize = 5;
    const results: pg.QueryResult<T>[] = [];

    for (let i = 0; i < entries.length; i += chunkSize) {
      const chunk = entries.slice(i, i + chunkSize);

      const queries: Promise<pg.QueryResult<T>>[] = [];
      chunk.forEach((entry) => {
        // Inject the values
        const cleansed = this.cleanseArrayField(entry, tableSchema);
        // Add last_synced_at to the cleansed data for SQL parameter binding
        cleansed.last_synced_at = syncTimestamp;
        
        const upsertSql = this.constructUpsertWithTimestampProtectionSql(
          this.config.schema,
          table,
          tableSchema
        );

        const prepared = sql(upsertSql, {
          useNullForMissing: true,
        })(cleansed);

        queries.push(this.pool.query(prepared.text, prepared.values));
      });

      results.push(...(await Promise.all(queries)));
    }

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

  private constructUpsertWithTimestampProtectionSql = (
    schema: string,
    table: string,
    tableSchema: JsonSchema
  ): string => {
    const conflict = 'id';
    const properties = tableSchema.properties;

    // The WHERE clause in ON CONFLICT DO UPDATE only applies to the conflicting row
    // (the row being updated), not to all rows in the table. PostgreSQL ensures that
    // the condition is evaluated only for the specific row that conflicts with the INSERT.
    return `
      INSERT INTO "${schema}"."${table}" (
        ${Object.keys(properties)
          .map((x) => `"${x}"`)
          .join(',')}
      )
      VALUES (
        ${Object.keys(properties)
          .map((x) => `:${x}`)
          .join(',')}
      )
      ON CONFLICT (${conflict}) DO UPDATE SET
        ${Object.keys(properties)
          .filter((x) => x !== 'last_synced_at')
          .map((x) => `"${x}" = EXCLUDED."${x}"`)
          .join(',')},
        last_synced_at = :last_synced_at
      WHERE "${table}"."last_synced_at" IS NULL 
         OR "${table}"."last_synced_at" < :last_synced_at;`;
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

  async query(text: string, params?: string[]): Promise<QueryResult> {
    return this.pool.query(text, params);
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
