export type Slide = {
  id: string;
  deck_id: string;
  workspace_id: string;
  position: number;
  title: string;
  subtitle: string | null;
  bullets: string[];
  speaker_notes: string | null;
  layout: string;
};

export type Deck = {
  id: string;
  workspace_id: string;
  created_by: string;
  title: string;
  client_name: string | null;
  project_brief: string | null;
  stage: string;
  outline: { title: string; purpose: string }[];
  google_slides_url: string | null;
  brand: unknown | null;
  created_at: string;
  updated_at: string;
};

export type DeckSource = {
  id: string;
  deck_id: string;
  workspace_id: string;
  kind: "note" | "file" | string;
  label: string;
  relevance: "content" | "template" | "both" | string;
  why_relevant: string | null;
  extracted_text: string | null;
  file_path: string | null;
  brand: unknown | null;
  created_at: string;
};

export const RELEVANCE_LABELS: Record<string, string> = {
  content: "Content",
  template: "Template / structure",
  both: "Content + template",
};
