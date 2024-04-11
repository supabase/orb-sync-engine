import { Pool, QueryResult } from 'pg';
import { pg as sql } from 'yesql';
import type { JsonSchema } from '../schemas/types';

type PostgresConfig = {
  databaseUrl: string;
  schema: string;
};

export class PostgresClient {
  pool: Pool;

  constructor(private config: PostgresConfig) {
    this.pool = new Pool({ connectionString: config.databaseUrl });
  }

  async upsertMany<
    T extends {
      [Key: string]: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    },
  >(entries: T[], table: string, tableSchema: JsonSchema): Promise<T[]> {
    const queries: Promise<QueryResult<T>>[] = [];

    entries.forEach((entry) => {
      // Inject the values
      const cleansed = this.cleanseArrayField(entry, tableSchema);
      const upsertSql = this.constructUpsertSql(this.config.schema, table, tableSchema);

      const prepared = sql(upsertSql, {
        useNullForMissing: true,
      })(cleansed);

      queries.push(this.pool.query(prepared.text, prepared.values));
    });

    // Run it
    const results = await Promise.all(queries);

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
      if (definition && (definition as any).type === 'array') return;
      const data = cleansed[k];
      if (Array.isArray(data)) {
        cleansed[k] = JSON.stringify(data);
      }
    });
    return cleansed;
  }
}
