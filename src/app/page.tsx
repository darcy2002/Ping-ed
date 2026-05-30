import Link from "next/link";
import {
  Building2,
  Check,
  Copy,
  FileText,
  Image as ImageIcon,
  Mail,
  MessageSquare,
  RefreshCw,
  Star,
  ThumbsDown,
  ThumbsUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Wordmark } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { LandingDemo } from "@/components/landing/landing-demo";
import { LandingFaq } from "@/components/landing/landing-faq";

function Eyebrow({
  label,
  accent,
  num,
}: {
  label: string;
  accent: string;
  num: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
      <span>{label}</span>
      <span className="text-border">·</span>
      <b className="font-semibold text-foreground">{accent}</b>
      <span className="text-border">·</span>
      <span className="tabular-nums">{num}</span>
    </div>
  );
}

function MiniItem({
  Icon,
  title,
  body,
}: {
  Icon: LucideIcon;
  title: string;
  body: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="grid size-[34px] shrink-0 place-items-center rounded-[9px] bg-muted text-foreground">
        <Icon className="size-4" />
      </div>
      <div>
        <b className="text-sm font-semibold">{title}</b>
        <p className="mt-0.5 text-sm leading-snug text-muted-foreground">
          {body}
        </p>
      </div>
    </div>
  );
}

function CtxCard({
  Icon,
  title,
  body,
}: {
  Icon: LucideIcon;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-[10px] border p-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <span className="grid size-6 place-items-center rounded-md bg-muted text-muted-foreground">
          <Icon className="size-3.5" />
        </span>
        {title}
      </div>
      <p className="mt-2 rounded-lg bg-muted p-2.5 text-xs leading-snug text-muted-foreground">
        {body}
      </p>
    </div>
  );
}

