# BD Deck Generator

An app that walks you through a short guided conversation about your project, your notes, and your past decks — then generates a business development deck you can review, edit, and export to Google Slides, PowerPoint, or PDF.

## How it works

A guided, step-by-step flow (one prompt per screen, with progress saved as you go):

1. **Sign in** — accounts so your work is saved and private to your team.
2. **"Tell me about your project"** — free-text description of the client, the opportunity, and the goal of the deck.
3. **"Share any relevant notes, templates, or materials"** — upload files (.pptx, .pdf, .docx, .txt) and/or paste call notes, transcripts, and research.
4. **"Share any previous decks that feel similar or relevant — and why"** — upload past decks, and for each one note whether it's relevant for its *content*, its *template/structure*, or both, plus a short explanation. The app uses this to pick structure vs. source material correctly.
5. **Create deck** — the app proposes a slide outline (derived from the template deck's structure) for you to confirm, reorder, or adjust before writing.
6. **Generate** — AI drafts each slide from your inputs, following the chosen structure and matching the tone of your past decks.
7. **Review & edit** — in-app slide preview with editable titles, bullets, and speaker notes; regenerate any single slide with a nudge prompt.
8. **Export** — push to **Google Slides** for collaborative editing, or download .pptx / PDF.

## Collaboration

- Decks live in a shared team workspace: anyone invited can open, edit, and comment on a deck.
- Edits save immediately so multiple people can work in parallel without overwriting each other.
- Google Slides export creates a real Slides file in your Drive that the team can co-edit; the app keeps a link back to it from the deck.

## Screens

- **Home / deck library** — decks with client name, stage, owner, last edited.
- **Guided intake flow** — the four prompt steps above, one per screen, resumable.
- **Outline confirmation** — proposed slide list, editable.
- **Deck editor** — slide list on the left, preview + edit panel on the right, regenerate and export.
- **Sources** — files and notes attached to a deck, with the "why relevant" labels.
- **Team & auth** — sign up / sign in, invite teammates.

## Technical notes

- **Backend:** Lovable Cloud (database, auth, file storage). Tables: `profiles`, `workspaces`, `workspace_members`, `decks`, `deck_sources`, `slides`, `templates`. Row-level security scoped to workspace membership.
- **Uploads:** stored in Cloud storage; text and slide structure extracted server-side into structured JSON, with each source tagged as content-relevant, template-relevant, or both.
- **Generation:** Lovable AI via a server function with structured per-slide output (title, bullets, notes). Streamed so long generations don't time out.
- **Google Slides export:** Google OAuth connection per user (Drive/Slides scope); the app creates a presentation from the deck's structured slides. You'll authorize Google once from the export screen.
- **PPTX/PDF export:** built server-side from the same structured slides, using colors/fonts captured from the template deck.
- **Style:** clean, professional consulting-deck aesthetic — restrained palette, strong typography, no generic gradients.


## Build order

1. Enable Cloud, auth, workspace schema + RLS.
2. Guided intake flow with file/note uploads and source tagging.
3. Outline proposal + AI slide generation.
4. Deck editor with per-slide regeneration and shared editing.
5. Google Slides export, then PPTX/PDF.
