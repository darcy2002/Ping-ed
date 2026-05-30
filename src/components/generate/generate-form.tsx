"use client";

import Link from "next/link";
import { useState } from "react";
import { Sparkles, ThumbsDown, ThumbsUp } from "lucide-react";
import {
  generateOutreachMessage,
  generateReplyMessage,
  type Message,
} from "@/lib/generation-actions";
import {
  deleteMessage,
  rateMessage,
  setMessageFavourite,
} from "@/lib/message-actions";
import { addProspectReply } from "@/lib/conversation-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Option {
  id: string;
  name: string;
}
interface PromptOption extends Option {
  isDefault: boolean;
}

export function GenerateForm({
  offerings,
  prompts,
  prospects,
}: {
  offerings: Option[];
  prompts: PromptOption[];
  prospects: Option[];
}) {
  const [offeringId, setOfferingId] = useState(offerings[0]?.id ?? "");
  const [promptId, setPromptId] = useState(
    prompts.find((p) => p.isDefault)?.id ?? prompts[0]?.id ?? "",
  );
  const [prospectId, setProspectId] = useState(prospects[0]?.id ?? "");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [angle, setAngle] = useState("");
  // The full ordered conversation thread: outreach + replies + follow-ups.
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [thread, setThread] = useState<Message[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [addingReply, setAddingReply] = useState(false);
  const [followingUp, setFollowingUp] = useState(false);

  const ready = offeringId && promptId && prospectId;
  const missing: string[] = [];
  if (offerings.length === 0) missing.push("an offering");
  if (prompts.length === 0) missing.push("a prompt");
  if (prospects.length === 0) missing.push("a prospect");

  const latestOutreach =
    [...thread].reverse().find((m) => m.role === "outreach") ?? null;
  const canFollowUp = thread[thread.length - 1]?.role === "prospect_reply";

  function updateMessage(updated: Message) {
    setThread((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
  }

  // Used for the first generation and for regenerate-with-an-angle. The angle
  // steers a fresh message while reusing the same offering/prompt/prospect.
  async function runGenerate(steer?: string) {
    if (!ready || generating) return;
    setError(null);
    setGenerating(true);
    try {
      const res = await generateOutreachMessage({
        offeringId,
        promptId,
        prospectId,
        ...(steer && { angle: steer }),
      });
      // A fresh outreach starts a new conversation, so reset the thread.
      setConversationId(res.conversationId);
      setThread([res.message]);
      setReplyText("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not generate a message.",
      );
    } finally {
      setGenerating(false);
    }
  }

  function onGenerate() {
    setThread([]);
    setAngle("");
    void runGenerate();
  }

  function onRegenerate() {
    const steer = angle.trim();
    if (!steer) return;
    void runGenerate(steer);
  }

  async function onCopy(m: Message) {
    await navigator.clipboard.writeText(m.content);
    setCopiedId(m.id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  // rating: 1 = thumbs up, -1 = thumbs down, null = unrated. Clicking the
  // active rating clears it.
  async function onRate(m: Message, value: number) {
    if (pending) return;
    const next = m.rating === value ? null : value;
    setPending(true);
    try {
      updateMessage(await rateMessage(m.id, next));
    } finally {
      setPending(false);
    }
  }

  async function onToggleFavourite(m: Message) {
    if (pending) return;
    setPending(true);
    try {
      updateMessage(await setMessageFavourite(m.id, !m.isFavourite));
    } finally {
      setPending(false);
    }
  }

  async function onDelete(m: Message) {
    if (pending) return;
    setPending(true);
    try {
      await deleteMessage(m.id);
      setThread((prev) => {
        const next = prev.filter((x) => x.id !== m.id);
        if (next.length === 0) setConversationId(null);
        return next;
      });
    } finally {
      setPending(false);
    }
  }

  async function onAddReply() {
    const text = replyText.trim();
    if (!conversationId || !text || addingReply) return;
    setAddingReply(true);
    try {
      const reply = await addProspectReply(conversationId, text);
      setThread((prev) => [...prev, reply]);
      setReplyText("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save the reply.",
      );
    } finally {
      setAddingReply(false);
    }
  }

  // The follow-up is the same generation call replayed over the whole thread.
  async function onFollowUp() {
    if (!conversationId || followingUp) return;
    setError(null);
    setFollowingUp(true);
    try {
      const res = await generateReplyMessage(conversationId);
      setThread((prev) => [...prev, res.message]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not generate a follow-up.",
      );
    } finally {
      setFollowingUp(false);
    }
  }

  const inputsPanel =
    missing.length > 0 ? (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          You need {missing.join(", ")} first. Create them in{" "}
          <Link className="underline" href="/offerings">
            Offerings
          </Link>
          ,{" "}
          <Link className="underline" href="/prompts">
            Prompts
          </Link>
          , and{" "}
          <Link className="underline" href="/prospects">
            Prospects
          </Link>
          .
        </CardContent>
      </Card>
    ) : (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Inputs</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="offering">Offering</Label>
            <Select value={offeringId} onValueChange={setOfferingId}>
              <SelectTrigger id="offering" className="w-full">
                <SelectValue placeholder="Choose an offering" />
              </SelectTrigger>
              <SelectContent>
                {offerings.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="prompt">Prompt</Label>
            <Select value={promptId} onValueChange={setPromptId}>
              <SelectTrigger id="prompt" className="w-full">
                <SelectValue placeholder="Choose a prompt" />
              </SelectTrigger>
              <SelectContent>
                {prompts.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                    {p.isDefault ? " (default)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="prospect">Prospect</Label>
            <Select value={prospectId} onValueChange={setProspectId}>
              <SelectTrigger id="prospect" className="w-full">
                <SelectValue placeholder="Choose a prospect" />
              </SelectTrigger>
              <SelectContent>
                {prospects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button
            onClick={onGenerate}
            disabled={!ready || generating}
            className="w-full"
          >
            <Sparkles className="size-4" />
            {generating ? "Generating…" : "Generate"}
          </Button>
        </CardContent>
      </Card>
    );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Generate</h1>
        <p className="text-sm text-muted-foreground">
          Pick an offering, a prompt, and a prospect — get a personalized
          outreach message.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[340px_1fr] lg:items-start">
        <div className="lg:sticky lg:top-20">{inputsPanel}</div>

        <div>
          {thread.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
                <div className="grid size-13 place-items-center rounded-xl bg-muted text-muted-foreground">
                  <Sparkles className="size-6" />
                </div>
                <div>
                  <div className="font-semibold">No message yet</div>
                  <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                    Choose an offering, a prompt, and a prospect — then
                    generate.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Conversation</CardTitle>
                  <span className="text-xs text-muted-foreground">
                    {thread.length} message{thread.length === 1 ? "" : "s"}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex flex-col gap-3">
                  {thread.map((m) =>
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
                            <Badge
                              variant="secondary"
                              className="text-[0.65rem]"
                            >
                              angle: {m.angle}
                            </Badge>
                          )}
                        </div>
                        <p className="whitespace-pre-wrap text-sm">
                          {m.content}
                        </p>
                        <div className="mt-3 flex items-center gap-2">
                          <Button
                            variant={m.rating === 1 ? "default" : "outline"}
                            size="icon"
                            onClick={() => onRate(m, 1)}
                            disabled={pending}
                            aria-label="Thumbs up"
                            aria-pressed={m.rating === 1}
                          >
                            <ThumbsUp className="size-4" />
                          </Button>
                          <Button
                            variant={m.rating === -1 ? "default" : "outline"}
                            size="icon"
                            onClick={() => onRate(m, -1)}
                            disabled={pending}
                            aria-label="Thumbs down"
                            aria-pressed={m.rating === -1}
                          >
                            <ThumbsDown className="size-4" />
                          </Button>
                          <Button
                            variant={m.isFavourite ? "default" : "outline"}
                            size="sm"
                            onClick={() => onToggleFavourite(m)}
                            disabled={pending}
                            aria-pressed={m.isFavourite}
                          >
                            {m.isFavourite ? "★ Favourited" : "☆ Favourite"}
                          </Button>
                          <div className="ml-auto flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onCopy(m)}
                            >
                              {copiedId === m.id ? "Copied" : "Copy"}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onDelete(m)}
                              disabled={pending}
                            >
                              Delete
                            </Button>
                          </div>
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

                <div className="flex flex-col gap-2 border-t pt-4">
                  <Label htmlFor="reply">Paste a prospect reply</Label>
                  <Textarea
                    id="reply"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Paste what the prospect wrote back…"
                    rows={3}
                    className="max-h-40 overflow-y-auto"
                  />
                  <div className="flex items-center justify-end gap-2">
                    {canFollowUp && (
                      <Button onClick={onFollowUp} disabled={followingUp}>
                        {followingUp ? "Generating…" : "Generate follow-up"}
                      </Button>
                    )}
                    <Button
                      variant="secondary"
                      onClick={onAddReply}
                      disabled={!replyText.trim() || addingReply}
                    >
                      {addingReply ? "Adding…" : "Add reply"}
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col gap-2 border-t pt-4">
                  <Label htmlFor="angle">
                    Regenerate with a different angle
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="angle"
                      value={angle}
                      onChange={(e) => setAngle(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && onRegenerate()}
                      placeholder="e.g. lead with their open-source work; keep it shorter"
                    />
                    <Button
                      variant="secondary"
                      onClick={onRegenerate}
                      disabled={!angle.trim() || generating}
                    >
                      {generating ? "Regenerating…" : "Regenerate"}
                    </Button>
                  </div>
                  {latestOutreach?.angle && (
                    <p className="text-xs text-muted-foreground">
                      Current angle: {latestOutreach.angle}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
