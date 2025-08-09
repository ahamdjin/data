import { tool } from 'ai';
import { z } from 'zod';
import { SELECT_DB_TOOL_DESCRIPTION } from '../prompts';
import { getAdapter } from "@/db/registry";
import { logger } from "@/lib/logger";

export const selectTable = tool({
  description: SELECT_DB_TOOL_DESCRIPTION,
  parameters: z.object({
    selectedTables: z
      .array(z.enum([
        'users',
        'usage_summary',
        'pricing_plans',
        'token_costs',
        'customer_support_tickets',
        'feature_usage'
      ]))
      .describe("The relevant tables based on the user's request."),
    database: z.string().optional().describe('Database name'),
  }),
  execute: async ({ selectedTables, database = 'default' }) => {
    logger.debug({ selectedTables, database }, 'Selected tables');

    const db = getAdapter(database);

    const tableSchemas = [];

    // For each selected table, fetch its schema
    for (const tableName of selectedTables) {
      // Using parameterized query
      const rows = await db.query(
        `SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position;`,
        [tableName]
      );

      tableSchemas.push({
        tableName,
        columns: rows,
      });
    }

    const selectedTablesString = selectedTables.join(', ');
    return JSON.stringify({
      description: `The relevant tables based on your request are ${selectedTablesString}`,
      selectedTables,
      tables: tableSchemas,
    });
  },
});