"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const FAQ = [
  {
    q: 'What counts as a "source"?',
    a: "Any mix of a LinkedIn screenshot, a GitHub / website / company URL, or free text. On save, each is enriched once — URLs scraped and distilled, screenshots read by vision — into tight facts stored as the prospect's context.",
  },
  {
    q: "Does it re-scrape every time I generate?",
    a: "No. Enrichment is the expensive part and happens once at save-time. Generating a message only stitches the already-clean context, so it's fast and consistent.",
  },
  {
    q: "Can I control the tone and length?",
    a: "Yes — prompts are your system prompt. Three presets seed automatically (warm & specific, direct & brief, peer-to-peer) and you set a default. You can also regenerate any message with a one-line angle.",
  },
  {
    q: "Is my prospect data private?",
    a: "Every query is scoped to your account. Your offerings, prompts, prospects, and conversations are only ever visible to you.",
  },
];

export function LandingFaq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="flex flex-col">
      {FAQ.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q} className="border-b">
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 py-4.5 text-left text-base font-medium"
              aria-expanded={isOpen}
            >
              {item.q}
              <ChevronDown
                className={`size-4 shrink-0 text-muted-foreground transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            <div
              className={`grid transition-all duration-300 ${
                isOpen ? "grid-rows-[1fr] pb-4.5" : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden">
                <p className="max-w-[70ch] text-sm leading-relaxed text-muted-foreground">
                  {item.a}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
