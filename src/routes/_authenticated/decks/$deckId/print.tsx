import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SlidePreview } from "@/components/SlidePreview";
import { Button } from "@/components/ui/button";
import { getDeck, getSlides } from "@/lib/deck-queries";

export const Route = createFileRoute("/_authenticated/decks/$deckId/print")({
  head: () => ({
    meta: [
      { title: "Print view — Deck Studio" },
      {
        name: "description",
        content: "Print-ready view of your business development deck — save it straight to PDF.",
      },
      { property: "og:title", content: "Print view — Deck Studio" },
      { property: "og:description", content: "Print-ready view of your deck." },
    ],
  }),
  component: PrintView,
});

function PrintView() {
  const { deckId } = Route.useParams();
  const deckQuery = useQuery({ queryKey: ["deck", deckId], queryFn: () => getDeck(deckId) });
  const slidesQuery = useQuery({ queryKey: ["slides", deckId], queryFn: () => getSlides(deckId) });

  const slides = slidesQuery.data ?? [];

  return (
    <div className="min-h-screen bg-muted/40 py-10">
      <div className="no-print mx-auto mb-8 flex max-w-4xl items-center justify-between px-6">
        <div>
          <h1 className="text-2xl">{deckQuery.data?.title ?? "Deck"}</h1>
          <p className="text-sm text-muted-foreground">
            Use your browser's print dialog and choose “Save as PDF”. Landscape works best.
          </p>
        </div>
        <Button onClick={() => window.print()}>Print / Save PDF</Button>
      </div>

      <div className="mx-auto max-w-4xl space-y-8 px-6">
        {slides.map((slide, i) => (
          <div key={slide.id} className="break-inside-avoid">
            <SlidePreview slide={slide} index={i} />
          </div>
        ))}
      </div>
    </div>
  );
}
