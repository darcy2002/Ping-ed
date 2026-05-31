"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus, X } from "lucide-react";
import {
  createOffering,
  explainOffering,
  scrapeOfferingContent,
  updateOffering,
  type Offering,
} from "@/lib/offering-actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface OfferingFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offering?: Offering | null;
}

export function OfferingFormDialog({
  open,
  onOpenChange,
  offering,
}: OfferingFormDialogProps) {
  const router = useRouter();
  const isEdit = Boolean(offering);

  const [name, setName] = useState(offering?.name ?? "");
  const [urls, setUrls] = useState<string[]>(
    offering?.sourceUrl ? [offering.sourceUrl] : [""],
  );
  const [content, setContent] = useState(offering?.content ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [explaining, setExplaining] = useState(false);

  const filledUrls = urls.map((u) => u.trim()).filter((u) => u !== "");

  function updateUrl(i: number, value: string) {
    setUrls((prev) => prev.map((u, idx) => (idx === i ? value : u)));
  }
  function addUrl() {
    setUrls((prev) => [...prev, ""]);
  }
  function removeUrl(i: number) {
    setUrls((prev) =>
      prev.length === 1 ? [""] : prev.filter((_, idx) => idx !== i),
    );
  }

  // Scrape every non-empty URL and append each page into the content (labelled
  // by source) so multiple pages combine into one offering, still editable.
  async function onScrapeAll() {
    const targets = filledUrls;
    if (targets.length === 0) return;
    setError(null);
    setScraping(true);
    const blocks: string[] = [];
    const failed: string[] = [];
    for (const url of targets) {
      try {
        const markdown = await scrapeOfferingContent(url);
        blocks.push(`## Source: ${url}\n\n${markdown}`);
      } catch {
        failed.push(url);
      }
    }
    if (blocks.length > 0) {
      const addition = blocks.join("\n\n");
      setContent((prev) =>
        prev.trim() === "" ? addition : `${prev.trim()}\n\n${addition}`,
      );
    }
    if (failed.length > 0) {
      setError(`Couldn't scrape: ${failed.join(", ")}`);
    }
    setScraping(false);
  }

  async function onExplain() {
    if (explanation) {
      setExplanation(null);
      return;
    }
    setExplaining(true);
    try {
      setExplanation(await explainOffering());
    } catch {
      setExplanation("Couldn't load an explanation right now.");
    } finally {
      setExplaining(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const payload = {
        name,
        sourceUrl: filledUrls[0] ?? null,
        content,
      };
      if (offering) {
        await updateOffering(offering.id, payload);
      } else {
        await createOffering(payload);
      }
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit offering" : "New offering"}</DialogTitle>
          <DialogDescription>
            Describe what you&apos;re offering. This context feeds every
            generated message.
          </DialogDescription>
          <button
            type="button"
            onClick={onExplain}
            disabled={explaining}
            className="w-fit text-left text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground disabled:opacity-60"
          >
            {explaining
              ? "Thinking..."
              : explanation
                ? "Hide explanation"
                : "What is an offering?"}
          </button>
          {explanation && (
            <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
              {explanation}
            </p>
          )}
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Pinged outreach tool"
              required
            />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label>Source URLs (optional)</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={addUrl}
              >
                <Plus className="size-3.5" /> Add URL
              </Button>
            </div>
            <div className="flex flex-col gap-2">
              {urls.map((url, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    type="url"
                    value={url}
                    onChange={(e) => updateUrl(i, e.target.value)}
                    placeholder="https://..."
                    className="flex-1"
                  />
                  {urls.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeUrl(i)}
                      aria-label="Remove URL"
                    >
                      <X className="size-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                Scrape one or more pages into the content below, then edit. Each
                is appended.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onScrapeAll}
                disabled={scraping || filledUrls.length === 0}
              >
                {scraping
                  ? "Scraping..."
                  : filledUrls.length > 1
                    ? "Scrape all"
                    : "Scrape"}
              </Button>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What it is, who it's for, the value it delivers..."
              rows={8}
              className="max-h-72 overflow-y-auto"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : isEdit ? "Save changes" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
