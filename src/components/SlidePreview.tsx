import type { Slide } from "@/lib/deck-types";

export function SlidePreview({ slide, index }: { slide: Slide; index: number }) {
  const dark = slide.layout === "title" || slide.layout === "closing";

  return (
    <div
      className={`relative flex aspect-video w-full flex-col overflow-hidden border ${
        dark ? "border-ink bg-ink text-ink-foreground" : "border-border bg-card text-card-foreground"
      }`}
    >
      {dark ? <span className="absolute inset-y-0 left-0 w-[6px] bg-accent" /> : null}

      {slide.layout === "quote" ? (
        <div className="flex h-full flex-col justify-center bg-sand px-[8%] text-ink">
          <p className="text-display text-[clamp(1rem,3.1cqw,2rem)] italic leading-tight">
            {slide.title}
          </p>
          {slide.subtitle ? (
            <p className="mt-4 text-[clamp(0.6rem,1.4cqw,0.9rem)] font-medium text-accent">
              {slide.subtitle}
            </p>
          ) : null}
        </div>
      ) : (
        <div className={`flex h-full flex-col px-[8%] ${dark ? "justify-center" : "pt-[7%]"}`}>
          <h3
            className={`text-display leading-tight ${
              dark ? "text-[clamp(1.1rem,3.4cqw,2.3rem)]" : "text-[clamp(0.95rem,2.6cqw,1.7rem)]"
            }`}
          >
            {slide.title}
          </h3>

          {slide.subtitle ? (
            <p
              className={`mt-2 text-[clamp(0.55rem,1.3cqw,0.85rem)] ${
                dark ? "text-ink-foreground/70" : "text-accent"
              }`}
            >
              {slide.subtitle}
            </p>
          ) : null}

          {!dark ? <span className="mt-3 h-[3px] w-10 bg-accent" /> : null}

          {slide.layout === "stat" && slide.bullets.length ? (
            <div className="mt-[5%] grid flex-1 grid-cols-3 gap-[3%]">
              {slide.bullets.slice(0, 3).map((bullet, i) => (
                <div
                  key={i}
                  className="flex items-center bg-sand p-[6%] text-[clamp(0.5rem,1.25cqw,0.85rem)] leading-snug text-ink"
                >
                  {bullet}
                </div>
              ))}
            </div>
          ) : slide.bullets.length ? (
            <ul
              className={`mt-[4%] space-y-[2.2%] text-[clamp(0.5rem,1.3cqw,0.9rem)] leading-snug ${
                dark ? "text-ink-foreground/80" : "text-muted-foreground"
              }`}
            >
              {slide.bullets.map((bullet, i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-[0.45em] h-[0.3em] w-[0.3em] shrink-0 rounded-full bg-accent" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      )}

      <span
        className={`absolute bottom-[3%] right-[4%] text-[clamp(0.4rem,0.95cqw,0.7rem)] ${
          dark ? "text-ink-foreground/40" : "text-muted-foreground/60"
        }`}
      >
        {String(index + 1).padStart(2, "0")}
      </span>
    </div>
  );
}
