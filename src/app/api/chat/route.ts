import { anthropic } from '@ai-sdk/anthropic';
import { streamText } from "ai";
import { displayResults } from "./tools/displayResults";
import { queryDatabase } from "./tools/queryDatabase";
import { SYSTEM_PROMPT } from './prompts';
import { selectTable } from './tools/selectTable';

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
    console.log("[CHAT-API] Incoming messages:", messages);

    messages.unshift(SYSTEM_PROMPT);

    const tools = {
      selectTable,
      queryDatabase,
      displayResults,
    };

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
    console.error("Global error:", err);
    const errorMessage = errorHandler(err);
    // Return an error response with detailed information to the frontend
    return new Response(errorMessage, { status: 500 });
  }
}