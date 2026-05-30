"use client";

import { useEffect, useRef, useState } from "react";
import {
  Building2,
  Code2,
  Copy,
  FileText,
  Image as ImageIcon,
  MessageSquare,
  RefreshCw,
  Star,
  ThumbsDown,
  ThumbsUp,
  Users,
  type LucideIcon,
} from "lucide-react";

interface Source {
  Icon: LucideIcon;
  label: string;
  sub: string;
}
interface Scene {
  tab: string;
  tabLabel: string;
  TabIcon: LucideIcon;
  av: string;
  name: string;
  title: string;
  live: string;
  sources: Source[];
  msg: string;
}

const SCENES: Scene[] = [
  {
    tab: "screenshot",
    tabLabel: "LinkedIn",
    TabIcon: ImageIcon,
    av: "DM",
    name: "Diego Marin",
    title: "Head of Growth · Lumen Labs",
    live: "enriching",
    sources: [
      { Icon: ImageIcon, label: "LinkedIn screenshot", sub: "read by vision" },
      { Icon: Building2, label: "Company URL", sub: "lumenlabs.io" },
      { Icon: Code2, label: "GitHub", sub: "github.com/diego" },
    ],
    msg: "Hi Diego — your post on the limits of spray-and-pray outbound stuck with me; it's exactly the wall we hit before building Pinged. We turn one screenshot into real, reusable context — so this isn't a {{first_name}} merge tag. Worth 15 minutes given Lumen's PLG motion?",
  },
  {
    tab: "github",
    tabLabel: "GitHub",
    TabIcon: Code2,
    av: "DM",
    name: "Diego Marin",
    title: "Head of Growth · Lumen Labs",
    live: "enriching",
    sources: [
      { Icon: Code2, label: "GitHub", sub: "rate-limiter · 1.1k★" },
      { Icon: ImageIcon, label: "LinkedIn screenshot", sub: "read by vision" },
      { Icon: Building2, label: "Company URL", sub: "lumenlabs.io" },
    ],
    msg: "Hi Diego — came across your rate-limiter on GitHub before I ever saw your outbound posts; clean work, clearly someone who sweats the details. That's the same instinct behind Pinged: tight context in, specific outreach out. Given how you think about PLG, worth a look?",
  },
  {
    tab: "company",
    tabLabel: "Company site",
    TabIcon: Building2,
    av: "PN",
    name: "Priya Nair",
    title: "Founder & CEO · Cadence",
    live: "enriching",
    sources: [
      { Icon: Building2, label: "Company URL", sub: "cadence.team" },
      { Icon: ImageIcon, label: "LinkedIn screenshot", sub: "read by vision" },
      { Icon: FileText, label: "Free text", sub: "met at SaaStr" },
    ],
    msg: "Hi Priya — saw Cadence just crossed $40k MRR, congrats. You've written about wanting to move past founder-led sales without hiring too early — that's exactly the gap Pinged fills: repeatable, genuinely-personal outbound without a BDR. Compare notes for 15 minutes?",
  },
  {
    tab: "reply",
    tabLabel: "Their reply",
    TabIcon: MessageSquare,
    av: "DM",
    name: "Diego Marin",
    title: "Head of Growth · Lumen Labs",
    live: "following up",
    sources: [
      {
        Icon: MessageSquare,
        label: "Prospect reply",
        sub: '"what makes yours different?"',
      },
      { Icon: FileText, label: "Offering", sub: "replayed" },
      { Icon: Users, label: "Prospect context", sub: "replayed" },
    ],
    msg: "Totally fair — most tools just template harder. The difference is where the work happens: Pinged enriches each source once, so generation reads clean context instead of stuffing raw text into a prompt. Happy to run one of your real prospects through it live — you bring the hardest one.",
  },
];

