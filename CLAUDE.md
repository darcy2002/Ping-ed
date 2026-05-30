# CLAUDE.md

Project context for Claude Code. Read this fully before any task. These are decisions, not suggestions — if something here seems wrong, raise it before deviating.

## What we are building

An AI outreach dashboard (a small Kakiyo). A user signs in, defines an *offering*, customizes a *prompt*, saves a *prospect* (URLs + a LinkedIn screenshot), and generates a hyper-personalized outreach message. If the prospect replies, the user pastes it and gets a contextual follow-up. A simple analytics view shows usage.

The mental model that governs the whole codebase: **this is a context-assembly pipeline, not a CRUD app.** Every feature exists to feed one function — `generate(offering, prompt, prospectContext, history) -> message`. The grade is message quality. Plumbing that produces generic messages fails. Bias all effort toward the quality of that one call.

## Tech stack (and why)

- **Next.js (App Router) + TypeScript** — lowest-risk full-stack React for a 2-day build; most examples, fewest surprises. (TanStack Start is fine but its auth patterns are less mature — not worth the risk here.)
- **Better Auth** — email/password, sessions in our own Postgres. Do NOT over-invest in auth; get isolation working and move on.
- **Drizzle ORM + Postgres (Neon)** — typed schema, simple migrations.
- **Tailwind + shadcn/ui** — use shadcn components; do not hand-roll UI primitives.
- **Jina Reader** (`https://r.jina.ai/<url>`) — URL -> markdown, free, zero-setup. Used for GitHub / portfolio / company URLs.
- **OpenRouter** — LLM access, but ALWAYS behind our internal gateway (see AI layer). Default model `google/gemini-3.5-flash` (handles both writing and vision).
- **Deploy: Vercel.** Deploy a blank skeleton on day 1 so the live link is never a last-minute risk.

## Architecture principles (non-negotiable)

1. **All AI calls go through `ai/tasks.ts`.** Nothing else in the codebase imports OpenRouter or calls a model directly. This is the seam that lets us swap providers.
2. **Two-phase AI.** Expensive context-gathering (scrape + distill + vision) happens ONCE when a prospect/source is saved, and is stored in `prospect_source.extracted_context`. Generation at request-time only assembles already-clean context. Never re-scrape during generation.
3. **Auth on every query.** Every product query filters by `user_id` from the validated session, checked in the route handler / server action that returns data — NOT only in middleware. (Next 16 renamed `middleware.ts` -> `proxy.ts`; middleware-only session checks are bypassable per CVE-2025-29927.)
4. **Vertical slices.** Build one feature end-to-end and verify before starting the next. Commit per slice.
5. **No over-engineering.** This is a clean gateway, not an agent framework. No tool-calling loops, no memory layer, no vector DB. If you reach for LangChain, stop.

## Data model

Better Auth owns `user` / `session` / `account` / `verification`. Product tables below. All ids are uuid; all product tables have `user_id` (directly or via parent) for isolation; include `created_at` / `updated_at`.

- **offering**: `id`, `user_id`, `name`, `source_url` (nullable), `content` (text — single editable field; scrape output and manual edits both live here).
- **prompt**: `id`, `user_id`, `name`, `system_prompt` (text), `is_default` (bool).
- **prospect**: `id`, `user_id`, `name`.
- **prospect_source**: `id`, `prospect_id`, `type` (enum: `linkedin_screenshot | github_url | website_url | company_url | other_url | freetext`), `value` (text — url or raw text), `extracted_context` (text — distilled facts), `status` (enum: `pending | enriched | failed`).
- **conversation**: `id`, `user_id`, `prospect_id`, `offering_id`, `prompt_id`.
- **message**: `id`, `conversation_id`, `role` (enum: `outreach | prospect_reply`), `content` (text), `rating` (int, nullable), `is_favourite` (bool), `model` (text), `angle` (text, nullable).

Key choice: prospect inputs are modeled as MANY `prospect_source` rows of any `type`, not fixed columns. This is what makes "any combination of inputs" clean.

## AI layer (the provider abstraction)

Folder `ai/`:

