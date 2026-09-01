import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { fetchProfile, fetchSports, levelFromXp, xpProgressInLevel, LEVELS, SKILLS } from "@/lib/refmaster";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/profil")({
  head: () => ({
    meta: [
      { title: "Mon profil d'arbitre — REFMASTER" },
      { name: "description", content: "Votre progression, vos badges, vos compétences et l'historique de vos entraînements." },
      { property: "og:title", content: "Mon profil d'arbitre — REFMASTER" },
      { property: "og:description", content: "XP, badges, compétences fortes et faibles, historique." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [level, setLevel] = useState("debutant");
  const [hidden, setHidden] = useState(false);

  const profile = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => fetchProfile(user!.id),
    enabled: !!user,
  });
  const sports = useQuery({ queryKey: ["sports"], queryFn: fetchSports });

  const mySports = useQuery({
    queryKey: ["user-sports", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("user_sports").select("sport_id").eq("user_id", user!.id);
      return (data ?? []).map((r) => r.sport_id);
    },
    enabled: !!user,
  });

  const badges = useQuery({
    queryKey: ["user-badges", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("user_badges").select("earned_at, badges(name, emoji, description)").eq("user_id", user!.id);
      return data ?? [];
    },
    enabled: !!user,
  });

  const history = useQuery({
    queryKey: ["history", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("quiz_attempts")
        .select("id, score, total, passed, created_at, lessons(title)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(20);
      return data ?? [];
    },
    enabled: !!user,
  });

  const skills = useQuery({
    queryKey: ["skills", user?.id],
    queryFn: async () => {
      const { data: attempts } = await supabase
        .from("scenario_attempts")
        .select("correct")
        .eq("user_id", user!.id);
      const { data: quizzes } = await supabase.from("quiz_attempts").select("score, total").eq("user_id", user!.id);
      const rulesTotal = (quizzes ?? []).reduce((s, q) => s + q.total, 0);
      const rulesScore = (quizzes ?? []).reduce((s, q) => s + q.score, 0);
      const decisionTotal = (attempts ?? []).length;
      const decisionScore = (attempts ?? []).filter((a) => a.correct).length;
      return {
        regles: rulesTotal ? Math.round((rulesScore / rulesTotal) * 100) : 0,
        decision: decisionTotal ? Math.round((decisionScore / decisionTotal) * 100) : 0,
      };
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (profile.data) {
      setName(profile.data.display_name);
      setCountry(profile.data.country ?? "");
      setLevel(profile.data.level);
      setHidden(profile.data.hidden_from_leaderboard);
    }
  }, [profile.data]);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  if (!user) {
    return (
      <AppShell>
        <p className="text-muted-foreground">
          <Link to="/auth" className="font-semibold text-primary">
            Connectez-vous
          </Link>{" "}
          pour accéder à votre profil.
        </p>
      </AppShell>
    );
  }

  async function save() {
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: name, country: country || null, level, hidden_from_leaderboard: hidden })
      .eq("id", user!.id);
    if (error) toast.error("Enregistrement impossible");
    else {
      toast.success("Profil mis à jour");
      queryClient.invalidateQueries({ queryKey: ["profile", user!.id] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
    }
  }

  async function toggleSport(sportId: string, active: boolean) {
    if (active) await supabase.from("user_sports").insert({ user_id: user!.id, sport_id: sportId });
    else await supabase.from("user_sports").delete().eq("user_id", user!.id).eq("sport_id", sportId);
    queryClient.invalidateQueries({ queryKey: ["user-sports", user!.id] });
  }

  const xp = profile.data?.xp ?? 0;

  return (
    <AppShell>
      <h1 className="text-3xl font-bold">Profil</h1>

      <Card className="mt-4">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-display text-2xl font-bold">{profile.data?.display_name}</p>
              <p className="text-sm text-muted-foreground">
                Niveau {levelFromXp(xp)} · {xp} XP · série {profile.data?.streak_days ?? 0} jours
              </p>
            </div>
            <Button variant="secondary" onClick={() => signOut().then(() => navigate({ to: "/auth" }))}>
              Déconnexion
            </Button>
          </div>
          <Progress value={xpProgressInLevel(xp)} className="mt-4 h-2" />
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardContent className="space-y-4 p-5">
          <h2 className="font-display text-lg font-bold">Mes informations</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dn">Nom affiché</Label>
              <Input id="dn" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ct">Pays</Label>
              <Input id="ct" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="France" />
            </div>
            <div className="space-y-2">
              <Label>Niveau d'arbitrage</Label>
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
            <div className="flex items-center justify-between rounded-xl border border-border p-3">
              <div>
                <p className="text-sm font-semibold">Masquer mon profil</p>
                <p className="text-xs text-muted-foreground">Ne plus apparaître au classement</p>
              </div>
              <Switch checked={hidden} onCheckedChange={setHidden} />
            </div>
          </div>
          <Button onClick={save}>Enregistrer</Button>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardContent className="p-5">
          <h2 className="font-display text-lg font-bold">Mes sports</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {(sports.data ?? []).map((s) => {
              const active = (mySports.data ?? []).includes(s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => toggleSport(s.id, !active)}
                  className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                    active ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground"
                  }`}
                >
                  {s.emoji} {s.name}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardContent className="p-5">
          <h2 className="font-display text-lg font-bold">Compétences</h2>
          <div className="mt-3 space-y-3">
            <SkillBar label={SKILLS["regles"] ?? "Règles"} value={skills.data?.regles ?? 0} />
            <SkillBar label={SKILLS["decision"] ?? "Décision"} value={skills.data?.decision ?? 0} />
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardContent className="p-5">
          <h2 className="font-display text-lg font-bold">Badges</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {(badges.data ?? []).length === 0 && <p className="text-sm text-muted-foreground">Aucun badge pour l'instant.</p>}
            {(badges.data ?? []).map((b, i) => (
              <Badge key={i} variant="secondary" className="text-sm">
                {(b.badges as { emoji: string; name: string } | null)?.emoji}{" "}
                {(b.badges as { emoji: string; name: string } | null)?.name}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardContent className="p-5">
          <h2 className="font-display text-lg font-bold">Historique des entraînements</h2>
          <ul className="mt-3 space-y-2">
            {(history.data ?? []).length === 0 && <p className="text-sm text-muted-foreground">Aucun quiz enregistré.</p>}
            {(history.data ?? []).map((h) => (
              <li key={h.id} className="flex items-center justify-between rounded-xl border border-border p-3 text-sm">
                <span className="truncate">{(h.lessons as { title: string } | null)?.title ?? "Leçon"}</span>
                <span className={h.passed ? "text-success" : "text-destructive"}>
                  {h.score}/{h.total}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        <Link to="/admin" className="underline">
          Espace administrateur
        </Link>
      </p>
    </AppShell>
  );
}

function SkillBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="text-muted-foreground">{value} %</span>
      </div>
      <Progress value={value} className="mt-1 h-2" />
    </div>
  );
}
