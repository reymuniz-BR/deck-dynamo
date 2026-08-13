# BD Deck Generator

An app that turns your past decks, call notes, and client info into a ready-to-present business development deck — previewed in the browser and exportable to PowerPoint/PDF.

## How it works

1. **Sign in** — accounts so your templates and decks are saved and private to you.
2. **Upload a template deck** — drop in a past .pptx/.pdf deck. The app reads its slide structure (section names, order, typical content per slide) and saves it as a reusable template. You can rename sections, reorder, or delete slides before saving.
3. **Create a deck** — pick a template, then provide inputs:
   - Client/company details (name, industry, contacts, deal context)
   - Pasted notes, call transcripts, research
   - Optional extra reference decks/documents to pull content from
4. **Generate** — AI drafts each slide following the template's structure, using your inputs and the writing style of the uploaded decks.
5. **Review & edit** — in-app slide preview with editable titles, bullets, and speaker notes; regenerate a single slide with a nudge prompt.
6. **Export** — download as .pptx (matching template layout/colors where possible) or PDF.

## Screens

- **Home / deck library** — grid of saved decks with client name, template used, date, status.
- **Templates** — list of uploaded templates, plus upload flow with structure preview.
- **New deck wizard** — template choice, client info form, notes/file upload, generate.
- **Deck editor** — slide list on the left, slide preview + edit panel on the right, regenerate and export buttons.
- **Auth** — sign up / sign in.

## Technical notes

- **Backend:** Lovable Cloud (database, auth, file storage). Tables: `profiles`, `templates`, `template_sections`, `decks`, `slides`, `source_documents`. Row-level security so each user only sees their own data.
- **Uploads:** .pptx/.pdf/.docx/.txt stored in Cloud storage; text and slide structure extracted server-side and saved as structured JSON.
- **Generation:** Lovable AI via a server function. Structured output per slide (title, bullets, notes) so the deck maps cleanly to both the in-app preview and the export. Long generations stream to avoid timeouts.
- **Export:** .pptx built server-side from the deck's structured slides (using template colors/fonts captured at upload); PDF via the same rendering path.
- **Style:** clean, professional consulting-deck aesthetic — restrained palette, strong typography, no generic purple gradients.

## Build order

1. Enable Cloud, auth, schema + RLS.
2. Template upload and structure extraction.
3. New-deck wizard and AI generation.
4. Deck editor with per-slide regeneration.
5. PPTX and PDF export.
