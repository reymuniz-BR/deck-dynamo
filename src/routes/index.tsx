import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Deck Studio — BD decks built from your own material" },
      {
        name: "description",
        content:
          "Answer three questions, hand over your notes and past pitches, and get a business development deck your team can review, edit and export.",
      },
      { property: "og:title", content: "Deck Studio — BD decks built from your own material" },
      {
        property: "og:description",
        content:
          "Three questions, your own notes and reference decks, and a first-draft BD deck ready to export.",
      },
    ],
  }),
  component: Landing,
});

const STEPS = [
  {
    n: "01",
    title: "Tell me about your project",
    body: "Who the client is, what you're pitching, why now, and what winning looks like.",
  },
  {
    n: "02",
    title: "Share your notes and templates",
    body: "Discovery notes, positioning docs, pricing, and the house template you always start from.",
  },
  {
    n: "03",
    title: "Point at decks that worked",
    body: "Attach similar past pitches and say why — the content, the structure, or both.",
  },
  {
    n: "04",
    title: "Review, edit, export",
    body: "Rewrite any slide, then export to PowerPoint, PDF, or move it into Google Slides for the team.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex h-20 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-2.5">
          <span className="h-5 w-1.5 rounded-full bg-accent" />
          <span className="text-display text-xl">Deck Studio</span>
        </div>
        <Button asChild variant="ghost">
          <Link to="/auth">Sign in</Link>
        </Button>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-24 pt-16">
        <p className="label-caps text-accent">Business development decks</p>
        <h1 className="mt-4 max-w-3xl text-6xl leading-[1.03] sm:text-7xl">
          Your next pitch, drafted from the decks that already won.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground">
          Deck Studio interviews you in three steps, reads the material you already have, and
          writes a first draft that follows your template and your language — never invented facts.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link to="/auth">
              Start a deck
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <section className="border-y border-border bg-sand/40">
        <div className="mx-auto grid max-w-6xl gap-px bg-border px-6 py-0 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => (
            <div key={step.n} className="bg-background p-8">
              <p className="text-display text-3xl text-accent">{step.n}</p>
              <h2 className="mt-3 text-xl leading-snug">{step.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-4xl leading-tight">Built for teams, not for solo drafts</h2>
            <p className="mt-4 text-muted-foreground">
              Every deck lives in a shared workspace, so anyone on the team can pick up the draft,
              rewrite a slide, or push it into Google Slides for simultaneous editing before the
              meeting.
            </p>
          </div>
          <div>
            <h2 className="text-4xl leading-tight">No invented numbers</h2>
            <p className="mt-4 text-muted-foreground">
              Where a figure is needed but missing from your material, the draft leaves a visible
              placeholder instead of guessing. What lands on the slide is yours.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8 text-sm text-muted-foreground">
          <span>Deck Studio</span>
          <Link to="/auth" className="hover:text-foreground">
            Sign in
          </Link>
        </div>
      </footer>
    </div>
  );
}
