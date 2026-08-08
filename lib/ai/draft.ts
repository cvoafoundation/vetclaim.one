// Swappable AI backend. Controlled entirely by environment variables —
// no app code needs to change to switch between a hosted API and a
// self-hosted model. Server-only: never import this into a client
// component, since it reads secret env vars.
//
// AI_PROVIDER = "anthropic" | "self_hosted"
//
// For "anthropic":
//   ANTHROPIC_API_KEY
//
// For "self_hosted": any server exposing an OpenAI-compatible
// /v1/chat/completions endpoint — this is what Ollama, vLLM, and
// text-generation-inference all speak, so this same code works
// regardless of which one is actually running the model.
//   SELF_HOSTED_AI_BASE_URL   e.g. http://your-server:11434/v1
//   SELF_HOSTED_AI_MODEL      e.g. llama3.1:8b
//   SELF_HOSTED_AI_API_KEY    optional, only if your endpoint requires one

export async function draftWithAI(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const provider = process.env.AI_PROVIDER ?? "anthropic";

  if (provider === "self_hosted") {
    return draftWithSelfHosted(systemPrompt, userPrompt);
  }
  return draftWithAnthropic(systemPrompt, userPrompt);
}

async function draftWithAnthropic(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return "AI summary generation is not configured (missing ANTHROPIC_API_KEY).";
  }
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 500,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });
    const data = await response.json();
    return (
      data?.content?.[0]?.text ??
      "The AI service didn't return a usable response. Try again."
    );
  } catch {
    return "AI summary generation failed. Try again in a moment.";
  }
}

async function draftWithSelfHosted(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const baseUrl = process.env.SELF_HOSTED_AI_BASE_URL;
  const model = process.env.SELF_HOSTED_AI_MODEL;

  if (!baseUrl || !model) {
    return "Self-hosted AI is not configured (missing SELF_HOSTED_AI_BASE_URL or SELF_HOSTED_AI_MODEL).";
  }

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.SELF_HOSTED_AI_API_KEY
          ? { Authorization: `Bearer ${process.env.SELF_HOSTED_AI_API_KEY}` }
          : {}),
      },
      body: JSON.stringify({
        model,
        max_tokens: 500,
        temperature: 0.2, // low temperature — this drafts case-file
        // language, not creative writing; we want it boring and
        // consistent, not varied
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      return `Self-hosted AI returned an error (HTTP ${response.status}). Check that the server at ${baseUrl} is running and the model "${model}" is loaded.`;
    }

    const data = await response.json();
    return (
      data?.choices?.[0]?.message?.content ??
      "The self-hosted model didn't return a usable response. Try again."
    );
  } catch {
    return `Couldn't reach the self-hosted AI server at ${baseUrl}. Check that it's running and reachable from Vercel.`;
  }
}
