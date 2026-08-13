import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="no-print sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/decks" className="flex items-center gap-2.5">
            <span className="h-5 w-1.5 rounded-full bg-accent" />
            <span className="text-display text-xl">Deck Studio</span>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/auth" });
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}

export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
      <div>
        {eyebrow ? <p className="label-caps text-accent">{eyebrow}</p> : null}
        <h1 className="mt-1.5 text-4xl">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
