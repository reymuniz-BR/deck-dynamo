import { useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, Paperclip, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { addSource, setDeckBrand, uploadSourceFile } from "@/lib/deck-queries";
import { extractBrandFromPptx } from "@/lib/extract-brand";
import { ACCEPTED_FILE_TYPES, extractFileText } from "@/lib/extract-text";
import { RELEVANCE_LABELS, type DeckSource } from "@/lib/deck-types";

type Props = {
  deckId: string;
  workspaceId: string;
  userId: string;
  fileKind: "file" | "reference";
  requireWhy: boolean;
  allowNotes: boolean;
  sources: DeckSource[];
  onChanged: () => void;
};

export function SourceCollector({
  deckId,
  workspaceId,
  userId,
  fileKind,
  requireWhy,
  allowNotes,
  sources,
  onChanged,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [note, setNote] = useState("");
  const [noteLabel, setNoteLabel] = useState("");
  const [relevance, setRelevance] = useState(fileKind === "reference" ? "both" : "content");
  const [why, setWhy] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    if (requireWhy && why.trim().length < 5) {
      toast.error("Say why this deck is relevant before attaching it.");
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    setBusy(true);
    try {
      for (const file of Array.from(files)) {
        const isPptx = file.name.toLowerCase().endsWith(".pptx");
        const [path, text, brand] = await Promise.all([
          uploadSourceFile(workspaceId, deckId, file),
          extractFileText(file),
          isPptx ? extractBrandFromPptx(file) : Promise.resolve(null),
        ]);
        if (brand && relevance !== "content") {
          await setDeckBrand(deckId, brand);
          toast.success(`Branding picked up from ${file.name}`);
        }
        await addSource({
          brand,
          deckId,
          workspaceId,
          userId,
          kind: fileKind,
          label: file.name,
          relevance,
          whyRelevant: why.trim() || undefined,
          extractedText: text,
          filePath: path,
        });
        if (!text) {
          toast.warning(`No readable text found in ${file.name} — it was still attached.`);
        }
      }
      setWhy("");
      onChanged();
      toast.success("Added");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function addNote() {
    if (note.trim().length < 5) {
      toast.error("Add a little more text to the note.");
      return;
    }
    setBusy(true);
    try {
      await addSource({
        deckId,
        workspaceId,
        userId,
        kind: "note",
        label: noteLabel.trim() || "Pasted note",
        relevance,
        extractedText: note.trim(),
      });
      setNote("");
      setNoteLabel("");
      onChanged();
      toast.success("Note added");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the note");
    } finally {
      setBusy(false);
    }
  }

  async function remove(source: DeckSource) {
    if (source.file_path) {
      await supabase.storage.from("deck-sources").remove([source.file_path]);
    }
    await supabase.from("deck_sources").delete().eq("id", source.id);
    onChanged();
  }

  return (
    <div className="space-y-8">
      <div className="border border-border bg-card p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Use this for</Label>
            <Select value={relevance} onValueChange={setRelevance}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="content">Content — facts and story</SelectItem>
                <SelectItem value="template">Template — structure and tone</SelectItem>
                <SelectItem value="both">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {requireWhy ? (
            <div className="space-y-1.5">
              <Label htmlFor="why">Why is it relevant?</Label>
              <Input
                id="why"
                value={why}
                onChange={(e) => setWhy(e.target.value)}
                placeholder="Same sector, and the structure landed well"
              />
            </div>
          ) : null}
        </div>

        <input
          ref={fileRef}
          type="file"
          multiple
          accept={ACCEPTED_FILE_TYPES}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <Button
          type="button"
          variant="outline"
          className="mt-4"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
        >
          {busy ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Paperclip className="mr-2 h-4 w-4" />
          )}
          Attach files
        </Button>
        <p className="mt-2 text-xs text-muted-foreground">
          PowerPoint, PDF, Word, text or CSV. Text is read in your browser before upload.
        </p>

        {allowNotes ? (
          <div className="mt-6 space-y-3 border-t border-border pt-5">
            <div className="space-y-1.5">
              <Label htmlFor="noteLabel">Or paste a note</Label>
              <Input
                id="noteLabel"
                value={noteLabel}
                onChange={(e) => setNoteLabel(e.target.value)}
                placeholder="Label (e.g. Discovery call notes)"
              />
            </div>
            <Textarea
              rows={5}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Paste raw notes, positioning language, pricing constraints…"
            />
            <Button type="button" variant="secondary" onClick={addNote} disabled={busy}>
              <Plus className="mr-2 h-4 w-4" />
              Add note
            </Button>
          </div>
        ) : null}
      </div>

      {sources.length ? (
        <ul className="divide-y divide-border border border-border">
          {sources.map((source) => (
            <li key={source.id} className="flex items-start gap-4 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{source.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {RELEVANCE_LABELS[source.relevance] ?? source.relevance}
                  {source.extracted_text
                    ? ` · ${source.extracted_text.length.toLocaleString()} characters read`
                    : " · no text read"}
                </p>
                {source.why_relevant ? (
                  <p className="mt-1 text-xs italic text-muted-foreground">
                    “{source.why_relevant}”
                  </p>
                ) : null}
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => remove(source)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
