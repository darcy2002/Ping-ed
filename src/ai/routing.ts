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

// Optional per-task fallback, only present if a fallback model is configured.
function envFallback(task: string): Route | undefined {
  const model = process.env[`AI_${task}_FALLBACK_MODEL`];
  if (!model) return undefined;
  const provider = process.env[`AI_${task}_FALLBACK_PROVIDER`] ?? DEFAULT_PROVIDER;
  const temperature = numberEnv(`AI_${task}_FALLBACK_TEMPERATURE`);
  return {
    provider,
    model,
    ...(temperature !== undefined && { temperature }),
  };
}

function envRoute(task: TaskName, defaultTemperature: number): Route {
  const key = task.toUpperCase();
  const provider = process.env[`AI_${key}_PROVIDER`] ?? DEFAULT_PROVIDER;
  const model = process.env[`AI_${key}_MODEL`] ?? DEFAULT_MODEL;
  const temperature = numberEnv(`AI_${key}_TEMPERATURE`) ?? defaultTemperature;
  const fallback = envFallback(key);
  return {
    provider,
    model,
    temperature,
    ...(fallback && { fallback }),
  };
}

// Creative tasks run warm; distillation/explanation run cold for fidelity.
export const routing: Record<TaskName, Route> = {
  outreach: envRoute("outreach", 0.8),
  reply: envRoute("reply", 0.8),
  enrich: envRoute("enrich", 0.2),
  vision: envRoute("vision", 0.2),
  explain: envRoute("explain", 0.3),
};

export function resolveRoute(task: TaskName): Route {
  return routing[task];
}
