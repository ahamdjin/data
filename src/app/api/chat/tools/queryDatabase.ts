import { tool } from "ai";
import { z } from "zod";
import { QUERY_DB_TOOL_DESCRIPTION } from "../prompts";
import { sql } from "@/providers/db";

export const queryDatabase = tool({
  description: QUERY_DB_TOOL_DESCRIPTION,
  parameters: z.object({
    table: z.string().describe("Table name"),
    id: z.union([z.number(), z.string()]).describe("Row id"),
  }),
  execute: async ({ table, id }) => {
    console.log("QUERY:", table, id);

    try {
      const result = await sql`SELECT * FROM ${sql(table)} WHERE id = ${id}`;
      return JSON.stringify({
        table,
        id,
        result,
      });
    } catch (error) {
      console.error("Error executing query:", error);
      throw new Error(String(error));
    }
  },
});