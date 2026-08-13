import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus, FileText } from "lucide-react";
import { AppShell, PageHeading } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { listDecks } from "@/lib/deck-queries";

const STAGE_LABEL: Record<string, string> = {
  intake: "Intake in progress",
  outline: "Outline ready",
  generating: "Generating",
  ready: "Draft ready",
};

export const Route = createFileRoute("/_authenticated/decks/")({
  head: () => ({
    meta: [
      { title: "Your decks — Deck Studio" },
      {
        name: "description",
        content: "Every business development deck your team has drafted, reviewed and exported.",
      },
      { property: "og:title", content: "Your decks — Deck Studio" },
      { property: "og:description", content: "Business development decks for your team." },
    ],
  }),
  component: DeckLibrary,
});

function DeckLibrary() {
  const { data, isLoading } = useQuery({ queryKey: ["decks"], queryFn: listDecks });

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-6 py-12">
        <PageHeading
          eyebrow="Workspace"
          title="Your decks"
          description="Start from a brief, hand over your notes and reference pitches, then review and export."
          action={
            <Button asChild>
              <Link to="/decks/new">
                <Plus className="mr-2 h-4 w-4" />
                New deck
              </Link>
            </Button>
          }
        />

        {isLoading ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-36 w-full" />
            ))}
          </div>
        ) : !data?.length ? (
          <div className="mt-16 border border-dashed border-border py-20 text-center">
            <FileText className="mx-auto h-8 w-8 text-muted-foreground/50" />
            <h2 className="mt-4 text-2xl">No decks yet</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
              Your first deck takes three questions and whatever material you already have lying
              around.
            </p>
            <Button asChild className="mt-6">
              <Link to="/decks/new">Start a deck</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((deck) => (
              <Link
                key={deck.id}
                to={deck.stage === "intake" ? "/decks/$deckId/intake" : "/decks/$deckId"}
                params={{ deckId: deck.id }}
                className="group flex flex-col justify-between border border-border bg-card p-5 transition-colors hover:border-accent"
              >
                <div>
                  <p className="label-caps text-accent">{STAGE_LABEL[deck.stage] ?? deck.stage}</p>
                  <h2 className="mt-2 text-2xl leading-tight group-hover:text-accent">
                    {deck.title}
                  </h2>
                  {deck.client_name ? (
                    <p className="mt-1 text-sm text-muted-foreground">{deck.client_name}</p>
                  ) : null}
                </div>
                <p className="mt-6 text-xs text-muted-foreground">
                  Updated {new Date(deck.updated_at).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
