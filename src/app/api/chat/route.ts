import { anthropic } from '@ai-sdk/anthropic';
import { streamText } from "ai";
import { displayResults } from "./tools/displayResults";
import { queryDatabase } from "./tools/queryDatabase";
import { SYSTEM_PROMPT } from './prompts';
import { selectTable } from './tools/selectTable';
export const maxDuration = 30;

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
			//model: anthropic("claude-3-5-haiku-latest"),
			model: anthropic("claude-3-5-sonnet-latest"),
			messages,
			toolCallStreaming: true,
			tools,
			maxSteps: 5,
		});

		return result.toDataStreamResponse({
			getErrorMessage: (error) => {
				console.error("ERREUR AVEC LE STREAMING DE LA RESPONSE API CALL:", error);
				return "An error occurred during the API call.";
			},
		});
	} catch (err) {
		console.error("ERREUR PLUS GLOBALE", err);
		return new Response("Internal Server Error", { status: 500 });
	}
}