const NAV_LINKS = [
  { label: "Product", href: "/sign-up" },
  { label: "Generate", href: "/generate" },
  { label: "Prompts", href: "/prompts" },
  { label: "Analytics", href: "/analytics" },
  { label: "FAQ", href: "#faq" },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
        <div className="bg-primary text-sm text-primary-foreground">
          <div className="mx-auto flex h-9 max-w-6xl items-center justify-center gap-2.5 px-6">
            <span className="rounded-full bg-primary-foreground/15 px-1.5 py-px text-[0.66rem] font-bold tracking-wide">
              NEW
            </span>
            <span className="truncate">
              Reply handling — follow-ups that read the whole thread
            </span>
            <Link href="/sign-up" className="font-semibold opacity-95">
              Try it →
            </Link>
          </div>
        </div>
        <div className="mx-auto flex h-[62px] max-w-6xl items-center gap-6 px-6">
          <Wordmark />
          <nav className="hidden gap-6 text-sm text-muted-foreground md:flex">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="hover:text-foreground"
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2.5">
            <ThemeToggle />
            <Button asChild variant="ghost" size="sm">
              <Link href="/sign-in">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/sign-up">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* hero */}
      <section className="mx-auto w-full max-w-6xl px-6">
        <div className="pt-15 pb-8 text-center">
          <h1 className="mx-auto mt-5 max-w-[15ch] text-4xl leading-[1.02] font-semibold tracking-tighter sm:text-5xl md:text-6xl">
          Outreach that feels personal.
          </h1>
          <p className="mx-auto mt-5 max-w-[56ch] text-base leading-relaxed text-muted-foreground sm:text-lg">
          Pinged gathers prospect insights from across the web and turns them into tailored messages in your voice. Save a prospect, define your offer, and send messages that land.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-2.5">
            <Button asChild size="lg">
              <Link href="/sign-up">Start for free</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/sign-in">See it generate</Link>
            </Button>
          </div>
          {/* <div className="mt-3.5 text-sm text-muted-foreground">
            No card required · 1,000 free credits a month
          </div> */}
        </div>

        <LandingDemo />
      </section>

      
      <section className="mx-auto w-full max-w-6xl px-6 pt-9 pb-2 text-center">
        
      </section>

      {/* Feature 01 */}
      <section className="border-t">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid items-center gap-11 md:grid-cols-2">
            <div>
              <Eyebrow label="Pipeline" accent="Two-phase" num="01 / 04" />
              <h2 className="mt-3.5 max-w-[18ch] text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
                Enrich once. Generate from clean context, every time.
              </h2>
              <p className="mt-3 max-w-[56ch] leading-relaxed text-muted-foreground">
                The slow work happens when you save a prospect: URLs get scraped
                and distilled, screenshots read by vision. Generating a message
                just stitches the clean context — so it&apos;s fast and never
                re-scrapes.
              </p>
              <div className="mt-6 flex flex-col gap-3.5">
                <MiniItem
                  Icon={ImageIcon}
                  title="Any source"
                  body="LinkedIn screenshot, GitHub, website, company URL, or free text."
                />
                <MiniItem
                  Icon={Check}
                  title="Distilled to facts"
                  body="Each source becomes tight, structured context — stored once."
                />
                <MiniItem
                  Icon={RefreshCw}
                  title="Status you can see"
                  body="Pending → Enriching → Enriched / Failed, with one-click retry."
                />
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl border bg-card shadow-lg">
              <div className="flex items-center gap-2.5 border-b bg-surface-2 px-4 py-3 text-sm font-semibold">
                <Users className="size-4" /> Diego Marin
                <span className="ml-auto rounded-full border border-success/30 bg-success/15 px-2 py-0.5 text-[0.68rem] font-semibold text-success">
                  3 enriched
                </span>
              </div>
              <div className="flex flex-col gap-2.5 p-4">
                <CtxCard
                  Icon={ImageIcon}
                  title="LinkedIn screenshot"
                  body="Head of Growth at Lumen Labs (Series A, dev tools). Ex-Vercel demand gen. Posts on PLG and the limits of cold email."
                />
                <CtxCard
                  Icon={Building2}
                  title="Company URL"
                  body='Lumen Labs builds observability for AI agents. Just shipped tracing; hiring 3 GTM roles. "Trust through visibility."'
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 02 */}
      <section className="border-t">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid items-center gap-11 md:grid-cols-2">
            <div className="order-2 overflow-hidden rounded-2xl border bg-card shadow-lg md:order-1">
              <div className="flex items-center gap-2.5 border-b bg-surface-2 px-4 py-3 text-sm font-semibold">
                <Mail className="size-4" /> Outreach message
              </div>
              <div className="flex flex-col gap-2.5 p-4">
                <div className="self-stretch rounded-[14px] rounded-br-[4px] bg-primary px-3.5 py-2.5 text-sm leading-relaxed text-primary-foreground">
                  Hi Diego, your post on the limits of spray-and-pray outbound
                  stuck with me; it&apos;s exactly the wall we hit before
                  building Pinged. We turn one screenshot into real, reusable
                  context, so this isn&apos;t a merge tag. Worth 15 minutes
                  given Lumen&apos;s PLG motion?
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="grid size-7 place-items-center rounded-md bg-primary text-primary-foreground">
                    <ThumbsUp className="size-3.5" />
                  </span>
                  <span className="grid size-7 place-items-center rounded-md border text-muted-foreground">
                    <ThumbsDown className="size-3.5" />
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground">
                    <Star className="size-3.5" /> Favourited
                  </span>
                  <span className="ml-auto inline-flex h-7 items-center gap-1.5 rounded-md border px-3 text-xs text-muted-foreground">
                    <Copy className="size-3.5" /> Copy
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {[
                    "Shorter & punchier",
                    "Lead with their OSS",
                    "Add a CTA",
                  ].map((c) => (
                    <span
                      key={c}
                      className="rounded-full border bg-card px-2.5 py-1.5 text-xs"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <Eyebrow label="Voice" accent="Your prompt" num="02 / 04" />
              <h2 className="mt-3.5 max-w-[18ch] text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
                Writes in your voice, not a merge tag.
              </h2>
              <p className="mt-3 max-w-[56ch] leading-relaxed text-muted-foreground">
                Pick an offering, a prompt, and a prospect. Pinged wraps your
                prompt in a format-only envelope and writes a message grounded
                in what&apos;s actually true about the person. Don&apos;t love
                it? Regenerate with a one-line angle.
              </p>
              <div className="mt-6 flex flex-col gap-3.5">
                <MiniItem
                  Icon={FileText}
                  title="Prompt presets"
                  body="Warm & specific, direct & brief, peer-to-peer — set your default."
                />
                <MiniItem
                  Icon={RefreshCw}
                  title="Regenerate with an angle"
                  body={
                    '"Shorter", "lead with their OSS", "add a CTA" — a fresh take, instantly.'
                  }
                />
                <MiniItem
                  Icon={Star}
                  title="Rate & favourite"
                  body="Thumbs up/down, save the winners, copy and send."
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 03 */}
      <section className="border-t">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid items-center gap-11 md:grid-cols-2">
            <div>
              <Eyebrow label="Threads" accent="Reply handling" num="03 / 04" />
              <h2 className="mt-3.5 max-w-[18ch] text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
                Paste the reply. Follow up like a human.
              </h2>
              <p className="mt-3 max-w-[56ch] leading-relaxed text-muted-foreground">
                Drop in what the prospect wrote back and it joins the ordered
                thread. Follow-ups replay the entire conversation through the
                same generation call, so the next message reads as a natural
                continuation — not a fresh cold open.
              </p>
              <div className="mt-6 flex flex-wrap gap-2.5">
                {[
                  ["01", "Outreach", "Generated from clean context."],
                  ["02", "Reply", "Paste it in; it joins the thread."],
                  ["03", "Follow-up", "Replays the whole thread."],
                ].map(([n, title, body]) => (
                  <div
                    key={n}
                    className="min-w-[150px] flex-1 rounded-xl border bg-card p-4"
                  >
                    <span className="text-xs font-semibold tabular-nums text-foreground">
                      {n}
                    </span>
                    <b className="mt-1.5 block text-sm">{title}</b>
                    <p className="mt-1 text-xs leading-snug text-muted-foreground">
                      {body}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl border bg-card shadow-lg">
              <div className="flex items-center gap-2.5 border-b bg-surface-2 px-4 py-3 text-sm font-semibold">
                <MessageSquare className="size-4" /> Conversation
              </div>
              <div className="flex flex-col gap-2.5 p-4">
                <div className="max-w-[86%] self-end rounded-[14px] rounded-br-[4px] bg-primary px-3.5 py-2.5 text-sm text-primary-foreground">
                  <div className="mb-1 text-[0.68rem] font-medium opacity-70">
                    You · Outreach
                  </div>
                  …worth 15 minutes given Lumen&apos;s PLG motion?
                </div>
                <div className="max-w-[86%] self-start rounded-[14px] rounded-bl-[4px] border bg-card px-3.5 py-2.5 text-sm">
                  <div className="mb-1 text-[0.68rem] font-medium text-muted-foreground">
                    Prospect reply
                  </div>
                  We&apos;ve looked at a few tools though — they all just
                  template harder. What makes yours different?
                </div>
                <div className="max-w-[86%] self-end rounded-[14px] rounded-br-[4px] bg-primary px-3.5 py-2.5 text-sm text-primary-foreground">
                  <div className="mb-1 text-[0.68rem] font-medium opacity-70">
                    You · Follow-up
                  </div>
                  Totally fair. The difference is where the work happens: we
                  enrich each source once, so generation reads clean context
                  instead of stuffing raw text into a prompt…
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA band */}
      <div className="mx-auto w-full max-w-6xl px-6">
        <div className="my-16 overflow-hidden rounded-3xl bg-primary px-10 py-14 text-center text-primary-foreground">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Stop spraying. Start landing.
          </h2>
          <p className="mt-3.5 opacity-70">
            Your next reply is one good message away.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-2.5">
            <Button asChild size="lg" variant="secondary">
              <Link href="/sign-up">Start for free</Link>
            </Button>
            <Link
              href="/sign-in"
              className="inline-flex h-9 items-center rounded-lg border border-primary-foreground/25 bg-primary-foreground/10 px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-foreground/20"
            >
              Open the demo
            </Link>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <section id="faq" className="border-t">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <Eyebrow label="FAQ" accent="Questions" num="04 / 04" />
          <h2 className="mt-3.5 mb-6 text-2xl font-semibold tracking-tight sm:text-3xl">
            Frequently asked questions
          </h2>
          <LandingFaq />
        </div>
      </section>

      {/* footer */}
      <footer className="border-t">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-[1.4fr_repeat(3,1fr)]">
            <div>
              <Wordmark size={20} />
              <p className="mt-3 max-w-[30ch] text-sm leading-snug text-muted-foreground">
                Hyper-personalized AI outreach. Context in, replies out.
              </p>
            </div>
            <div>
              <h4 className="mb-3 text-xs font-semibold">Product</h4>
              {[
                ["Generate", "/generate"],
                ["Offerings", "/offerings"],
                ["Prompts", "/prompts"],
                ["Analytics", "/analytics"],
              ].map(([l, h]) => (
                <Link
                  key={l}
                  href={h}
                  className="block py-1 text-sm text-muted-foreground hover:text-foreground"
                >
                  {l}
                </Link>
              ))}
            </div>
            <div>
              <h4 className="mb-3 text-xs font-semibold">Pipeline</h4>
              {[
                ["Prospects", "/prospects"],
                ["Sources", "/prospects"],
                ["Threads", "/generate"],
              ].map(([l, h]) => (
                <Link
                  key={l}
                  href={h}
                  className="block py-1 text-sm text-muted-foreground hover:text-foreground"
                >
                  {l}
                </Link>
              ))}
            </div>
            <div>
              <h4 className="mb-3 text-xs font-semibold">Account</h4>
              {[
                ["Sign in", "/sign-in"],
                ["Sign up", "/sign-up"],
              ].map(([l, h]) => (
                <Link
                  key={l}
                  href={h}
                  className="block py-1 text-sm text-muted-foreground hover:text-foreground"
                >
                  {l}
                </Link>
              ))}
            </div>
          </div>
          <div className="mt-9 flex flex-wrap items-center justify-between gap-2.5 border-t pt-5 text-sm text-muted-foreground">
            <span>© 2026 Pinged</span>
            <span>Built for people who actually read the profile.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
