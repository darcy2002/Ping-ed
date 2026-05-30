// Canonical, provider-neutral types for the AI layer. Adapters translate
// between these and each provider's wire format; nothing here is OpenRouter-
// or vendor-specific.

export type Role = "system" | "user" | "assistant";

export type ContentPart =
  | { type: "text"; text: string }
  // Raw image bytes plus their media type (e.g. a base64 LinkedIn screenshot).
  // Adapters assemble the provider-specific form (such as a data URI).
  | { type: "image"; mediaType: string; dataBase64: string };

export interface LLMMessage {
  role: Role;
  content: string | ContentPart[];
}

export interface LLMRequest {
  system?: string;
  messages: LLMMessage[];
  temperature?: number;
  maxTokens?: number;
  // When true, ask the provider to return strict JSON.
  json?: boolean;
}

export interface LLMUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface LLMResult {
  text: string;
  usage: LLMUsage;
  model: string;
  provider: string;
  // Escape hatch for the raw provider response. Keep out of app logic.
  raw: unknown;
}

export interface ProviderCapabilities {
  vision: boolean;
  json: boolean;
  streaming: boolean;
}

export interface GenerateOptions {
  model: string;
  signal?: AbortSignal;
}

export interface LLMProvider {
  name: string;
  capabilities: ProviderCapabilities;
  generate(req: LLMRequest, opts: GenerateOptions): Promise<LLMResult>;
}

/**
 * Typed error thrown by adapters when a provider returns a non-OK response.
 * Carries the provider name, HTTP status, and raw body so the gateway can
 * decide whether to retry/fall back, and so user-facing messages never leak
 * raw provider output.
 */
export class LLMError extends Error {
  constructor(
    readonly provider: string,
    readonly status: number,
    readonly body: string,
  ) {
    super(`[${provider}] request failed with status ${status}`);
    this.name = "LLMError";
  }
}
