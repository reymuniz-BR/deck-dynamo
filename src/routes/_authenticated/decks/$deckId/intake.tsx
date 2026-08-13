import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Loader2, Sparkles, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { SourceCollector } from "@/components/SourceCollector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { getDeck, getMyWorkspaceId, getSources } from "@/lib/deck-queries";
import { supabase } from "@/integrations/supabase/client";
import { proposeOutline, generateSlides } from "@/lib/deck.functions";

export const Route = createFileRoute("/_authenticated/decks/$deckId/intake")({
  head: () => ({
    meta: [
      { title: "Deck intake — Deck Studio" },
      {
        name: "description",
        content:
          "Share your notes, templates and past pitch decks so Deck Studio can draft an outline that sounds like your team.",
      },
      { property: "og:title", content: "Deck intake — Deck Studio" },
      { property: "og:description", content: "Share notes, templates and past pitch decks." },
    ],
  }),
  component: Intake,
});

type OutlineItem = { title: string; purpose: string };

function Intake() {
  const { deckId } = Route.useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(2);
  const [outline, setOutline] = useState<OutlineItem[]>([]);
  const [working, setWorking] = useState<null | "outline" | "slides">(null);

  const runOutline = useServerFn(proposeOutline);
  const runSlides = useServerFn(generateSlides);

  const deckQuery = useQuery({ queryKey: ["deck", deckId], queryFn: () => getDeck(deckId) });
  const sourcesQuery = useQuery({
    queryKey: ["sources", deckId],
    queryFn: () => getSources(deckId),
  });
  const wsQuery = useQuery({ queryKey: ["workspace"], queryFn: getMyWorkspaceId });

  useEffect(() => {
    const existing = deckQuery.data?.outline;
    if (existing?.length && outline.length === 0) {
      setOutline(existing);
      setStep(4);
    }
  }, [deckQuery.data, outline.length]);

  if (deckQuery.isLoading || wsQuery.isLoading) {
    return (
      <AppShell>
        <div className="mx-auto max-w-3xl space-y-4 px-6 py-14">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-48 w-full" />
        </div>
      </AppShell>
    );
  }

  const deck = deckQuery.data;
  const ws = wsQuery.data;
  if (!deck || !ws) return null;

  const allSources = sourcesQuery.data ?? [];
  const materials = allSources.filter((s) => s.kind !== "reference");
  const references = allSources.filter((s) => s.kind === "reference");

  async function buildOutline() {
    setWorking("outline");
    try {
      const result = await runOutline({ data: { deckId } });
      setOutline(result.outline);
      setStep(4);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not draft an outline");
    } finally {
      setWorking(null);
    }
  }

  async function build() {
    setWorking("slides");
    try {
      const { error } = await supabase.from("decks").update({ outline }).eq("id", deckId);
      if (error) throw new Error(error.message);
      await runSlides({ data: { deckId } });
      navigate({ to: "/decks/$deckId", params: { deckId } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Generation failed");
      setWorking(null);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-6 py-14">
        <Link
          to="/decks"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          All decks
        </Link>

        <div className="mt-8 flex gap-1.5">
          {[1, 2, 3, 4].map((n) => (
            <span
              key={n}
              className={`h-1 flex-1 ${n <= step ? "bg-accent" : "bg-border"}`}
              aria-hidden
            />
          ))}
        </div>

        {step === 2 ? (
          <section className="mt-10">
            <p className="label-caps text-accent">Step 2 of 3</p>
            <h1 className="mt-2 text-4xl leading-tight">
              Share any relevant notes, templates or material
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Discovery notes, positioning docs, your standard deck template, pricing sheets —
              anything the draft should draw from or imitate.
            </p>

            <div className="mt-8">
              <SourceCollector
                deckId={deckId}
                workspaceId={ws.workspaceId}
                userId={ws.userId}
                fileKind="file"
                requireWhy={false}
                allowNotes
                sources={materials}
                onChanged={() => sourcesQuery.refetch()}
              />
            </div>

            <div className="mt-10 flex items-center gap-3">
              <Button size="lg" onClick={() => setStep(3)}>
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground">
                {materials.length} item{materials.length === 1 ? "" : "s"} added
              </span>
            </div>
          </section>
        ) : null}

        {step === 3 ? (
          <section className="mt-10">
            <p className="label-caps text-accent">Step 3 of 3</p>
            <h1 className="mt-2 text-4xl leading-tight">
              Share previous decks that feel similar — and say why
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Tell me whether you're pointing at the content or the structure. That single sentence
              is what makes the draft sound like you rather than like a generic pitch.
            </p>

            <div className="mt-8">
              <SourceCollector
                deckId={deckId}
                workspaceId={ws.workspaceId}
                userId={ws.userId}
                fileKind="reference"
                requireWhy
                allowNotes={false}
                sources={references}
                onChanged={() => sourcesQuery.refetch()}
              />
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Button variant="ghost" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button size="lg" onClick={buildOutline} disabled={working !== null}>
                {working === "outline" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                {working === "outline" ? "Drafting outline…" : "Create the deck outline"}
              </Button>
            </div>
          </section>
        ) : null}

        {step === 4 ? (
          <section className="mt-10">
            <p className="label-caps text-accent">Outline</p>
            <h1 className="mt-2 text-4xl leading-tight">Check the shape before I write it</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Edit any title or purpose, drop what doesn't belong, then generate the full deck.
            </p>

            <ol className="mt-8 space-y-3">
              {outline.map((item, i) => (
                <li key={i} className="flex gap-3 border border-border bg-card p-4">
                  <span className="label-caps mt-2 w-6 shrink-0 text-muted-foreground">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1 space-y-2">
                    <Input
                      value={item.title}
                      onChange={(e) =>
                        setOutline((prev) =>
                          prev.map((it, idx) =>
                            idx === i ? { ...it, title: e.target.value } : it,
                          ),
                        )
                      }
                    />
                    <Textarea
                      rows={2}
                      value={item.purpose}
                      onChange={(e) =>
                        setOutline((prev) =>
                          prev.map((it, idx) =>
                            idx === i ? { ...it, purpose: e.target.value } : it,
                          ),
                        )
                      }
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setOutline((prev) => prev.filter((_, idx) => idx !== i))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ol>

            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setOutline((prev) => [...prev, { title: "New slide", purpose: "" }])}
            >
              Add a slide
            </Button>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Button variant="ghost" onClick={() => setStep(3)}>
                Back to sources
              </Button>
              <Button
                size="lg"
                onClick={build}
                disabled={working !== null || outline.length === 0}
              >
                {working === "slides" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                {working === "slides" ? "Writing your deck…" : "Generate the deck"}
              </Button>
            </div>
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}
