export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  const OLLAMA_URL = process.env.OLLAMA_URL;
  if (!OLLAMA_URL) {
    console.error("[api/tags] Missing OLLAMA_URL environment variable");
    return new Response("Missing OLLAMA_URL environment variable", { status: 500 });
  }

  // OLLAMA_URL should point to your running Ollama instance, e.g. http://127.0.0.1:11434
  const res = await fetch(OLLAMA_URL + "/api/tags");
  return new Response(res.body, res);
}
