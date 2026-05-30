"use client";

import Link from "next/link";
import { useState } from "react";
import { generateOutreachMessage } from "@/lib/generation-actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const ready = offeringId && promptId && prospectId;
  const missing: string[] = [];
  if (offerings.length === 0) missing.push("an offering");
  if (prompts.length === 0) missing.push("a prompt");
  if (prospects.length === 0) missing.push("a prospect");

  async function onGenerate() {
    if (!ready) return;
    setError(null);
    setResult(null);
    setCopied(false);
    setGenerating(true);
    try {
      const res = await generateOutreachMessage({
        offeringId,
        promptId,
        prospectId,
      });
      setResult(res.message.content);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not generate a message.",
      );
    } finally {
      setGenerating(false);
    }
  }

  async function onCopy() {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
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
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Outreach message</CardTitle>
            <Button variant="outline" size="sm" onClick={onCopy}>
              {copied ? "Copied" : "Copy"}
            </Button>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">{result}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