- `types.ts` — canonical, provider-neutral types: `LLMMessage` (role + content, where content is string or `ContentPart[]` with `text`/`image` parts), `LLMRequest` (`system?`, `messages`, `temperature?`, `maxTokens?`, `json?`), `LLMResult` (`text`, `usage`, `model`, `provider`, `raw`), `LLMProvider` (`name`, `capabilities {vision,json,streaming}`, `generate(req, {model, signal})`).
- `adapters/*.ts` — one file per provider. Only job: translate canonical <-> wire format. `openrouter.ts` is the default; structure so `anthropic.ts` / `openai.ts` / `local.ts` can be added without touching anything else.
- `routing.ts` — `Record<TaskName, Route>` read from env. `TaskName = 'outreach' | 'reply' | 'enrich' | 'vision' | 'explain'`. Each route: `{ provider, model, temperature?, fallback? }`. Switching providers = editing this table only.
- `gateway.ts` — `run(task, req)`: resolve route, enforce capabilities (reject image input to a non-vision provider), apply retry, fall back to `route.fallback` on failure. This is the only place cross-cutting concerns live; adapters stay dumb.
- `tasks.ts` — the ONLY AI surface the app imports: `generateOutreach`, `generateReply`, `enrichSource`, `extractFromScreenshot`, `explainInline`. Owns prompt construction; knows nothing about providers.

## Generation design (this is the graded artifact)

- The user's `system_prompt` IS the system prompt. Wrap it with a thin, fixed envelope that controls FORMAT ONLY: "output only the message — no preamble, no subject line, no quotes; write as the user." The envelope must never override the user's tone/length/angle instructions.
- Context goes in the USER message as labelled blocks: `<offering>...</offering>`, `<prospect>...</prospect>`, optional `<angle>...</angle>` for regenerate-with-different-tone.
- **Reply handling is the same call with history.** A reply is a `message` with `role=prospect_reply`. The follow-up generation passes the ENTIRE thread as the `messages` array plus the same offering/prospect context. Do not build a separate code path; that is what makes it read as continuation.
- Enrichment (`enrich` / `vision` tasks) distills sources into tight, high-signal facts. Do NOT dump raw scrapes into generation — distilled context is the biggest lever on quality.

## Conventions

- Server actions for mutations from client components; route handlers for anything else. Always re-validate the session inside them.
- Inline AI explainers (offering / prompt "what is this?") use the `explain` task — short, plain-language, streamed if easy.
- Errors: adapters throw a typed `LLMError(provider, status, body)`; surface user-friendly messages, never raw provider errors.
- Env vars: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `OPENROUTER_KEY`, `JINA_KEY` (optional — Reader works without). Document every new var in the README.
- Keep `raw` provider responses out of app logic — escape hatch only.

## Build sequence

1. Scaffold (Next.js/TS/Tailwind/shadcn, Drizzle+Neon, Better Auth) + blank Vercel deploy + this file.
2. AI core (`ai/*`) + throwaway scripts proving (a) outreach beats generic, (b) vision reads a real LinkedIn screenshot. Human iterates the prompt envelope here.
3. Enrichment (Jina + distillation + screenshot path) wired to `prospect_source`.
4. Feature slices, inside-out: offerings (+scrape +explainer) -> prompts (+presets +explainer) -> prospects (+multi-source +upload) -> generation + history (rate/fav/copy/delete/regenerate) -> reply/thread -> analytics.
5. Polish, README, examples, video.

## Definition of done (grading awareness)

- Customizing the prompt or offering VISIBLY changes the output. (They will test this.)
- Multiple prospect input types work, including the LinkedIn screenshot via vision.
- Replies read as natural continuations of the thread.
- Analytics counts are accurate: total outreach messages, prospects saved, conversations with >=1 reply, offering usage.
- App is deployed and usable end-to-end; README explains run steps, architecture, env vars, tradeoffs, and what you'd do with more time; README includes real input->output examples.

## What NOT to do

- Don't call OpenRouter outside `ai/tasks.ts`.
- Don't try to scrape LinkedIn — it's blocked; LinkedIn is always a screenshot read by the `vision` task.
- Don't gold-plate auth or analytics — they're explicitly low-investment.
- Don't model every provider parameter in `LLMRequest` — keep the universal set; adapters apply their own defaults.
- Don't build horizontal layers — build and verify one vertical slice at a time.