export function LandingDemo() {
  const [tab, setTab] = useState("screenshot");
  const [onCount, setOnCount] = useState(0);
  const [typed, setTyped] = useState("");
  const [ready, setReady] = useState(false);
  const [live, setLive] = useState("enriching");
  const [meta, setMeta] = useState("");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const scene = SCENES.find((s) => s.tab === tab) ?? SCENES[0];

  useEffect(() => {
    const sc = SCENES.find((s) => s.tab === tab) ?? SCENES[0];
    const t = timers.current;
    setOnCount(0);
    setTyped("");
    setReady(false);
    setMeta("");
    setLive(sc.live);

    sc.sources.forEach((_, i) => {
      t.push(setTimeout(() => setOnCount(i + 1), 380 * (i + 1)));
    });

    const startWrite = 380 * (sc.sources.length + 1) + 220;
    t.push(
      setTimeout(() => {
        setLive("writing");
        const toks = sc.msg.match(/\S+\s*/g) ?? [sc.msg];
        let acc = "";
        toks.forEach((tk, i) => {
          t.push(
            setTimeout(() => {
              acc += tk;
              setTyped(acc);
              if (i === toks.length - 1) {
                setReady(true);
                setLive("ready");
                setMeta(`${acc.trim().split(/\s+/).length} words`);
              }
            }, 24 * i),
          );
        });
      }, startWrite),
    );

    return () => {
      t.forEach(clearTimeout);
      timers.current = [];
    };
  }, [tab]);

  return (
    <div className="mx-auto mt-5 max-w-4xl text-left">
      {/* tab switcher */}
      <div className="mx-auto mb-5 flex w-fit flex-wrap gap-0.5 rounded-xl border bg-muted p-1">
        {SCENES.map((sc) => {
          const active = sc.tab === tab;
          return (
            <button
              key={sc.tab}
              type="button"
              onClick={() => setTab(sc.tab)}
              className={`inline-flex items-center gap-1.5 rounded-[9px] px-3 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <sc.TabIcon className="size-4" />
              {sc.tabLabel}
            </button>
          );
        })}
      </div>

      {/* demo card */}
      <div className="overflow-hidden rounded-[20px] border bg-card shadow-xl">
        <div className="flex items-center gap-2.5 border-b bg-surface-2 px-4.5 py-3.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            {scene.av}
          </span>
          <div className="min-w-0">
            <div className="text-sm font-semibold leading-tight">
              {scene.name}
            </div>
            <div className="text-xs text-muted-foreground">{scene.title}</div>
          </div>
          <div className="ml-auto flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <span
              className={`size-[7px] rounded-full ${
                ready ? "bg-success" : "animate-pulse bg-muted-foreground"
              }`}
            />
            {live}
          </div>
        </div>

        <div className="grid md:grid-cols-[0.92fr_1.08fr]">
          {/* context column */}
          <div className="border-b px-5 py-4 md:border-r md:border-b-0">
            <div className="mb-3.5 flex items-center justify-between text-[0.7rem] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
              Context
              <span className="tabular-nums">
                {onCount} / {scene.sources.length}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {scene.sources.map((s, i) => {
                const on = i < onCount;
                return (
                  <div
                    key={`${scene.tab}-${i}`}
                    className={`flex items-center gap-2.5 rounded-[10px] border px-3 py-2.5 text-sm transition-all duration-300 ${
                      on
                        ? "border-success/30 bg-success/10"
                        : "border-border bg-card opacity-50"
                    }`}
                  >
                    <span
                      className={`grid size-7 shrink-0 place-items-center rounded-lg ${
                        on
                          ? "bg-success text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <s.Icon className="size-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <b className="block font-medium">{s.label}</b>
                      <span className="text-xs text-muted-foreground">
                        {s.sub}
                      </span>
                    </span>
                    <span
                      className={`text-xs font-semibold ${
                        on ? "text-success" : "text-muted-foreground"
                      }`}
                    >
                      ✓
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* message column */}
          <div className="px-5 py-4">
            <div className="mb-3.5 flex items-center justify-between text-[0.7rem] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
              Message
              <span className="tabular-nums">{meta}</span>
            </div>
            <div className="min-h-[150px] text-sm leading-relaxed whitespace-pre-wrap">
              {typed === "" && !ready ? (
                <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <RefreshCw className="size-3.5 animate-spin" />
                  Reading context…
                </span>
              ) : (
                <>
                  {typed}
                  {!ready && (
                    <span className="ml-px inline-block h-[1.05em] w-0.5 animate-pulse bg-foreground align-[-2px]" />
                  )}
                </>
              )}
            </div>
            {ready && (
              <div className="mt-2 flex items-center gap-1.5 border-t pt-2.5">
                <span className="grid size-7 place-items-center rounded-md bg-primary text-primary-foreground">
                  <ThumbsUp className="size-3.5" />
                </span>
                <span className="grid size-7 place-items-center rounded-md border text-muted-foreground">
                  <ThumbsDown className="size-3.5" />
                </span>
                <span className="grid size-7 place-items-center rounded-md border text-muted-foreground">
                  <Star className="size-3.5" />
                </span>
                <span className="ml-auto inline-flex h-7 items-center gap-1.5 rounded-md border px-3 text-xs text-muted-foreground">
                  <Copy className="size-3.5" /> Copy
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
