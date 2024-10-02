import pg from 'pg';
import { pg as sql } from 'yesql';
import type { JsonSchema } from '../schemas/types';

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
    const sqlQuery = this.constructUpsertSql(this.config.schema, table, tableSchema);
    const results: pg.QueryResult<T>[] = [];

    for (let i = 0; i < entries.length; i += chunkSize) {
      const queries: Promise<pg.QueryResult<T>>[] = [];
      const chunk = entries.slice(i, i + chunkSize);
      chunk.forEach((entry) => {
        // Inject the values
        const cleansed = this.cleanseArrayField(entry, tableSchema);
        const prepared = sql(sqlQuery, {
          useNullForMissing: true,
        })(cleansed);

        queries.push(this.pool.query(prepared.text, prepared.values));
      });

      results.push(...(await Promise.all(queries)));
    }

    return results.flatMap((it) => it.rows);
  }

  async updateMany<
    T extends {
      [Key: string]: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    },
  >(entries: T[], table: string, tableSchema: JsonSchema): Promise<T[]> {
    if (!entries.length) return [];

    // Max 5 in parallel to avoid exhausting connection pool
    const chunkSize = 5;
    const results: pg.QueryResult<T>[] = [];

    for (let i = 0; i < entries.length; i += chunkSize) {
      const queries: Promise<pg.QueryResult<T>>[] = [];
      const chunk = entries.slice(i, i + chunkSize);
      chunk.forEach((entry) => {
        // Inject the values
        const cleansed = this.cleanseArrayField(entry, tableSchema);
        const sqlQuery = this.constructUpdateSql(this.config.schema, table, tableSchema);
        const prepared = sql(sqlQuery, {
          useNullForMissing: true,
        })(cleansed);

        queries.push(this.pool.query(prepared.text, prepared.values));
      });

      results.push(...(await Promise.all(queries)));
    }

    return results.flatMap((it) => it.rows);
  }

  async selectMany<T>(sqlQuery: string, args: Record<string, string | number | boolean>): Promise<T[]> {
    const prepared = sql(sqlQuery, {
      useNullForMissing: true,
    })(args);

    const results = await this.pool.query(prepared.text, prepared.values);

    return results.rows as T[];
  }

  private constructUpsertSql = (schema: string, table: string, tableSchema: JsonSchema): string => {
    const conflict = 'id';
    const properties = Object.keys(tableSchema.properties);

    return `
      insert into "${schema}"."${table}" (
        ${properties.map((x) => `"${x}"`).join(',')}
      )
      values (
        ${properties.map((x) => `:${x}`).join(',')}
      )
      on conflict (
        ${conflict}
      )
      do update set 
        ${properties.map((x) => `"${x}" = :${x}`).join(',')}
      ;`;
  };

  private constructUpdateSql = (schema: string, table: string, tableSchema: JsonSchema): string => {
    const properties = Object.keys(tableSchema.properties);

    return `
      update "${schema}"."${table}"
      set (${properties.map((x) => `"${x}"`).join(',')}) =
      (${properties.map((x) => `:${x}`).join(',')})
      where id = :id`;
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
      if (definition && (definition as { type: string }).type === 'array') return;
      const data = cleansed[k];
      if (Array.isArray(data)) {
        cleansed[k] = JSON.stringify(data);
      }
    });
    return cleansed;
  }
}
