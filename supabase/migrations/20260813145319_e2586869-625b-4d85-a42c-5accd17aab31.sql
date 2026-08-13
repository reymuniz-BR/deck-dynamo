CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'My workspace',
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspaces TO authenticated;
GRANT ALL ON public.workspaces TO service_role;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.workspace_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_members TO authenticated;
GRANT ALL ON public.workspace_members TO service_role;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_workspace_member(_workspace_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = _workspace_id AND user_id = _user_id
  )
$$;

CREATE TABLE public.decks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces ON DELETE CASCADE,
  created_by uuid NOT NULL,
  title text NOT NULL DEFAULT 'Untitled deck',
  client_name text,
  project_brief text,
  stage text NOT NULL DEFAULT 'intake',
  outline jsonb NOT NULL DEFAULT '[]'::jsonb,
  google_slides_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.decks TO authenticated;
GRANT ALL ON public.decks TO service_role;
ALTER TABLE public.decks ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.deck_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id uuid NOT NULL REFERENCES public.decks ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES public.workspaces ON DELETE CASCADE,
  created_by uuid NOT NULL,
  kind text NOT NULL DEFAULT 'note',
  label text NOT NULL DEFAULT 'Untitled source',
  relevance text NOT NULL DEFAULT 'content',
  why_relevant text,
  extracted_text text,
  file_path text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.deck_sources TO authenticated;
GRANT ALL ON public.deck_sources TO service_role;
ALTER TABLE public.deck_sources ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.slides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id uuid NOT NULL REFERENCES public.decks ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES public.workspaces ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  title text NOT NULL DEFAULT '',
  subtitle text,
  bullets jsonb NOT NULL DEFAULT '[]'::jsonb,
  speaker_notes text,
  layout text NOT NULL DEFAULT 'bullets',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.slides TO authenticated;
GRANT ALL ON public.slides TO service_role;
ALTER TABLE public.slides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "member workspaces read" ON public.workspaces FOR SELECT TO authenticated USING (public.is_workspace_member(id, auth.uid()));
CREATE POLICY "create workspace" ON public.workspaces FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "member workspaces update" ON public.workspaces FOR UPDATE TO authenticated USING (public.is_workspace_member(id, auth.uid())) WITH CHECK (public.is_workspace_member(id, auth.uid()));

CREATE POLICY "read memberships" ON public.workspace_members FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "add members" ON public.workspace_members FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "remove members" ON public.workspace_members FOR DELETE TO authenticated USING (public.is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "decks all" ON public.decks FOR ALL TO authenticated USING (public.is_workspace_member(workspace_id, auth.uid())) WITH CHECK (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "deck sources all" ON public.deck_sources FOR ALL TO authenticated USING (public.is_workspace_member(workspace_id, auth.uid())) WITH CHECK (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "slides all" ON public.slides FOR ALL TO authenticated USING (public.is_workspace_member(workspace_id, auth.uid())) WITH CHECK (public.is_workspace_member(workspace_id, auth.uid()));

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER decks_updated_at BEFORE UPDATE ON public.decks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER slides_updated_at BEFORE UPDATE ON public.slides FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE ws_id uuid;
DECLARE base_name text;
BEGIN
  base_name := COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', split_part(COALESCE(NEW.email, 'there'), '@', 1));

  INSERT INTO public.profiles (id, display_name) VALUES (NEW.id, base_name);

  INSERT INTO public.workspaces (name, created_by)
  VALUES (base_name || '''s workspace', NEW.id)
  RETURNING id INTO ws_id;

  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (ws_id, NEW.id, 'owner');

  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE POLICY "members read deck files" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'deck-sources' AND public.is_workspace_member((storage.foldername(name))[1]::uuid, auth.uid()));
CREATE POLICY "members upload deck files" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'deck-sources' AND public.is_workspace_member((storage.foldername(name))[1]::uuid, auth.uid()));
CREATE POLICY "members delete deck files" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'deck-sources' AND public.is_workspace_member((storage.foldername(name))[1]::uuid, auth.uid()));