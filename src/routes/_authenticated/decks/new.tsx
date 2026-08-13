import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { getMyWorkspaceId } from "@/lib/deck-queries";

export const Route = createFileRoute("/_authenticated/decks/new")({
  head: () => ({
    meta: [
      { title: "Tell me about your project — Deck Studio" },
      {
        name: "description",
        content:
          "Describe the opportunity and Deck Studio turns your notes and reference pitches into a first-draft business development deck.",
      },
      { property: "og:title", content: "Start a new deck — Deck Studio" },
      {
        property: "og:description",
        content: "Describe the opportunity and get a first-draft BD deck.",
      },
    ],
  }),
  component: NewDeck,
});

function NewDeck() {
  const navigate = useNavigate();
  const [brief, setBrief] = useState("");
  const [title, setTitle] = useState("");
  const [client, setClient] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (brief.trim().length < 20) {
      toast.error("Give me a bit more to work with — a few sentences at least.");
      return;
    }
    setBusy(true);
    try {
      const { workspaceId, userId } = await getMyWorkspaceId();
      const { data, error } = await supabase
        .from("decks")
        .insert({
          workspace_id: workspaceId,
          created_by: userId,
          title: title.trim() || "Untitled deck",
          client_name: client.trim() || null,
          project_brief: brief.trim(),
          stage: "intake",
        })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      navigate({ to: "/decks/$deckId/intake", params: { deckId: data.id } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create the deck");
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-6 py-14">
        <Link
          to="/decks"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          All decks
        </Link>

        <p className="label-caps mt-10 text-accent">Step 1 of 3</p>
        <h1 className="mt-2 text-4xl leading-tight">Tell me about your project</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Who is the client, what are you pitching, why now, and what does winning look like? Write
          it the way you'd brief a colleague.
        </p>

        <form onSubmit={submit} className="mt-10 space-y-6">
          <div className="space-y-1.5">
            <Label htmlFor="brief">Project brief</Label>
            <Textarea
              id="brief"
              rows={10}
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder="We're pitching a 12-week brand repositioning to a mid-market fintech. They've just raised a Series B and their current positioning reads like a 2019 neobank..."
              className="resize-y"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="title">Deck name</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Series B repositioning pitch"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="client">Client</Label>
              <Input
                id="client"
                value={client}
                onChange={(e) => setClient(e.target.value)}
                placeholder="Northwind Financial"
              />
            </div>
          </div>

          <Button type="submit" size="lg" disabled={busy}>
            {busy ? "Creating…" : "Continue"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
