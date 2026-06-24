import { streamText } from "ai";
import { z } from "zod";
import { NextResponse } from "next/server";
import {
  checkRateLimit,
  getClientIp,
  guardJsonRequest,
  rateLimitedResponse,
} from "@/lib/rate-limit";

// Streaming responses can take a while; give the function room.
export const maxDuration = 30;

// Fast, low-cost model — good fit for a free, ad-supported rewriting tool.
// Swap this string to route to another model through the AI Gateway.
const MODEL = "anthropic/claude-haiku-4.5";

/** Rewrite modes and the instruction sent to the model for each. */
const MODES = {
  improve: "Improve the clarity, flow and impact of the text while keeping its original meaning.",
  formal: "Rewrite the text in a formal, professional tone.",
  casual: "Rewrite the text in a light, casual tone, like a natural conversation.",
  summarize: "Summarize the text, keeping only the main ideas, concisely.",
  fix: "Fix grammar, spelling and punctuation errors, changing the style as little as possible.",
  expand: "Expand the text with more detail and examples, keeping the original tone.",
} as const;

const schema = z.object({
  text: z.string().trim().min(1, "Type or paste some text.").max(4000),
  mode: z.enum(Object.keys(MODES) as [keyof typeof MODES, ...(keyof typeof MODES)[]]),
});

function gatewayConfigured(): boolean {
  return Boolean(process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN);
}

export async function POST(request: Request) {
  const badRequest = guardJsonRequest(request);
  if (badRequest) return badRequest;

  const limit = await checkRateLimit("rewrite", getClientIp(request), 8, 60);
  if (!limit.ok) return rateLimitedResponse(limit.retryAfter);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid text." },
      { status: 400 },
    );
  }

  if (!gatewayConfigured()) {
    return NextResponse.json(
      { error: "The AI rewriter isn't configured yet. Add AI_GATEWAY_API_KEY to enable it." },
      { status: 503 },
    );
  }

  const { text, mode } = parsed.data;

  const result = streamText({
    model: MODEL,
    system:
      "You are a writing assistant. Rewrite the user's text according to the instruction. " +
      "Respond with ONLY the rewritten text, in the SAME language as the original text, " +
      "with no preamble, comments, quotes or extra formatting.",
    prompt: `Instruction: ${MODES[mode]}\n\nText:\n${text}`,
    temperature: 0.7,
    maxOutputTokens: 1200,
    // Errors happen mid-stream (after 200 headers are sent), so log them
    // server-side for visibility; the client guards against an empty result.
    onError({ error }) {
      console.error("rewrite stream error:", error);
    },
  });

  return result.toTextStreamResponse();
}
