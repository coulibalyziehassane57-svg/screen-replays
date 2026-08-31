import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Timer } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { addXp, fetchScenarios, fetchSports, grantBadge, shuffle, LEVELS, type Scenario } from "@/lib/refmaster";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CoachPanel } from "@/components/CoachPanel";

export const Route = createFileRoute("/simulateur")({
  head: () => ({
    meta: [
      { title: "Simulateur d'arbitrage — REFMASTER" },
      {
        name: "description",
        content: "Prenez des décisions d'arbitrage chronométrées sur des situations réelles et comparez avec la décision attendue.",
      },
      { property: "og:title", content: "Simulateur d'arbitrage — REFMASTER" },
      { property: "og:description", content: "Situation → décision → explication → XP. Mode rapide inclus." },
    ],
  }),
  component: SimulatorPage,
});

function SimulatorPage() {
  const { user } = useAuth();
  const sports = useQuery({ queryKey: ["sports"], queryFn: fetchSports });
  const [sportId, setSportId] = useState<string | undefined>();
  const [level, setLevel] = useState<string>("tous");
  const activeSport = sportId ?? sports.data?.[0]?.id;

  const scenarios = useQuery({
    queryKey: ["scenarios", activeSport],
    queryFn: () => fetchScenarios(activeSport!),
    enabled: !!activeSport,
  });

  const pool = useMemo(() => {
    const list = (scenarios.data ?? []).filter((s) => level === "tous" || s.level === level);
    return shuffle(list);
  }, [scenarios.data, level]);

  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [startedAt, setStartedAt] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [sessionScore, setSessionScore] = useState({ correct: 0, total: 0 });

  const current: Scenario | undefined = pool[index];

  useEffect(() => {
    setIndex(0);
    setPicked(null);
    setStartedAt(Date.now());
  }, [activeSport, level]);

  useEffect(() => {
    if (picked !== null) return;
    const id = setInterval(() => setElapsed(Math.round((Date.now() - startedAt) / 100) / 10), 100);
    return () => clearInterval(id);
  }, [picked, startedAt]);

  async function choose(option: number) {
    if (!current || picked !== null) return;
    const ms = Date.now() - startedAt;
    setPicked(option);
    const correct = option === current.correct_index;
    setSessionScore((s) => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }));
    if (!user) return;
    await supabase.from("scenario_attempts").insert({
      user_id: user.id,
      scenario_id: current.id,
      correct,
      decision_ms: ms,
    });
    if (correct) {
      await addXp(user.id, 10 + current.difficulty * 5);
      const { count } = await supabase
        .from("scenario_attempts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("correct", true);
      if ((count ?? 0) >= 10) await grantBadge(user.id, "simulator_10");
    }
  }

  function next() {
    setPicked(null);
    setStartedAt(Date.now());
    setElapsed(0);
    setIndex((i) => (i + 1) % Math.max(pool.length, 1));
  }

  return (
    <AppShell>
      <h1 className="text-3xl font-bold">Simulateur</h1>
      <p className="mt-1 text-muted-foreground">Situation → décision → sanction → explication. Votre temps de décision est mesuré.</p>

      <div className="mt-4 flex flex-wrap gap-3">
        <div className="w-48">
          <Select value={activeSport} onValueChange={setSportId}>
            <SelectTrigger>
              <SelectValue placeholder="Sport" />
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
        <div className="w-44">
          <Select value={level} onValueChange={setLevel}>
            <SelectTrigger>
              <SelectValue placeholder="Niveau" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tous">Tous niveaux</SelectItem>
              {LEVELS.map((l) => (
                <SelectItem key={l.value} value={l.value}>
                  {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Badge variant="secondary" className="self-center">
          Session : {sessionScore.correct}/{sessionScore.total}
        </Badge>
      </div>

      {!current && (
        <Card className="mt-6">
          <CardContent className="p-6 text-sm text-muted-foreground">
            Aucune situation disponible pour ce sport et ce niveau. Essayez un autre filtre.
          </CardContent>
        </Card>
      )}

      {current && (
        <Card className="mt-6">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <Badge variant="outline">{current.theme ?? "Situation"}</Badge>
              <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                <Timer className="h-4 w-4" /> {picked === null ? elapsed.toFixed(1) : (elapsed || 0).toFixed(1)}s
              </span>
            </div>
            <p className="mt-3 font-display text-xl font-bold">Que décides-tu ?</p>
            <p className="mt-2 text-sm leading-relaxed">{current.situation}</p>

            <div className="mt-4 space-y-2">
              {current.options.map((option, i) => {
                const revealed = picked !== null;
                const correct = i === current.correct_index;
                return (
                  <button
                    key={i}
                    disabled={revealed}
                    onClick={() => choose(i)}
                    className={[
                      "w-full rounded-xl border px-4 py-3 text-left text-sm transition-colors",
                      !revealed && "border-border hover:border-primary",
                      revealed && correct && "border-success bg-success/15 text-success",
                      revealed && !correct && picked === i && "border-destructive bg-destructive/15 text-destructive",
                      revealed && !correct && picked !== i && "opacity-60",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {option}
                  </button>
                );
              })}
            </div>

            {picked !== null && (
              <div className="mt-4 space-y-3">
                <div className="rounded-xl border border-border bg-secondary/50 p-4 text-sm">
                  <p className="font-semibold">Décision attendue : {current.options[current.correct_index]}</p>
                  <p className="mt-1 text-muted-foreground">{current.explanation}</p>
                  <ul className="mt-2 space-y-1">
                    {current.options.map((option, i) =>
                      i === current.correct_index || !current.wrong_explanations?.[i] ? null : (
                        <li key={i} className="text-xs text-muted-foreground">
                          « {option} » : {current.wrong_explanations[i]}
                        </li>
                      ),
                    )}
                  </ul>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {current.federation} · temps de décision {(elapsed || 0).toFixed(1)}s
                  </p>
                </div>
                <Button className="w-full" onClick={next}>
                  Situation suivante
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {current && picked !== null && (
        <div className="mt-4">
          <CoachPanel
            context={`Situation : ${current.situation}. Décision attendue : ${current.options[current.correct_index]}. Réponse de l'utilisateur : ${current.options[picked]}.`}
          />
        </div>
      )}
    </AppShell>
  );
}
