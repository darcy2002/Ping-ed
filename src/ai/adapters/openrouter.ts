import {
  LLMError,
  type ContentPart,
  type GenerateOptions,
  type LLMMessage,
  type LLMProvider,
  type LLMRequest,
  type LLMResult,
} from "../types";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// --- OpenRouter (OpenAI chat-completions compatible) wire shapes ---

type OpenRouterContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string | OpenRouterContentPart[];
}

interface OpenRouterResponse {
  model?: string;
  choices?: Array<{ message?: { content?: string | null } }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

function toWireContent(
  content: string | ContentPart[],
): string | OpenRouterContentPart[] {
  if (typeof content === "string") {
    return content;
  }
  return content.map((part): OpenRouterContentPart =>
    part.type === "text"
      ? { type: "text", text: part.text }
      : {
          type: "image_url",
          image_url: {
            url: `data:${part.mediaType};base64,${part.dataBase64}`,
          },
        },
  );
}

function toWireMessages(req: LLMRequest): OpenRouterMessage[] {
  const messages: OpenRouterMessage[] = [];
  if (req.system) {
    messages.push({ role: "system", content: req.system });
  }
  for (const message of req.messages as LLMMessage[]) {
    messages.push({ role: message.role, content: toWireContent(message.content) });
  }
  return messages;
}

export const openrouter: LLMProvider = {
  name: "openrouter",
  capabilities: { vision: true, json: true, streaming: false },

  async generate(req: LLMRequest, opts: GenerateOptions): Promise<LLMResult> {
    const apiKey = process.env.OPENROUTER_KEY;
    if (!apiKey) {
      throw new Error("OPENROUTER_KEY is not set");
    }

    const body = {
      model: opts.model,
      messages: toWireMessages(req),
      ...(req.temperature !== undefined && { temperature: req.temperature }),
      ...(req.maxTokens !== undefined && { max_tokens: req.maxTokens }),
      ...(req.json && { response_format: { type: "json_object" } }),
    };

    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: opts.signal,
    });

    if (!res.ok) {
      throw new LLMError("openrouter", res.status, await res.text());
    }

    const data = (await res.json()) as OpenRouterResponse;

    return {
      text: data.choices?.[0]?.message?.content ?? "",
      usage: {
        promptTokens: data.usage?.prompt_tokens ?? 0,
        completionTokens: data.usage?.completion_tokens ?? 0,
        totalTokens: data.usage?.total_tokens ?? 0,
      },
      model: data.model ?? opts.model,
      provider: "openrouter",
      raw: data,
    };
  },
};
