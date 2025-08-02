import { anthropic } from '@ai-sdk/anthropic';
import { streamText } from "ai";
import { displayResults } from "./tools/displayResults";
import { queryDatabase } from "./tools/queryDatabase";
import { SYSTEM_PROMPT } from './prompts';
import { selectTable } from './tools/selectTable';
import { fhir_query } from '@/tools';
import { getActiveConnectors } from '@/connectors/registry';
import { logger, sanitizeMessages } from '@/lib/logger';

export const maxDuration = 30;

// Custom error handler to extract a meaningful error message
export function errorHandler(error: unknown) {
  if (error == null) {
    return 'Unknown error';
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return JSON.stringify(error);
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    logger.debug({ messages: sanitizeMessages(messages) }, "[CHAT-API] Incoming messages");

    messages.unshift(SYSTEM_PROMPT);

    const active = await getActiveConnectors();
    const tools: Record<string, any> = { selectTable, displayResults };
    if (active.postgres) tools.queryDatabase = queryDatabase;
    if (active.fhir) tools.fhir_query = fhir_query;
    if (messages.some((m: any) => m.tool && !(m.tool in tools))) {
      return Response.json({ error: 'Connector not connected' }, { status: 400 });
    }

    const result = streamText({
      model: anthropic("claude-3-5-sonnet-latest"),
      messages,
      toolCallStreaming: true,
      tools,
      maxSteps: 5,
    });

    // Pass the error handler to surface any errors in the stream response
    return result.toDataStreamResponse({
      getErrorMessage: errorHandler,
    });
  } catch (err) {
    logger.error({ err }, "Global error");
    const errorMessage = errorHandler(err);
    // Return an error response with detailed information to the frontend
    return new Response(errorMessage, { status: 500 });
  }
}