"use client";

import { useState } from "react";
import { ChevronDown, Copy, Star, ThumbsDown, ThumbsUp } from "lucide-react";
import type { ConversationSummary } from "@/lib/conversation-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function ProspectConversations({
  conversations,
}: {
  conversations: ConversationSummary[];
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function copy(text: string, id: string) {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
        Conversations ({conversations.length})
      </h2>

      {conversations.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No conversations yet. Generate a message for this prospect to start
            one.
          </CardContent>
        </Card>
      ) : (
        conversations.map((c) => {
          const open = openId === c.id;
          return (
            <Card key={c.id} className="gap-0 overflow-hidden p-0">
              <button
                type="button"
                onClick={() => setOpenId(open ? null : c.id)}
                className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-accent/40"
                aria-expanded={open}
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">
                    {c.offeringName} · {c.promptName}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {c.dateLabel} · {c.messages.length} message
                    {c.messages.length === 1 ? "" : "s"}
                  </div>
                </div>
                <ChevronDown
                  className={`size-4 shrink-0 text-muted-foreground transition-transform ${
                    open ? "rotate-180" : ""
                  }`}
                />
              </button>

              {open && (
                <div className="flex flex-col gap-3 border-t px-5 py-4">
                  {c.messages.map((m) =>
                    m.role === "outreach" ? (
                      <div
                        key={m.id}
                        className="rounded-lg border bg-surface p-3.5"
                      >
                        <div className="mb-1.5 flex items-center gap-2">
                          <span className="text-xs font-semibold text-muted-foreground">
                            You · Outreach
                          </span>
                          {m.angle && (
                            <Badge variant="secondary" className="text-[0.65rem]">
                              angle: {m.angle}
                            </Badge>
                          )}
                        </div>
                        <p className="whitespace-pre-wrap text-sm">
                          {m.content}
                        </p>
                        <div className="mt-2.5 flex items-center gap-2">
                          {m.rating === 1 && (
                            <Badge variant="secondary">
                              <ThumbsUp className="size-3" /> Rated up
                            </Badge>
                          )}
                          {m.rating === -1 && (
                            <Badge variant="secondary">
                              <ThumbsDown className="size-3" /> Rated down
                            </Badge>
                          )}
                          {m.isFavourite && (
                            <Badge variant="secondary">
                              <Star className="size-3" /> Favourited
                            </Badge>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="ml-auto"
                            onClick={() => copy(m.content, m.id)}
                          >
                            <Copy className="size-3.5" />
                            {copiedId === m.id ? "Copied" : "Copy"}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        key={m.id}
                        className="rounded-lg border bg-card p-3.5"
                      >
                        <p className="mb-1.5 text-xs font-semibold text-muted-foreground">
                          Prospect reply
                        </p>
                        <p className="whitespace-pre-wrap text-sm">
                          {m.content}
                        </p>
                      </div>
                    ),
                  )}
                </div>
              )}
            </Card>
          );
        })
      )}
    </div>
  );
}
