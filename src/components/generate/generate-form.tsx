"use client";

import Link from "next/link";
import { useState } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import {
  generateOutreachMessage,
  type Message,
} from "@/lib/generation-actions";
import {
  deleteMessage,
  rateMessage,
  setMessageFavourite,
} from "@/lib/message-actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [result, setResult] = useState<Message | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, setPending] = useState(false);
  const [angle, setAngle] = useState("");

  const ready = offeringId && promptId && prospectId;
  const missing: string[] = [];
  if (offerings.length === 0) missing.push("an offering");
  if (prompts.length === 0) missing.push("a prompt");
  if (prospects.length === 0) missing.push("a prospect");

  // Used for the first generation and for regenerate-with-an-angle. The
  // angle steers a fresh message while reusing the same offering/prompt/prospect.
  async function runGenerate(steer?: string) {
    if (!ready || generating) return;
    setError(null);
    setCopied(false);
    setGenerating(true);
    try {
      const res = await generateOutreachMessage({
        offeringId,
        promptId,
        prospectId,
        ...(steer && { angle: steer }),
      });
      setResult(res.message);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not generate a message.",
      );
    } finally {
      setGenerating(false);
    }
  }

  function onGenerate() {
    setResult(null);
    setAngle("");
    void runGenerate();
  }

  function onRegenerate() {
    const steer = angle.trim();
    if (!steer) return;
    void runGenerate(steer);
  }

  async function onCopy() {
    if (!result) return;
    await navigator.clipboard.writeText(result.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  // rating: 1 = thumbs up, -1 = thumbs down, null = unrated. Clicking the
  // active rating clears it.
  async function onRate(value: number) {
    if (!result || pending) return;
    const next = result.rating === value ? null : value;
    setPending(true);
    try {
      setResult(await rateMessage(result.id, next));
    } finally {
      setPending(false);
    }
  }

  async function onToggleFavourite() {
    if (!result || pending) return;
    setPending(true);
    try {
      setResult(await setMessageFavourite(result.id, !result.isFavourite));
    } finally {
      setPending(false);
    }
  }

  async function onDelete() {
    if (!result || pending) return;
    setPending(true);
    try {
      await deleteMessage(result.id);
      setResult(null);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Generate</h1>
        <p className="text-sm text-muted-foreground">
          Pick an offering, a prompt, and a prospect — get a personalized
          outreach message.
        </p>
      </div>

      {missing.length > 0 ? (
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

            <div className="flex justify-end">
              <Button onClick={onGenerate} disabled={!ready || generating}>
                {generating ? "Generating…" : "Generate"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Outreach message</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="whitespace-pre-wrap text-sm">{result.content}</p>
            <div className="flex items-center gap-2">
              <Button
                variant={result.rating === 1 ? "default" : "outline"}
                size="icon"
                onClick={() => onRate(1)}
                disabled={pending}
                aria-label="Thumbs up"
                aria-pressed={result.rating === 1}
              >
                <ThumbsUp className="size-4" />
              </Button>
              <Button
                variant={result.rating === -1 ? "default" : "outline"}
                size="icon"
                onClick={() => onRate(-1)}
                disabled={pending}
                aria-label="Thumbs down"
                aria-pressed={result.rating === -1}
              >
                <ThumbsDown className="size-4" />
              </Button>
              <Button
                variant={result.isFavourite ? "default" : "outline"}
                size="sm"
                onClick={onToggleFavourite}
                disabled={pending}
                aria-pressed={result.isFavourite}
              >
                {result.isFavourite ? "★ Favourited" : "☆ Favourite"}
              </Button>
              <div className="ml-auto flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={onCopy}>
                  {copied ? "Copied" : "Copy"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDelete}
                  disabled={pending}
                >
                  Delete
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-2 border-t pt-4">
              <Label htmlFor="angle">Regenerate with a different angle</Label>
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
              {result.angle && (
                <p className="text-xs text-muted-foreground">
                  Current angle: {result.angle}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
