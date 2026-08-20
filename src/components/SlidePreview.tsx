import type { Slide } from "@/lib/deck-types";
import { brandStyle, DEFAULT_BRAND, type Brand } from "@/lib/brand";
import { normalizeLayout, splitBullet, splitColumns, TEXT_ONLY_LAYOUTS } from "@/lib/slide-layouts";
import { slideTheme } from "@/lib/palette";

/** "Label: sentence", with the label carrying the weight. */
function Bullet({ text }: { text: string }) {
  const { label, body } = splitBullet(text);
  return (
    <li className="flex gap-[2.5%]">
      <span
        className="mt-[0.5em] h-[0.3em] w-[0.3em] shrink-0 rounded-full"
        style={{ background: "var(--b-accent)" }}
      />
      <span>
        {label ? (
          <span className="font-semibold" style={{ color: "var(--b-heading)" }}>
            {label}:{" "}
          </span>
        ) : null}
        {body}
      </span>
    </li>
  );
}

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
  const theme = slideTheme(brand, layout, index);
  const dark =
    layout === "title" || layout === "closing" || layout === "section" || layout === "case-study";
  const quote = layout === "quote";
  // A statement slide never carries body copy, whatever the model returned.
  const bullets = TEXT_ONLY_LAYOUTS.includes(layout) ? [] : slide.bullets;

  const surface = dark
    ? { background: "var(--b-dark)", color: "var(--b-on-dark)" }
    : quote
      ? { background: "var(--b-tint)", color: "var(--b-heading)" }
      : { background: "var(--b-light)", color: "var(--b-heading)" };

  const header = (
    <>
      <h3
        className="text-[clamp(0.95rem,2.5cqw,1.65rem)] leading-tight"
        style={{ fontFamily: "var(--b-font-heading)" }}
      >
        {slide.title}
      </h3>
      {slide.subtitle ? (
        <p
          className="mt-[1.5%] text-[clamp(0.5rem,1.25cqw,0.82rem)]"
          style={{ color: "var(--b-accent)" }}
        >
          {slide.subtitle}
        </p>
      ) : null}
      <span className="mt-[2.5%] h-[3px] w-10 shrink-0" style={{ background: "var(--b-accent)" }} />
    </>
  );

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
          className="absolute right-[4%] top-[4%] max-h-[7.5%] max-w-[17%] object-contain"
        />
      ) : null}

      {quote ? (
        <div className="flex h-full flex-col justify-center px-[8%]">
          <p
            className="text-[clamp(1rem,3cqw,1.95rem)] italic leading-tight"
            style={{ fontFamily: "var(--b-font-heading)" }}
          >
            {slide.title}
          </p>
          {slide.subtitle ? (
            <p
              className="mt-[3%] text-[clamp(0.6rem,1.4cqw,0.9rem)] font-medium"
              style={{ color: "var(--b-accent)" }}
            >
              {slide.subtitle}
            </p>
          ) : null}
        </div>
      ) : layout === "title" || layout === "closing" ? (
        <div className="flex h-full flex-col justify-center px-[8%]">
          <h3
            className="text-[clamp(1.1rem,3.3cqw,2.2rem)] leading-tight"
            style={{ fontFamily: "var(--b-font-heading)" }}
          >
            {slide.title}
          </h3>
          {slide.subtitle ? (
            <p
              className="mt-[3%] text-[clamp(0.55rem,1.3cqw,0.85rem)] opacity-75"
              style={{ color: "var(--b-on-dark)" }}
            >
              {slide.subtitle}
            </p>
          ) : null}
        </div>
      ) : layout === "section" ? (
        <div className="flex h-full flex-col justify-center px-[8%]">
          {slide.subtitle ? (
            <p className="mb-[2.5%] text-[clamp(0.45rem,1cqw,0.7rem)] font-semibold uppercase tracking-[0.18em] opacity-80">
              {slide.subtitle}
            </p>
          ) : null}
          <h3
            className="text-[clamp(1.2rem,3.6cqw,2.4rem)] leading-tight"
            style={{ fontFamily: "var(--b-font-heading)" }}
          >
            {slide.title}
          </h3>
        </div>
      ) : layout === "case-study" ? (
        <div className="flex h-full flex-col px-[8%] pt-[7%]">
          <p className="text-[clamp(0.4rem,0.95cqw,0.65rem)] font-semibold uppercase tracking-[0.2em] opacity-70">
            Our work in action
          </p>
          <h3
            className="mt-[1.5%] text-[clamp(0.9rem,2.4cqw,1.55rem)] leading-tight"
            style={{ fontFamily: "var(--b-font-heading)" }}
          >
            {slide.title}
          </h3>
          <dl className="mt-[5%] space-y-[3.5%] text-[clamp(0.45rem,1.15cqw,0.8rem)] leading-snug">
            {bullets.slice(0, 3).map((raw, i) => {
              const { label, body } = splitBullet(raw);
              return (
                <div key={i} className="flex gap-[3%]">
                  <dt
                    className="w-[22%] shrink-0 text-[0.82em] font-semibold uppercase tracking-[0.12em]"
                    style={{ color: "var(--b-accent)" }}
                  >
                    {label ? label.replace(/:$/, "") : `0${i + 1}`}
                  </dt>
                  <dd className="opacity-90">{body}</dd>
                </div>
              );
            })}
          </dl>
        </div>
      ) : (
        <div className="flex h-full flex-col px-[8%] pt-[7%]">
          {header}

          {layout === "pillars" && bullets.length ? (
            <div className="mt-[4.5%] grid flex-1 grid-cols-3 gap-[3%]">
              {bullets.slice(0, 3).map((raw, i) => {
                const { label, body } = splitBullet(raw);
                return (
                  <div
                    key={i}
                    className="flex flex-col p-[7%] text-[clamp(0.4rem,1.05cqw,0.72rem)] leading-snug"
                    style={{ background: "var(--b-tint)", color: "var(--b-body)" }}
                  >
                    <span
                      className="mb-[6%] block h-[3px] w-6"
                      style={{ background: "var(--b-accent)" }}
                    />
                    <span
                      className="text-[1.15em] font-semibold leading-tight"
                      style={{ color: "var(--b-heading)", fontFamily: "var(--b-font-heading)" }}
                    >
                      {label ?? `0${i + 1}`}
                    </span>
                    <span className="mt-[6%]">{body}</span>
                  </div>
                );
              })}
            </div>
          ) : layout === "process" && bullets.length ? (
            <ol className="mt-[4%] space-y-[2.5%] text-[clamp(0.45rem,1.2cqw,0.82rem)] leading-snug">
              {bullets.slice(0, 5).map((raw, i) => {
                const { label, body } = splitBullet(raw);
                return (
                  <li key={i} className="flex gap-[3%]">
                    <span
                      className="w-[6%] shrink-0 font-semibold"
                      style={{ color: "var(--b-accent)", fontFamily: "var(--b-font-heading)" }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span style={{ color: "var(--b-body)" }}>
                      {label ? (
                        <span className="font-semibold" style={{ color: "var(--b-heading)" }}>
                          {label}:{" "}
                        </span>
                      ) : null}
                      {body}
                    </span>
                  </li>
                );
              })}
            </ol>
          ) : layout === "stat" && bullets.length ? (
            <div className="mt-[4.5%] grid flex-1 grid-cols-3 gap-[3%]">
              {bullets.slice(0, 3).map((raw, i) => {
                const { label, body } = splitBullet(raw);
                return (
                  <div
                    key={i}
                    className="flex flex-col p-[7%] text-[clamp(0.38rem,1cqw,0.7rem)] leading-snug"
                    style={{ background: "var(--b-tint)", color: "var(--b-body)" }}
                  >
                    <span
                      className="text-[1.9em] font-semibold leading-none"
                      style={{ color: "var(--b-heading)", fontFamily: "var(--b-font-heading)" }}
                    >
                      {label ?? ""}
                    </span>
                    <span className="mt-[8%]">{body}</span>
                  </div>
                );
              })}
            </div>
          ) : layout === "two-column" && bullets.length ? (
            <div className="mt-[4%] grid grid-cols-2 gap-x-[5%]">
              {splitColumns(bullets).map((column, c) => (
                <ul
                  key={c}
                  className={`space-y-[5%] text-[clamp(0.42rem,1.15cqw,0.8rem)] leading-snug ${
                    c === 1 ? "border-l pl-[5%]" : ""
                  }`}
                  style={{ color: "var(--b-body)", borderColor: "var(--b-tint)" }}
                >
                  {column.map((bullet, i) => (
                    <Bullet key={i} text={bullet} />
                  ))}
                </ul>
              ))}
            </div>
          ) : bullets.length ? (
            <ul
              className="mt-[4%] space-y-[3%] text-[clamp(0.45rem,1.2cqw,0.85rem)] leading-snug"
              style={{ color: "var(--b-body)" }}
            >
              {bullets.map((bullet, i) => (
                <Bullet key={i} text={bullet} />
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
