import type { Slide } from "@/lib/deck-types";
import { brandStyle, DEFAULT_BRAND, type Brand } from "@/lib/brand";
import { normalizeLayout, splitColumns } from "@/lib/slide-layouts";
import { slideTheme } from "@/lib/palette";

export function SlidePreview({
  slide,
  index,
  brand = DEFAULT_BRAND,
}: {
  slide: Slide;
  index: number;
  brand?: Brand;
}) {
  const layout = normalizeLayout(slide.layout);
  // Per-slide effective brand: rotating Orchestra color family + matching logo.
  const theme = slideTheme(brand, layout, index);
  const dark = layout === "title" || layout === "closing" || layout === "section";
  const quote = layout === "quote";

  const surface = dark
    ? { background: "var(--b-dark)", color: "var(--b-on-dark)" }
    : quote
      ? { background: "var(--b-tint)", color: "var(--b-heading)" }
      : { background: "var(--b-light)", color: "var(--b-heading)" };

  return (
    <div
      style={{ ...brandStyle(theme), ...surface, fontFamily: "var(--b-font-body)" }}
      className="@container relative flex aspect-video w-full flex-col overflow-hidden border border-border"
    >
      {dark ? (
        <span
          className="absolute inset-y-0 left-0 w-[6px]"
          style={{ background: "var(--b-accent)" }}
        />
      ) : null}

      {theme.logo ? (
        <img
          src={theme.logo}
          alt=""
          className="absolute right-[4%] top-[4%] max-h-[8%] max-w-[18%] object-contain"
        />
      ) : null}

      {quote ? (
        <div className="flex h-full flex-col justify-center px-[8%]">
          <p
            className="text-[clamp(1rem,3.1cqw,2rem)] italic leading-tight"
            style={{ fontFamily: "var(--b-font-heading)" }}
          >
            {slide.title}
          </p>
          {slide.subtitle ? (
            <p
              className="mt-4 text-[clamp(0.6rem,1.4cqw,0.9rem)] font-medium"
              style={{ color: "var(--b-accent)" }}
            >
              {slide.subtitle}
            </p>
          ) : null}
        </div>
      ) : layout === "section" ? (
        <div className="flex h-full flex-col justify-center px-[8%]">
          {slide.subtitle ? (
            <p className="mb-3 text-[clamp(0.5rem,1.1cqw,0.75rem)] font-semibold uppercase tracking-[0.18em] opacity-80">
              {slide.subtitle}
            </p>
          ) : null}
          <h3
            className="text-[clamp(1.2rem,3.8cqw,2.6rem)] leading-tight"
            style={{ fontFamily: "var(--b-font-heading)" }}
          >
            {slide.title}
          </h3>
        </div>
      ) : (
        <div className={`flex h-full flex-col px-[8%] ${dark ? "justify-center" : "pt-[7%]"}`}>
          <h3
            className={`leading-tight ${
              dark ? "text-[clamp(1.1rem,3.4cqw,2.3rem)]" : "text-[clamp(0.95rem,2.6cqw,1.7rem)]"
            }`}
            style={{ fontFamily: "var(--b-font-heading)" }}
          >
            {slide.title}
          </h3>

          {slide.subtitle ? (
            <p
              className="mt-2 text-[clamp(0.55rem,1.3cqw,0.85rem)]"
              style={{
                color: dark ? "var(--b-on-dark)" : "var(--b-accent)",
                opacity: dark ? 0.7 : 1,
              }}
            >
              {slide.subtitle}
            </p>
          ) : null}

          {!dark ? (
            <span className="mt-3 h-[3px] w-10" style={{ background: "var(--b-accent)" }} />
          ) : null}

          {layout === "stat" && slide.bullets.length ? (
            <div className="mt-[5%] grid flex-1 grid-cols-3 gap-[3%]">
              {slide.bullets.slice(0, 3).map((bullet, i) => (
                <div
                  key={i}
                  className="flex items-center p-[6%] text-[clamp(0.5rem,1.25cqw,0.85rem)] leading-snug"
                  style={{ background: "var(--b-tint)", color: "var(--b-heading)" }}
                >
                  {bullet}
                </div>
              ))}
            </div>
          ) : layout === "two-column" && slide.bullets.length ? (
            <div className="mt-[4%] grid grid-cols-2 gap-x-[5%]">
              {splitColumns(slide.bullets).map((column, c) => (
                <ul
                  key={c}
                  className={`space-y-[4.5%] text-[clamp(0.5rem,1.3cqw,0.9rem)] leading-snug ${
                    c === 1 ? "border-l pl-[5%]" : ""
                  }`}
                  style={{ color: "var(--b-body)", opacity: 0.9, borderColor: "var(--b-tint)" }}
                >
                  {column.map((bullet, i) => (
                    <li key={i} className="flex gap-2">
                      <span
                        className="mt-[0.45em] h-[0.3em] w-[0.3em] shrink-0 rounded-full"
                        style={{ background: "var(--b-accent)" }}
                      />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          ) : slide.bullets.length ? (
            <ul
              className="mt-[4%] space-y-[2.2%] text-[clamp(0.5rem,1.3cqw,0.9rem)] leading-snug"
              style={{
                color: dark ? "var(--b-on-dark)" : "var(--b-body)",
                opacity: dark ? 0.85 : 0.9,
              }}
            >
              {slide.bullets.map((bullet, i) => (
                <li key={i} className="flex gap-2">
                  <span
                    className="mt-[0.45em] h-[0.3em] w-[0.3em] shrink-0 rounded-full"
                    style={{ background: "var(--b-accent)" }}
                  />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      )}

      <span
        className="absolute bottom-[3%] right-[4%] text-[clamp(0.4rem,0.95cqw,0.7rem)] opacity-50"
        style={{ color: dark ? "var(--b-on-dark)" : "var(--b-body)" }}
      >
        {String(index + 1).padStart(2, "0")}
      </span>
    </div>
  );
}
