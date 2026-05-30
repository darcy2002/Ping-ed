import { gemini } from "./adapters/gemini";
import { openrouter } from "./adapters/openrouter";
import { resolveRoute, type Route, type TaskName } from "./routing";
import {
  LLMError,
  type LLMProvider,
  type LLMRequest,
  type LLMResult,
} from "./types";

// The only place provider instances are registered. Adapters stay dumb; all
// cross-cutting concerns (capabilities, retry, fallback) live here.
const providers: Record<string, LLMProvider> = {
  gemini,
  openrouter,
};

const MAX_ATTEMPTS = 2;

function resolveProvider(name: string): LLMProvider {
  const provider = providers[name];
  if (!provider) {
    throw new Error(`Unknown provider: "${name}"`);
  }
  return provider;
}

function hasImageInput(req: LLMRequest): boolean {
  return req.messages.some(
    (message) =>
      Array.isArray(message.content) &&
      message.content.some((part) => part.type === "image"),
  );
}

// Retry transient failures only; a 4xx (other than rate limiting) or an abort
// won't get better on a second attempt, so we move straight to fallback.
function isRetryable(err: unknown): boolean {
  if (err instanceof LLMError) {
    return err.status >= 500 || err.status === 429;
  }
  if (err instanceof Error && err.name === "AbortError") {
    return false;
  }
  return true;
}

async function runRoute(
  route: Route,
  req: LLMRequest,
  task: TaskName,
): Promise<LLMResult> {
  const provider = resolveProvider(route.provider);

  // Reject image input to a non-vision provider before spending a call.
  if (hasImageInput(req) && !provider.capabilities.vision) {
    if (route.fallback) {
      return runRoute(route.fallback, req, task);
    }
    throw new Error(
      `Task "${task}" has image input but provider "${provider.name}" lacks vision capability`,
    );
  }

  const effectiveReq: LLMRequest = {
    ...req,
    temperature: req.temperature ?? route.temperature,
  };

  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await provider.generate(effectiveReq, { model: route.model });
    } catch (err) {
      lastError = err;
      if (attempt < MAX_ATTEMPTS && isRetryable(err)) {
        continue;
      }
      break;
    }
  }

  if (route.fallback) {
    return runRoute(route.fallback, req, task);
  }
  throw lastError;
}

export function run(task: TaskName, req: LLMRequest): Promise<LLMResult> {
  return runRoute(resolveRoute(task), req, task);
}
