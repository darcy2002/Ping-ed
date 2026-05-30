// The provider/model routing table. Switching providers or models for a task
// means editing this table (or its env overrides) and nothing else in the app.

export type TaskName = "outreach" | "reply" | "enrich" | "vision" | "explain";

export interface Route {
  provider: string;
  model: string;
  temperature?: number;
  fallback?: Route;
}

const DEFAULT_PROVIDER = "gemini";
const DEFAULT_MODEL = "gemini-3.5-flash";

function numberEnv(key: string): number | undefined {
  const raw = process.env[key];
  if (raw === undefined || raw === "") return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

// Optional per-task fallback. Env-configured fallback takes precedence; falls
// back to the route's built-in default fallback if present.
function envFallback(task: string, fallbackDefault?: Route): Route | undefined {
  const model = process.env[`AI_${task}_FALLBACK_MODEL`];
  if (!model) return fallbackDefault;
  const provider = process.env[`AI_${task}_FALLBACK_PROVIDER`] ?? DEFAULT_PROVIDER;
  const temperature = numberEnv(`AI_${task}_FALLBACK_TEMPERATURE`);
  return {
    provider,
    model,
    ...(temperature !== undefined && { temperature }),
  };
}

interface RouteDefaults {
  provider: string;
  model: string;
  temperature: number;
  fallback?: Route;
}

function envRoute(task: TaskName, defaults: RouteDefaults): Route {
  const key = task.toUpperCase();
  const provider = process.env[`AI_${key}_PROVIDER`] ?? defaults.provider;
  const model = process.env[`AI_${key}_MODEL`] ?? defaults.model;
  const temperature = numberEnv(`AI_${key}_TEMPERATURE`) ?? defaults.temperature;
  const fallback = envFallback(key, defaults.fallback);
  return {
    provider,
    model,
    temperature,
    ...(fallback && { fallback }),
  };
}

// Graded generation (outreach + reply) routes to Claude via OpenRouter, with a
// Gemini fallback if OpenRouter fails. Enrichment/vision/explain stay on Gemini.
const GEMINI_FALLBACK: Route = { provider: "gemini", model: DEFAULT_MODEL };

export const routing: Record<TaskName, Route> = {
  outreach: envRoute("outreach", {
    provider: "openrouter",
    model: "anthropic/claude-sonnet-4.6",
    temperature: 0.8,
    fallback: GEMINI_FALLBACK,
  }),
  reply: envRoute("reply", {
    provider: "openrouter",
    model: "anthropic/claude-sonnet-4.6",
    temperature: 0.7,
    fallback: GEMINI_FALLBACK,
  }),
  enrich: envRoute("enrich", {
    provider: DEFAULT_PROVIDER,
    model: DEFAULT_MODEL,
    temperature: 0.2,
  }),
  vision: envRoute("vision", {
    provider: DEFAULT_PROVIDER,
    model: DEFAULT_MODEL,
    temperature: 0.2,
  }),
  explain: envRoute("explain", {
    provider: DEFAULT_PROVIDER,
    model: DEFAULT_MODEL,
    temperature: 0.3,
  }),
};

export function resolveRoute(task: TaskName): Route {
  return routing[task];
}
