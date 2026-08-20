import { useEffect, useMemo, useState } from "react";
import { HERO_FAMILY, NEUTRALS, SECONDARY_FAMILIES } from "@/lib/palette";

// Honest progress with a sense of humour. Status lines and the bar are driven by
// elapsed time only, and the bar never claims completion — the awaited server
// call is the real completion signal. Every line has to survive a client reading
// it over your shoulder, so the jokes stay dry and the verbs stay true.

type Kind = "outline" | "slides";

const STAGES: Record<Kind, { at: number; label: string; aside?: string }[]> = {
  outline: [
    { at: 0, label: "Reading everything you sent", aside: "Yes, all of it. Even the appendix." },
    {
      at: 5_000,
      label: "Looking for the throughline",
      aside: "There's usually one hiding in slide 14.",
    },
    { at: 11_000, label: "Arranging the argument", aside: "Beginning, middle, ask." },
    { at: 18_000, label: "Cutting the slides nobody needed", aside: "This is the kind part." },
    { at: 26_000, label: "Nearly there", aside: "Sharpening the last few titles." },
  ],
  slides: [
    { at: 0, label: "Laying out the story", aside: "Deciding what earns a slide." },
    { at: 6_000, label: "Writing the headlines", aside: "Statements, not labels." },
    { at: 14_000, label: "Filling in the evidence", aside: "Only the facts you actually gave me." },
    {
      at: 23_000,
      label: "Choosing a layout for each slide",
      aside: "From the approved set. No freelancing.",
    },
    {
      at: 33_000,
      label: "Leaving placeholders where a number should go",
      aside: "Better an honest blank than a confident guess.",
    },
    {
      at: 44_000,
      label: "Writing speaker notes",
      aside: "Things you can say out loud without wincing.",
    },
    { at: 56_000, label: "Removing three exclamation marks", aside: "You're welcome." },
    { at: 68_000, label: "Talking the deck out of a fifth bullet", aside: "It wanted seven." },
    {
      at: 82_000,
      label: "Still going",
      aside: "Long decks take longer. That's the whole explanation.",
    },
  ],
};

const ESTIMATE_MS: Record<Kind, number> = { outline: 30_000, slides: 75_000 };

// The ghost cards preview the real thing: the hero pair on the dark card and the
// rotating secondary families on the light ones, same as the deck being written.
const GHOSTS = [
  { dark: false, ink: HERO_FAMILY.dark, accent: SECONDARY_FAMILIES[0]!.dark },
  { dark: true, ink: HERO_FAMILY.light, accent: HERO_FAMILY.light, bg: HERO_FAMILY.dark },
  { dark: false, ink: NEUTRALS.heading, accent: SECONDARY_FAMILIES[1]!.dark },
];

/** Ghost slides that assemble themselves, one element at a time, on a loop. */
function GhostSlide({ phase, index }: { phase: number; index: number }) {
  // Each card builds over four beats then holds, offset so they stagger. The
  // title never leaves, so a card is never blank enough to look broken.
  const beat = (phase + index * 3) % 10;
  const g = GHOSTS[index]!;
  const shown = (n: number) => (beat >= n ? 1 : 0);

  return (
    <div
      className="relative aspect-video overflow-hidden border p-[8%]"
      style={{
        background: g.bg ?? NEUTRALS.white,
        borderColor: g.dark ? HERO_FAMILY.dark : "var(--border)",
      }}
    >
      <span className="absolute inset-y-0 left-0 w-[5px]" style={{ background: g.accent }} />
      <div
        className="h-[10%] rounded-[2px] transition-all duration-700 ease-out"
        style={{ background: g.ink, width: beat >= 1 ? "66%" : "28%" }}
      />
      <div
        className="mt-[6%] h-[5%] rounded-[2px] transition-all duration-700 ease-out"
        style={{ background: g.accent, width: beat >= 2 ? "42%" : "0%", opacity: shown(2) * 0.85 }}
      />
      <div className="mt-[9%] space-y-[7%]">
        {[94, 80, 87].map((w, i) => (
          <div
            key={i}
            className="h-[5%] rounded-[2px] transition-all duration-500 ease-out"
            style={{
              background: g.ink,
              width: beat >= 3 + i ? `${w}%` : "0%",
              opacity: beat >= 3 + i ? (g.dark ? 0.6 : 0.4) : 0,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function GenerationOverlay({ kind }: { kind: Kind }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const timer = setInterval(() => setElapsed(Date.now() - start), 180);
    return () => clearInterval(timer);
  }, []);

  const stages = STAGES[kind];
  const stage = useMemo(
    () => [...stages].reverse().find((s) => elapsed >= s.at) ?? stages[0]!,
    [stages, elapsed],
  );

  // Approaches 96% asymptotically: always moving, never arriving on its own.
  const progress = 96 * (1 - Math.exp(-elapsed / (ESTIMATE_MS[kind] * 0.55)));
  const phase = Math.floor(elapsed / 900);
  const seconds = Math.floor(elapsed / 1000);

  return (
    <section className="mt-10" aria-live="polite" aria-busy="true">
      <p className="label-caps text-accent">
        {kind === "outline" ? "Building the outline" : "Writing your deck"}
      </p>

      <h1
        key={stage.label}
        className="mt-2 animate-in fade-in slide-in-from-bottom-2 text-4xl leading-tight duration-500"
      >
        {stage.label}
        <span className="inline-block w-8 text-left">{".".repeat((phase % 3) + 1)}</span>
      </h1>

      {stage.aside ? (
        <p
          key={stage.aside}
          className="mt-3 animate-in fade-in text-sm italic text-muted-foreground duration-700"
        >
          {stage.aside}
        </p>
      ) : null}

      <div className="mt-8 h-1 w-full overflow-hidden bg-border">
        <div
          className="h-1 bg-accent transition-[width] duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-8 grid grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <GhostSlide key={i} phase={phase} index={i} />
        ))}
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        {seconds < 45
          ? "Every fact comes from your sources. Anything missing gets a visible placeholder, never a guess."
          : "Still working. Leaving this tab is fine, the deck keeps building."}
      </p>
    </section>
  );
}
