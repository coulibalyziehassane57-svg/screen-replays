import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Lock, PlayCircle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { fetchLessons, fetchLessonProgress, fetchSportBySlug, LEVELS } from "@/lib/refmaster";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/academie/$sport")({
  head: ({ params }) => ({
    meta: [
      { title: `Arbitrage ${params.sport} — REFMASTER` },
      { name: "description", content: `Parcours de leçons d'arbitrage pour le ${params.sport}, validées par quiz.` },
      { property: "og:title", content: `Arbitrage ${params.sport} — REFMASTER` },
      { property: "og:description", content: `Leçons progressives et quiz d'arbitrage : ${params.sport}.` },
    ],
  }),
  component: SportPage,
});

function SportPage() {
  const { sport: slug } = Route.useParams();
  const { user } = useAuth();

  const sport = useQuery({
    queryKey: ["sport", slug],
    queryFn: async () => {
      const found = await fetchSportBySlug(slug);
      if (!found) throw notFound();
      return found;
    },
  });

  const lessons = useQuery({
    queryKey: ["lessons", sport.data?.id],
    queryFn: () => fetchLessons(sport.data!.id),
    enabled: !!sport.data,
  });

  const progress = useQuery({
    queryKey: ["lesson-progress", user?.id],
    queryFn: () => fetchLessonProgress(user!.id),
    enabled: !!user,
  });

  const progressMap = new Map((progress.data ?? []).map((p) => [p.lesson_id, p]));
  const list = lessons.data ?? [];
  const done = list.filter((l) => progressMap.get(l.id)?.completed).length;
  const pct = list.length ? Math.round((done / list.length) * 100) : 0;

  return (
    <AppShell>
      <div className="flex items-center gap-3">
        <span className="text-4xl">{sport.data?.emoji}</span>
        <div>
          <h1 className="text-3xl font-bold">{sport.data?.name}</h1>
          <p className="text-xs text-muted-foreground">
            {sport.data?.federation} · {sport.data?.ruleset_version}
          </p>
        </div>
      </div>

      <div className="surface mt-5 p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold">Progression du parcours</span>
          <span className="text-muted-foreground">
            {done}/{list.length} leçons
          </span>
        </div>
        <Progress value={pct} className="mt-3 h-2" />
      </div>

      <div className="mt-6 space-y-3">
        {list.length === 0 && (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              Le contenu de ce sport est en préparation. L'architecture permet à un administrateur d'ajouter
              leçons, questions, gestes et situations sans modifier le code.
            </CardContent>
          </Card>
        )}

        {list.map((lesson, index) => {
          const state = progressMap.get(lesson.id);
          const previous = index === 0 ? null : list[index - 1];
          const unlocked = index === 0 || !!progressMap.get(previous!.id)?.completed;
          const levelLabel = LEVELS.find((l) => l.value === lesson.level)?.label ?? lesson.level;

          return (
            <Card key={lesson.id} className={unlocked ? "" : "opacity-60"}>
              <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">Leçon {lesson.position}</Badge>
                    <Badge variant="outline">{levelLabel}</Badge>
                    {state?.completed && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-success">
                        <CheckCircle2 className="h-3.5 w-3.5" /> validée · {state.best_score}/10
                      </span>
                    )}
                  </div>
                  <p className="mt-2 font-display text-xl font-bold">{lesson.title}</p>
                  <p className="text-sm text-muted-foreground">{lesson.summary}</p>
                </div>
                {unlocked ? (
                  <Button asChild>
                    <Link to="/lecon/$lessonId" params={{ lessonId: lesson.id }}>
                      <PlayCircle className="mr-2 h-4 w-4" />
                      {state?.completed ? "Revoir" : "Commencer"}
                    </Link>
                  </Button>
                ) : (
                  <Button variant="secondary" disabled>
                    <Lock className="mr-2 h-4 w-4" /> Verrouillée
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!user && list.length > 0 && (
        <p className="mt-6 text-sm text-muted-foreground">
          <Link to="/auth" className="font-semibold text-primary">
            Connectez-vous
          </Link>{" "}
          pour enregistrer vos quiz et débloquer les leçons suivantes.
        </p>
      )}
    </AppShell>
  );
}
