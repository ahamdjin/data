import { tool } from 'ai';
import { z } from 'zod';
import { SELECT_DB_TOOL_DESCRIPTION } from '../prompts';
import { sql } from "@/providers/db";

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
  }),
  execute: async ({ selectedTables }) => {
    console.log('Selected tables:\n', selectedTables);

    const tableSchemas = [];

    // For each selected table, fetch its schema
    for (const tableName of selectedTables) {
      // Using a parameterized query with tagged template literals to avoid SQL injection.
      const rows = await sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = ${tableName}
        ORDER BY ordinal_position;
      `;

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