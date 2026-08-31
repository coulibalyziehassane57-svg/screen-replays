import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Flame, Target, Trophy, Zap } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchSports,
  fetchProfile,
  fetchLessonProgress,
  levelFromXp,
  xpProgressInLevel,
  LEVELS,
} from "@/lib/refmaster";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "REFMASTER — Devenez un meilleur arbitre" },
      {
        name: "description",
        content:
          "Apprenez les règles, les gestes et les signaux au sifflet de 14 sports. Leçons progressives, quiz obligatoires et simulateur d'arbitrage.",
      },
      { property: "og:title", content: "REFMASTER — Devenez un meilleur arbitre" },
      {
        property: "og:description",
        content: "Académie d'arbitrage multi-sports avec quiz, gestes & sifflets et simulateur.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { user, loading } = useAuth();
  const sports = useQuery({ queryKey: ["sports"], queryFn: fetchSports });
  const profile = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => fetchProfile(user!.id),
    enabled: !!user,
  });
  const progress = useQuery({
    queryKey: ["lesson-progress", user?.id],
    queryFn: () => fetchLessonProgress(user!.id),
    enabled: !!user,
  });
  const attempts = useQuery({
    queryKey: ["scenario-attempts", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("scenario_attempts").select("correct, decision_ms").eq("user_id", user!.id);
      return data ?? [];
    },
    enabled: !!user,
  });

  const xp = profile.data?.xp ?? 0;
  const validated = (progress.data ?? []).filter((p) => p.completed).length;
  const decisions = attempts.data ?? [];
  const successRate = decisions.length
    ? Math.round((decisions.filter((d) => d.correct).length / decisions.length) * 100)
    : 0;
  const avgTime = decisions.length
    ? Math.round(decisions.reduce((sum, d) => sum + d.decision_ms, 0) / decisions.length / 100) / 10
    : 0;

  return (
    <AppShell>
      {!user && !loading && (
        <section className="surface mb-8 overflow-hidden p-6 md:p-10">
          <Badge variant="secondary" className="mb-4">14 sports · règles officielles référencées</Badge>
          <h1 className="max-w-2xl text-4xl font-bold leading-none md:text-6xl">
            Apprenez l'arbitrage <span className="text-gradient">comme sur le terrain</span>
          </h1>
          <p className="mt-4 max-w-xl text-muted-foreground">
            Leçons progressives, quiz obligatoire de 10 questions, bibliothèque de gestes et signaux au sifflet,
            et simulateur de décisions chronométré.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/auth">Commencer gratuitement</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link to="/academie">Découvrir l'académie</Link>
            </Button>
          </div>
        </section>
      )}

      {user && (
        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={<Zap className="h-4 w-4" />} label="XP total" value={`${xp}`} sub={`Niveau ${levelFromXp(xp)}`}>
            <Progress value={xpProgressInLevel(xp)} className="mt-3 h-2" />
          </StatCard>
          <StatCard icon={<Trophy className="h-4 w-4" />} label="Leçons validées" value={`${validated}`} sub="Académie" />
          <StatCard icon={<Target className="h-4 w-4" />} label="Taux de réussite" value={`${successRate}%`} sub="Simulateur" />
          <StatCard icon={<Flame className="h-4 w-4" />} label="Série" value={`${profile.data?.streak_days ?? 0} j`} sub={`Décision moy. ${avgTime}s`} />
        </section>
      )}

      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-2xl font-bold">Choisir un sport</h2>
          <Link to="/academie" className="text-sm font-semibold text-primary">
            Tout voir
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(sports.data ?? []).slice(0, 6).map((sport) => (
            <Link key={sport.id} to="/academie/$sport" params={{ sport: sport.slug }}>
              <Card className="h-full transition-colors hover:border-primary">
                <CardContent className="flex items-center gap-4 p-5">
                  <span className="text-3xl">{sport.emoji}</span>
                  <div>
                    <p className="font-display text-lg font-bold">{sport.name}</p>
                    <p className="text-xs text-muted-foreground">{sport.federation}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-8 grid gap-3 sm:grid-cols-3">
        <QuickLink to="/academie" title="Académie" text="Leçons + quiz obligatoire" />
        <QuickLink to="/simulateur" title="Simulateur" text="Situations chronométrées" />
        <QuickLink to="/gestes" title="Gestes & sifflets" text="Bibliothèque officielle" />
      </section>

      {!user && (
        <p className="mt-8 text-center text-xs text-muted-foreground">
          Niveaux disponibles : {LEVELS.map((l) => l.label).join(" · ")}
        </p>
      )}
    </AppShell>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  children?: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-xs font-semibold tracking-wide text-muted-foreground">
          {icon}
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="font-display text-3xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
        {children}
      </CardContent>
    </Card>
  );
}

function QuickLink({ to, title, text }: { to: string; title: string; text: string }) {
  return (
    <Link to={to}>
      <Card className="h-full transition-colors hover:border-primary">
        <CardContent className="p-5">
          <p className="font-display text-lg font-bold">{title}</p>
          <p className="text-sm text-muted-foreground">{text}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
