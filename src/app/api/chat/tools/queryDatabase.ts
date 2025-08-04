import { tool } from "ai";
import { z } from "zod";
import { QUERY_DB_TOOL_DESCRIPTION } from "../prompts";
import { getDb } from "@/providers/db";
import { logger, sanitizeQuery } from "@/lib/logger";

export const queryDatabase = tool({
  description: QUERY_DB_TOOL_DESCRIPTION,
  parameters: z.object({
    table: z.string().describe("Table name"),
    id: z.union([z.number(), z.string()]).describe("Row id"),
    database: z.string().optional().describe("Database name"),
  }),
  execute: async ({ table, id, database = "default" }) => {
    logger.debug({ query: sanitizeQuery(table), database }, "Executing query");

    const db = getDb(database);

    try {
      const result = await db`SELECT * FROM ${db(table)} WHERE id = ${id}`;
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