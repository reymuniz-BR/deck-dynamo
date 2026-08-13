import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Download, ExternalLink, Loader2, Printer, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { SlidePreview } from "@/components/SlidePreview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { getDeck, getSlides } from "@/lib/deck-queries";
import { regenerateSlide } from "@/lib/deck.functions";
import { exportDeckToPptx } from "@/lib/export-pptx";
import type { Slide } from "@/lib/deck-types";
import { brandOrDefault } from "@/lib/brand";

const LAYOUTS = ["title", "bullets", "two-column", "stat", "quote", "closing"];

export const Route = createFileRoute("/_authenticated/decks/$deckId/")({
  head: () => ({
    meta: [
      { title: "Review & edit your deck — Deck Studio" },
      {
        name: "description",
        content:
          "Review every slide, rewrite copy with AI, then export to PowerPoint, PDF or Google Slides for your team.",
      },
      { property: "og:title", content: "Review & edit your deck — Deck Studio" },
      {
        property: "og:description",
        content: "Review slides and export to PowerPoint, PDF or Google Slides.",
      },
    ],
  }),
  component: DeckEditor,
});

function DeckEditor() {
  const { deckId } = Route.useParams();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Slide | null>(null);
  const [nudge, setNudge] = useState("");
  const [busy, setBusy] = useState<null | "save" | "regen" | "pptx">(null);
  const [slidesUrl, setSlidesUrl] = useState("");

  const runRegenerate = useServerFn(regenerateSlide);
  const deckQuery = useQuery({ queryKey: ["deck", deckId], queryFn: () => getDeck(deckId) });
  const slidesQuery = useQuery({ queryKey: ["slides", deckId], queryFn: () => getSlides(deckId) });

  const slides = slidesQuery.data ?? [];
  const brand = brandOrDefault(deckQuery.data?.brand);
  const active = slides.find((s) => s.id === activeId) ?? slides[0] ?? null;

  useEffect(() => {
    if (active && (!draft || draft.id !== active.id)) setDraft(active);
  }, [active, draft]);

  useEffect(() => {
    if (deckQuery.data?.google_slides_url) setSlidesUrl(deckQuery.data.google_slides_url);
  }, [deckQuery.data]);

  if (deckQuery.isLoading || slidesQuery.isLoading) {
    return (
      <AppShell>
        <div className="mx-auto max-w-6xl space-y-4 px-6 py-12">
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-96 w-full" />
        </div>
      </AppShell>
    );
  }

  const deck = deckQuery.data;
  if (!deck) return null;

  async function saveDraft() {
    if (!draft) return;
    setBusy("save");
    const { error } = await supabase
      .from("slides")
      .update({
        title: draft.title,
        subtitle: draft.subtitle,
        bullets: draft.bullets,
        speaker_notes: draft.speaker_notes,
        layout: draft.layout,
      })
      .eq("id", draft.id);
    setBusy(null);
    if (error) toast.error(error.message);
    else {
      toast.success("Slide saved");
      slidesQuery.refetch();
    }
  }

  async function regenerate() {
    if (!draft) return;
    setBusy("regen");
    try {
      await runRegenerate({ data: { slideId: draft.id, nudge } });
      setNudge("");
      const fresh = await slidesQuery.refetch();
      const updated = fresh.data?.find((s) => s.id === draft.id);
      if (updated) setDraft(updated);
      toast.success("Slide rewritten");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Rewrite failed");
    } finally {
      setBusy(null);
    }
  }

  async function downloadPptx() {
    setBusy("pptx");
    try {
      await exportDeckToPptx(deck!, slides, brand);
      toast.success("PowerPoint downloaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export failed");
    } finally {
      setBusy(null);
    }
  }

  async function saveSlidesUrl() {
    const { error } = await supabase
      .from("decks")
      .update({ google_slides_url: slidesUrl.trim() || null })
      .eq("id", deckId);
    if (error) toast.error(error.message);
    else toast.success("Google Slides link saved for the team");
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-6 py-10">
        <Link
          to="/decks"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          All decks
        </Link>

        <div className="mt-6 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
          <div>
            <p className="label-caps text-accent">{deck.client_name ?? "Draft deck"}</p>
            <h1 className="mt-1.5 text-4xl">{deck.title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {slides.length} slides · review, rewrite, export
            </p>
            <div className="mt-3 flex items-center gap-2">
              <span className="label-caps text-muted-foreground">Branding</span>
              <span className="flex items-center gap-1">
                {[brand.colors.dark, brand.colors.accent, brand.colors.tint].map((c) => (
                  <span
                    key={c}
                    className="h-3.5 w-3.5 border border-border"
                    style={{ background: c }}
                  />
                ))}
              </span>
              <span className="truncate text-xs text-muted-foreground">{brand.source}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={downloadPptx} disabled={busy === "pptx"}>
              {busy === "pptx" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              PowerPoint
            </Button>
            <Button variant="outline" asChild>
              <Link to="/decks/$deckId/print" params={{ deckId }} target="_blank">
                <Printer className="mr-2 h-4 w-4" />
                PDF
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/decks/$deckId/intake" params={{ deckId }}>
                Edit sources
              </Link>
            </Button>
          </div>
        </div>

        {slides.length === 0 ? (
          <div className="mt-16 border border-dashed border-border py-20 text-center">
            <h2 className="text-2xl">No slides yet</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Finish the intake and generate the deck.
            </p>
            <Button asChild className="mt-6">
              <Link to="/decks/$deckId/intake" params={{ deckId }}>
                Go to intake
              </Link>
            </Button>
          </div>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr_340px]">
            <aside className="max-h-[70vh] space-y-2 overflow-y-auto pr-1">
              {slides.map((slide, i) => (
                <button
                  key={slide.id}
                  onClick={() => setActiveId(slide.id)}
                  className={`w-full border p-2 text-left transition-colors ${
                    active?.id === slide.id
                      ? "border-accent"
                      : "border-border hover:border-muted-foreground/40"
                  }`}
                >
                  <SlidePreview slide={slide} index={i} brand={brand} />
                  <p className="mt-1.5 truncate text-xs text-muted-foreground">{slide.title}</p>
                </button>
              ))}
            </aside>

            <div>
              {draft ? <SlidePreview slide={draft} index={slides.indexOf(active!)} brand={brand} /> : null}

              <div className="mt-6 border border-border bg-card p-5">
                <p className="label-caps text-muted-foreground">Rewrite with AI</p>
                <Textarea
                  className="mt-3"
                  rows={3}
                  value={nudge}
                  onChange={(e) => setNudge(e.target.value)}
                  placeholder="Make it more commercial, lead with the cost of doing nothing…"
                />
                <Button className="mt-3" onClick={regenerate} disabled={busy === "regen"}>
                  {busy === "regen" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  Rewrite this slide
                </Button>
              </div>

              <div className="mt-6 border border-border bg-card p-5">
                <p className="label-caps text-muted-foreground">Work on this together</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Download the PowerPoint, import it at{" "}
                  <a
                    className="text-accent underline underline-offset-4"
                    href="https://slides.google.com/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    slides.google.com
                  </a>{" "}
                  (File → Import slides), then paste the link here so everyone in the workspace
                  edits the same copy.
                </p>
                <div className="mt-3 flex gap-2">
                  <Input
                    value={slidesUrl}
                    onChange={(e) => setSlidesUrl(e.target.value)}
                    placeholder="https://docs.google.com/presentation/d/…"
                  />
                  <Button variant="secondary" onClick={saveSlidesUrl}>
                    Save
                  </Button>
                </div>
                {deck.google_slides_url ? (
                  <a
                    className="mt-3 inline-flex items-center text-sm text-accent underline underline-offset-4"
                    href={deck.google_slides_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open shared Google Slides
                    <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                  </a>
                ) : null}
              </div>
            </div>

            {draft ? (
              <aside className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Title</Label>
                  <Input
                    value={draft.title}
                    onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Subtitle</Label>
                  <Input
                    value={draft.subtitle ?? ""}
                    onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Layout</Label>
                  <Select
                    value={draft.layout}
                    onValueChange={(value) => setDraft({ ...draft, layout: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LAYOUTS.map((layout) => (
                        <SelectItem key={layout} value={layout}>
                          {layout}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Bullets (one per line)</Label>
                  <Textarea
                    rows={6}
                    value={draft.bullets.join("\n")}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        bullets: e.target.value.split("\n").filter((line) => line.trim() !== ""),
                      })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Speaker notes</Label>
                  <Textarea
                    rows={5}
                    value={draft.speaker_notes ?? ""}
                    onChange={(e) => setDraft({ ...draft, speaker_notes: e.target.value })}
                  />
                </div>
                <Button className="w-full" onClick={saveDraft} disabled={busy === "save"}>
                  {busy === "save" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save slide
                </Button>
              </aside>
            ) : null}
          </div>
        )}
      </div>
    </AppShell>
  );
}
