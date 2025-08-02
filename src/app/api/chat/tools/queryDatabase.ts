import { tool } from "ai";
import { z } from "zod";
import { QUERY_DB_TOOL_DESCRIPTION } from "../prompts";
import { sql } from "@/providers/db";
import { logger, sanitizeQuery } from "@/lib/logger";

export const queryDatabase = tool({
  description: QUERY_DB_TOOL_DESCRIPTION,
  parameters: z.object({
    table: z.string().describe("Table name"),
    id: z.union([z.number(), z.string()]).describe("Row id"),
  }),
  execute: async ({ table, id }) => {
    logger.debug({ query: sanitizeQuery(table) }, "Executing query");

    try {
      const result = await sql`SELECT * FROM ${sql(table)} WHERE id = ${id}`;
      return JSON.stringify({
        table,
        id,
        result,
      });
    } catch (error) {
      logger.error({ err: error }, "Error executing query");
      throw new Error(String(error));
    }
  },
});