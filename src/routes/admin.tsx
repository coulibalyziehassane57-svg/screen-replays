import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { fetchSports, LEVELS } from "@/lib/refmaster";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Administration du contenu — REFMASTER" },
      { name: "description", content: "Espace réservé aux administrateurs : ajout de leçons et de situations d'arbitrage." },
      { property: "og:title", content: "Administration du contenu — REFMASTER" },
      { property: "og:description", content: "Gestion des leçons, questions et scénarios." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const sports = useQuery({ queryKey: ["sports"], queryFn: fetchSports });

  const isAdmin = useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("has_role", { _user_id: user!.id, _role: "admin" });
      if (error) throw error;
      return !!data;
    },
    enabled: !!user,
  });

  const [sportId, setSportId] = useState<string | undefined>();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [level, setLevel] = useState("debutant");

  if (!user || isAdmin.isLoading) {
    return (
      <AppShell>
        <p className="text-muted-foreground">Vérification de vos droits…</p>
      </AppShell>
    );
  }

  if (!isAdmin.data) {
    return (
      <AppShell>
        <h1 className="text-2xl font-bold">Accès réservé</h1>
        <p className="mt-2 text-muted-foreground">Cet espace est réservé aux administrateurs de contenu.</p>
      </AppShell>
    );
  }

  async function createLesson() {
    if (!sportId || !title || !content) {
      toast.error("Sport, titre et contenu sont obligatoires");
      return;
    }
    const { count } = await supabase
      .from("lessons")
      .select("id", { count: "exact", head: true })
      .eq("sport_id", sportId);
    const { error } = await supabase.from("lessons").insert({
      sport_id: sportId,
      position: (count ?? 0) + 1,
      title,
      summary: summary || null,
      content,
      level,
    });
    if (error) toast.error("Création impossible");
    else {
      toast.success("Leçon créée. Ajoutez-lui 10 questions pour l'activer.");
      setTitle("");
      setSummary("");
      setContent("");
      queryClient.invalidateQueries({ queryKey: ["lessons"] });
    }
  }

  return (
    <AppShell>
      <h1 className="text-3xl font-bold">Administration</h1>
      <p className="mt-1 text-muted-foreground">
        Ajoutez du contenu pédagogique. Chaque leçon doit disposer de 10 questions validées avant publication.
      </p>

      <Card className="mt-6">
        <CardContent className="space-y-4 p-5">
          <h2 className="font-display text-lg font-bold">Nouvelle leçon</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Sport</Label>
              <Select value={sportId ?? ""} onValueChange={setSportId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir" />
                </SelectTrigger>
                <SelectContent>
                  {(sports.data ?? []).map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.emoji} {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Niveau</Label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEVELS.map((l) => (
                    <SelectItem key={l.value} value={l.value}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="t">Titre</Label>
            <Input id="t" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="s">Résumé</Label>
            <Input id="s" value={summary} onChange={(e) => setSummary(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="c">Contenu de la leçon</Label>
            <Textarea id="c" rows={8} value={content} onChange={(e) => setContent(e.target.value)} />
          </div>
          <Button onClick={createLesson}>Créer la leçon</Button>
        </CardContent>
      </Card>
    </AppShell>
  );
}
