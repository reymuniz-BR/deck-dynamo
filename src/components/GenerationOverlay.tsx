import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// Honest progress: status lines and the bar are driven by elapsed time only,
// and the bar never claims completion — the awaited server call is the real
// completion signal.

const STAGES: Record<"outline" | "slides", { at: number; label: string }[]> = {
  outline: [
    { at: 0, label: "Reading your sources…" },
    { at: 4_000, label: "Finding the throughline…" },
    { at: 9_000, label: "Structuring the outline…" },
    { at: 16_000, label: "Nearly there…" },
  ],
  slides: [
    { at: 0, label: "Structuring the story…" },
    { at: 5_000, label: "Writing slide copy…" },
    { at: 12_000, label: "Choosing layouts for each slide…" },
    { at: 20_000, label: "Adding speaker notes…" },
    { at: 32_000, label: "Polishing the language…" },
    { at: 48_000, label: "Almost done — longer decks take a little longer…" },
  ],
};

const ESTIMATE_MS = { outline: 25_000, slides: 60_000 };

export function GenerationOverlay({ kind }: { kind: "outline" | "slides" }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const timer = setInterval(() => setElapsed(Date.now() - start), 200);
    return () => clearInterval(timer);
  }, []);

  const stages = STAGES[kind];
  const stage = [...stages].reverse().find((s) => elapsed >= s.at) ?? stages[0]!;
  const progress = Math.min(92, (elapsed / ESTIMATE_MS[kind]) * 92);
  const activeCard = Math.floor(elapsed / 900) % 3;

  return (
    <section className="mt-10" aria-live="polite">
      <p className="label-caps text-accent">
        {kind === "outline" ? "Drafting the outline" : "Writing your deck"}
      </p>
      <h1 className="mt-2 text-4xl leading-tight">{stage.label}</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Every fact comes from your sources — anything missing gets a visible placeholder, never a
        guess.
      </p>

      <div className="mt-8 h-1 w-full bg-border">
        <div
          className="h-1 bg-accent transition-[width] duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-8 grid grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`border p-3 transition-all duration-500 ${
              i === activeCard ? "border-accent opacity-100" : "border-border opacity-50"
            }`}
          >
            <Skeleton className="aspect-video w-full" />
            <Skeleton className="mt-2 h-2 w-2/3" />
            <Skeleton className="mt-1.5 h-2 w-1/2" />
          </div>
        ))}
      </div>
    </section>
  );
}
