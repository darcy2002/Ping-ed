"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { enrichProspectSource } from "@/lib/actions";
import {
  addProspectSource,
  deleteProspectSource,
  type ProspectSource,
  type ProspectSourceType,
  type ProspectWithSources,
} from "@/lib/prospect-actions";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";

const SOURCE_TYPES: { value: ProspectSourceType; label: string }[] = [
  { value: "linkedin_screenshot", label: "LinkedIn screenshot" },
  { value: "github_url", label: "GitHub URL" },
  { value: "website_url", label: "Website URL" },
  { value: "company_url", label: "Company URL" },
  { value: "other_url", label: "Other URL" },
  { value: "freetext", label: "Free text" },
];

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read the image file"));
    reader.readAsDataURL(file);
  });
}

const TYPE_LABELS = Object.fromEntries(
  SOURCE_TYPES.map((t) => [t.value, t.label]),
) as Record<ProspectSourceType, string>;

export function ProspectDetail({ prospect }: { prospect: ProspectWithSources }) {
  const router = useRouter();
  const [type, setType] = useState<ProspectSourceType>("linkedin_screenshot");
  const [value, setValue] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enrichingIds, setEnrichingIds] = useState<Set<string>>(new Set());
  const [removingId, setRemovingId] = useState<string | null>(null);

  // Render from local state so a newly added row shows pending/enriching
  // immediately, rather than waiting for the (slow) server refresh to commit.
  // The effect re-syncs whenever the server sends fresh data after a refresh.
  const [sources, setSources] = useState<ProspectSource[]>(prospect.sources);
  useEffect(() => {
    setSources(prospect.sources);
  }, [prospect.sources]);

  const isFreetext = type === "freetext";
  const isScreenshot = type === "linkedin_screenshot";

  async function runEnrich(id: string) {
    setEnrichingIds((prev) => new Set(prev).add(id));
    let ok = true;
    try {
      await enrichProspectSource(id);
    } catch {
      // The action marks the source as failed server-side too.
      ok = false;
    } finally {
      // Reflect the outcome locally so the badge goes straight to
      // enriched/failed instead of flashing "pending" before the refresh.
      setSources((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, status: ok ? "enriched" : "failed" } : s,
        ),
      );
      setEnrichingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      router.refresh();
    }
  }

  async function onAddSource(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setAdding(true);

    const tempId = `temp-${Date.now()}`;
    try {
      let sourceValue: string;
      if (isScreenshot) {
        if (!file) {
          throw new Error("Choose a screenshot to upload");
        }
        // Store the image as a base64 data URL; the vision enrichment path
        // parses it straight out of the source value.
        sourceValue = await fileToDataUrl(file);
      } else {
        sourceValue = value;
      }

      // Show an optimistic "pending" row right away.
      const optimistic: ProspectSource = {
        id: tempId,
        prospectId: prospect.id,
        type,
        value: sourceValue,
        extractedContext: null,
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setSources((prev) => [optimistic, ...prev]);
      setValue("");
      setFile(null);

      const source = await addProspectSource(prospect.id, {
        type,
        value: sourceValue,
      });
      // Swap the optimistic row for the real one, then enrich it in place.
      setSources((prev) => prev.map((s) => (s.id === tempId ? source : s)));
      await runEnrich(source.id);
    } catch (err) {
      setSources((prev) => prev.filter((s) => s.id !== tempId));
      setError(err instanceof Error ? err.message : "Could not add source.");
    } finally {
      setAdding(false);
    }
  }

  async function onRemove(id: string) {
    setRemovingId(id);
    try {
      await deleteProspectSource(id);
      router.refresh();
    } finally {
      setRemovingId(null);
    }
  }

  function statusBadge(status: string, enriching: boolean) {
    if (enriching) return <Badge variant="secondary">Enriching…</Badge>;
    if (status === "enriched") return <Badge>Enriched</Badge>;
    if (status === "failed") return <Badge variant="destructive">Failed</Badge>;
    return <Badge variant="secondary">Pending</Badge>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Link
          href="/prospects"
          className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
        >
          ← All prospects
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          {prospect.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          Add sources of any type. Each is enriched into clean context on save.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add a source</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onAddSource} className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="source-type">Type</Label>
              <Select
                value={type}
                onValueChange={(v) => setType(v as ProspectSourceType)}
              >
                <SelectTrigger id="source-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOURCE_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="source-value">
                {isScreenshot ? "Screenshot" : isFreetext ? "Text" : "URL"}
              </Label>
              {isScreenshot ? (
                <>
                  <Input
                    id="source-value"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Upload a screenshot of the prospect&apos;s LinkedIn profile.
                    It&apos;s read by vision and distilled into context.
                  </p>
                </>
              ) : isFreetext ? (
                <Textarea
                  id="source-value"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="Anything useful you know about this prospect..."
                  rows={4}
                  className="max-h-48 overflow-y-auto"
                  required
                />
              ) : (
                <Input
                  id="source-value"
                  type="url"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="https://..."
                  required
                />
              )}
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-end">
              <Button type="submit" disabled={adding}>
                {adding ? "Adding…" : "Add & enrich"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          Sources ({sources.length})
        </h2>
        {sources.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No sources yet. Add a URL or some free text above.
            </CardContent>
          </Card>
        ) : (
          sources.map((source) => {
            const enriching = enrichingIds.has(source.id);
            return (
              <Card key={source.id}>
                <CardContent className="flex flex-col gap-2 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          {TYPE_LABELS[source.type] ?? source.type}
                        </span>
                        {statusBadge(source.status, enriching)}
                      </div>
                      <p className="truncate text-sm">
                        {source.type === "linkedin_screenshot"
                          ? "Uploaded screenshot"
                          : source.value}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      {source.status === "failed" && !enriching && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => runEnrich(source.id)}
                        >
                          Retry
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRemove(source.id)}
                        disabled={removingId === source.id}
                      >
                        {removingId === source.id ? "Removing…" : "Remove"}
                      </Button>
                    </div>
                  </div>
                  {source.extractedContext && (
                    <p className="max-h-40 overflow-y-auto whitespace-pre-wrap rounded-md bg-muted p-3 text-xs text-muted-foreground">
                      {source.extractedContext}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
