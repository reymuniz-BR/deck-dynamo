import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listDecks from "./tools/list-decks";
import getDeck from "./tools/get-deck";
import createDeck from "./tools/create-deck";
import addDeckNote from "./tools/add-deck-note";
import updateSlide from "./tools/update-slide";

// The OAuth issuer must be the direct Supabase host; the project ref is the only
// value that survives publish unchanged.
const projectRef = import.meta.env["VITE_SUPABASE_PROJECT_ID"] ?? "project-ref-unset";

export default defineMcp({
  name: "deck-dynamo",
  title: "Deck Dynamo",
  version: "0.1.0",
  instructions:
    "Tools for Deck Studio, a business development deck generator. Use `list_decks` and `get_deck` to read a user's decks, `create_deck` to start one, `add_deck_note` to attach source material, and `update_slide` to edit slide copy. Never invent metrics, client names or quotes — leave a visible [PLACEHOLDER] instead. Full deck generation and export happen in the app.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listDecks, getDeck, createDeck, addDeckNote, updateSlide],
});
