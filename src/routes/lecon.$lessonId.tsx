import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  addXp,
  fetchLesson,
  fetchLessons,
  fetchQuestions,
  fetchSetting,
  grantBadge,
  shuffle,
  type Question,
} from "@/lib/refmaster";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CoachPanel } from "@/components/CoachPanel";

export const Route = createFileRoute("/lecon/$lessonId")({
  head: () => ({
    meta: [
      { title: "Leçon d'arbitrage — REFMASTER" },
      { name: "description", content: "Étudiez la règle, les exemples et les situations, puis validez le quiz obligatoire." },
      { property: "og:title", content: "Leçon d'arbitrage — REFMASTER" },
      { property: "og:description", content: "Leçon + quiz obligatoire de 10 questions pour débloquer la suite." },
    ],
  }),
  component: LessonPage,
});

type Phase = "lesson" | "quiz" | "result";

function LessonPage() {
  const { lessonId } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const lesson = useQuery({ queryKey: ["lesson", lessonId], queryFn: () => fetchLesson(lessonId) });
  const questions = useQuery({ queryKey: ["questions", lessonId], queryFn: () => fetchQuestions(lessonId) });
  const threshold = useQuery({ queryKey: ["threshold"], queryFn: () => fetchSetting("quiz_pass_threshold", 8) });
  const quizLength = useQuery({ queryKey: ["quiz-length"], queryFn: () => fetchSetting("quiz_length", 10) });
  const lastAttempt = useQuery({
    queryKey: ["last-attempt", lessonId, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("quiz_attempts")
        .select("wrong_question_ids")
        .eq("lesson_id", lessonId)
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return (data?.wrong_question_ids as string[] | undefined) ?? [];
    },
    enabled: !!user,
  });

  const [phase, setPhase] = useState<Phase>("lesson");
  const [round, setRound] = useState(0);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<{ question: Question; picked: number }[]>([]);
  const [focusErrors, setFocusErrors] = useState(false);

  const total = quizLength.data ?? 10;
  const pass = threshold.data ?? 8;

  const quiz = useMemo(() => {
    const pool = questions.data ?? [];
    if (pool.length === 0) return [];
    const wrongIds = new Set(lastAttempt.data ?? []);
    const priority = pool.filter((q) => wrongIds.has(q.id));
    const rest = shuffle(pool.filter((q) => !wrongIds.has(q.id)));
    const ordered = focusErrors ? [...shuffle(priority), ...rest] : [...shuffle(priority), ...rest];
    const picked = ordered.slice(0, Math.min(total, pool.length));
    return shuffle(picked);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions.data, lastAttempt.data, total, round, focusErrors]);

  const score = answers.filter((a) => a.picked === a.question.correct_index).length;
  const passed = score >= pass;

  async function finish(finalAnswers: { question: Question; picked: number }[]) {
    const finalScore = finalAnswers.filter((a) => a.picked === a.question.correct_index).length;
    const isPassed = finalScore >= pass;
    setPhase("result");
    if (!user) return;

    const wrong = finalAnswers.filter((a) => a.picked !== a.question.correct_index).map((a) => a.question.id);
    await supabase.from("quiz_attempts").insert({
      user_id: user.id,
      lesson_id: lessonId,
      score: finalScore,
      total: finalAnswers.length,
      passed: isPassed,
      wrong_question_ids: wrong,
    });

    const { data: existing } = await supabase
      .from("lesson_progress")
      .select("best_score, attempts, completed")
      .eq("user_id", user.id)
      .eq("lesson_id", lessonId)
      .maybeSingle();

    await supabase.from("lesson_progress").upsert(
      {
        user_id: user.id,
        lesson_id: lessonId,
        completed: isPassed || !!existing?.completed,
        best_score: Math.max(finalScore, existing?.best_score ?? 0),
        attempts: (existing?.attempts ?? 0) + 1,
      },
      { onConflict: "user_id,lesson_id" },
    );

    if (isPassed && !existing?.completed) {
      await addXp(user.id, lesson.data?.xp_reward ?? 50);
      await grantBadge(user.id, "first_lesson");
      if (finalScore === finalAnswers.length) await grantBadge(user.id, "perfect_quiz");
      const { count } = await supabase
        .from("lesson_progress")
        .select("lesson_id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("completed", true);
      if ((count ?? 0) >= 5) await grantBadge(user.id, "five_lessons");
      toast.success(`Leçon validée · +${lesson.data?.xp_reward ?? 50} XP`);
    }

    queryClient.invalidateQueries({ queryKey: ["lesson-progress", user.id] });
    queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
    queryClient.invalidateQueries({ queryKey: ["last-attempt", lessonId, user.id] });
  }

  function restart(focus: boolean) {
    setFocusErrors(focus);
    setRound((r) => r + 1);
    setAnswers([]);
    setIndex(0);
    setSelected(null);
    setPhase("quiz");
  }

  if (!lesson.data) {
    return (
      <AppShell>
        <p className="text-muted-foreground">Chargement de la leçon…</p>
      </AppShell>
    );
  }

  const examples = (lesson.data.examples ?? []) as string[];
  const situations = (lesson.data.situations ?? []) as string[];

  return (
    <AppShell>
      <button onClick={() => navigate({ to: "/academie" })} className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Retour à l'académie
      </button>

      {phase === "lesson" && (
        <article className="space-y-5">
          <div>
            <Badge variant="secondary">Leçon {lesson.data.position}</Badge>
            <h1 className="mt-3 text-3xl font-bold">{lesson.data.title}</h1>
            <p className="text-xs text-muted-foreground">
              Source : {lesson.data.federation} · {lesson.data.ruleset_version}
            </p>
          </div>

          <Card>
            <CardContent className="prose-invert p-5">
              {lesson.data.content.split("\n").map((line, i) => {
                if (line.startsWith("# "))
                  return (
                    <h2 key={i} className="mt-4 mb-2 font-display text-xl font-bold text-primary">
                      {line.slice(2)}
                    </h2>
                  );
                if (line.startsWith("- "))
                  return (
                    <p key={i} className="ml-4 text-sm text-muted-foreground">
                      • {line.slice(2).replace(/\*\*/g, "")}
                    </p>
                  );
                if (!line.trim()) return <div key={i} className="h-2" />;
                return (
                  <p key={i} className="text-sm leading-relaxed">
                    {line.replace(/\*\*/g, "")}
                  </p>
                );
              })}
            </CardContent>
          </Card>

          {examples.length > 0 && (
            <Card>
              <CardContent className="p-5">
                <h3 className="font-display text-lg font-bold">Exemples</h3>
                <ul className="mt-2 space-y-2">
                  {examples.map((ex, i) => (
                    <li key={i} className="text-sm text-muted-foreground">
                      • {ex}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {situations.length > 0 && (
            <Card>
              <CardContent className="p-5">
                <h3 className="font-display text-lg font-bold">Situations d'arbitrage</h3>
                <ul className="mt-2 space-y-2">
                  {situations.map((ex, i) => (
                    <li key={i} className="text-sm text-muted-foreground">
                      • {ex}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <div className="surface flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-display text-lg font-bold">Quiz obligatoire</p>
              <p className="text-sm text-muted-foreground">
                {total} questions · {pass}/{total} minimum pour valider et débloquer la leçon suivante.
              </p>
            </div>
            <Button size="lg" onClick={() => restart(false)} disabled={(questions.data ?? []).length === 0}>
              Lancer le quiz
            </Button>
          </div>
        </article>
      )}

      {phase === "quiz" && quiz.length > 0 && (
        <section>
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Question {index + 1} / {quiz.length}
              </span>
              <span>Score {score}</span>
            </div>
            <Progress value={((index + 1) / quiz.length) * 100} className="mt-2 h-2" />
          </div>

          <Card>
            <CardContent className="p-5">
              <p className="font-display text-xl font-bold">{quiz[index].prompt}</p>
              <div className="mt-4 space-y-2">
                {quiz[index].choices.map((choice, i) => {
                  const revealed = selected !== null;
                  const correct = i === quiz[index].correct_index;
                  return (
                    <button
                      key={i}
                      disabled={revealed}
                      onClick={() => setSelected(i)}
                      className={[
                        "w-full rounded-xl border px-4 py-3 text-left text-sm transition-colors",
                        !revealed && "border-border hover:border-primary",
                        revealed && correct && "border-success bg-success/15 text-success",
                        revealed && !correct && selected === i && "border-destructive bg-destructive/15 text-destructive",
                        revealed && !correct && selected !== i && "border-border opacity-60",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {choice}
                    </button>
                  );
                })}
              </div>

              {selected !== null && (
                <div className="mt-4 rounded-xl border border-border bg-secondary/50 p-4 text-sm">
                  <p className="flex items-center gap-2 font-semibold">
                    {selected === quiz[index].correct_index ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-success" /> Bonne réponse
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-destructive" /> Réponse incorrecte
                      </>
                    )}
                  </p>
                  <p className="mt-1 text-muted-foreground">{quiz[index].explanation}</p>
                </div>
              )}

              <Button
                className="mt-4 w-full"
                disabled={selected === null}
                onClick={() => {
                  const updated = [...answers, { question: quiz[index], picked: selected! }];
                  setAnswers(updated);
                  setSelected(null);
                  if (index + 1 >= quiz.length) {
                    finish(updated);
                  } else {
                    setIndex(index + 1);
                  }
                }}
              >
                {index + 1 >= quiz.length ? "Terminer le quiz" : "Question suivante"}
              </Button>
            </CardContent>
          </Card>
        </section>
      )}

      {phase === "result" && (
        <section className="space-y-4">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="font-display text-5xl font-bold">
                {score}/{answers.length}
              </p>
              <p className={`mt-2 font-semibold ${passed ? "text-success" : "text-destructive"}`}>
                {passed ? "Leçon validée !" : `Score insuffisant — ${pass}/${answers.length} requis`}
              </p>
              {!user && <p className="mt-2 text-xs text-muted-foreground">Connectez-vous pour enregistrer ce résultat.</p>}

              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {passed ? (
                  <Button asChild>
                    <Link to="/academie">Continuer le parcours</Link>
                  </Button>
                ) : (
                  <>
                    <Button variant="secondary" onClick={() => setPhase("lesson")}>
                      Revoir la leçon
                    </Button>
                    <Button onClick={() => restart(false)}>Refaire le quiz</Button>
                    <Button variant="secondary" onClick={() => restart(true)}>
                      Entraînement ciblé sur mes erreurs
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {answers.filter((a) => a.picked !== a.question.correct_index).length > 0 && (
            <Card>
              <CardContent className="p-5">
                <h3 className="font-display text-lg font-bold">Analyse des erreurs</h3>
                <ul className="mt-3 space-y-3">
                  {answers
                    .filter((a) => a.picked !== a.question.correct_index)
                    .map((a) => (
                      <li key={a.question.id} className="rounded-xl border border-border p-3">
                        <p className="text-sm font-semibold">{a.question.prompt}</p>
                        <p className="mt-1 text-xs text-destructive">Votre réponse : {a.question.choices[a.picked]}</p>
                        <p className="text-xs text-success">
                          Bonne réponse : {a.question.choices[a.question.correct_index]}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">{a.question.explanation}</p>
                      </li>
                    ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <CoachPanel
            context={`Leçon : ${lesson.data.title}. Score : ${score}/${answers.length}. Erreurs : ${answers
              .filter((a) => a.picked !== a.question.correct_index)
              .map((a) => `${a.question.prompt} (réponse correcte : ${a.question.choices[a.question.correct_index]})`)
              .join(" | ") || "aucune"}`}
          />
        </section>
      )}
    </AppShell>
  );
}
