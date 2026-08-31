import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Hand, Volume2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { fetchGestures, fetchSports, shuffle, type Gesture } from "@/lib/refmaster";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/gestes")({
  head: () => ({
    meta: [
      { title: "Gestes & signaux au sifflet — REFMASTER" },
      {
        name: "description",
        content: "Bibliothèque des gestes d'arbitrage et des signaux au sifflet par sport : signification, sanction, reprise du jeu.",
      },
      { property: "og:title", content: "Gestes & signaux au sifflet — REFMASTER" },
      { property: "og:description", content: "Apprenez et révisez les gestes officiels et les coups de sifflet." },
    ],
  }),
  component: GesturesPage,
});

function GesturesPage() {
  const sports = useQuery({ queryKey: ["sports"], queryFn: fetchSports });
  const [sportId, setSportId] = useState<string | undefined>(undefined);
  const activeSport = sportId ?? sports.data?.[0]?.id;

  const gestures = useQuery({
    queryKey: ["gestures", activeSport],
    queryFn: () => fetchGestures(activeSport!),
    enabled: !!activeSport,
  });

  return (
    <AppShell>
      <h1 className="text-3xl font-bold">Gestes & signaux</h1>
      <p className="mt-1 text-muted-foreground">
        Chaque geste est référencé avec sa fédération et sa version de règlement. Aucune convention n'est inventée.
      </p>

      <div className="mt-4 max-w-xs">
        <Select value={activeSport} onValueChange={setSportId}>
          <SelectTrigger>
            <SelectValue placeholder="Choisir un sport" />
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

      <Tabs defaultValue="library" className="mt-6">
        <TabsList>
          <TabsTrigger value="library">Bibliothèque</TabsTrigger>
          <TabsTrigger value="training">Entraînement</TabsTrigger>
        </TabsList>

        <TabsContent value="library" className="mt-4 space-y-3">
          {(gestures.data ?? []).length === 0 && (
            <Card>
              <CardContent className="p-6 text-sm text-muted-foreground">
                Aucun geste enregistré pour ce sport pour le moment.
              </CardContent>
            </Card>
          )}
          {(gestures.data ?? []).map((g) => (
            <GestureCard key={g.id} gesture={g} />
          ))}
        </TabsContent>

        <TabsContent value="training" className="mt-4">
          <GestureTraining gestures={gestures.data ?? []} />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

function GestureCard({ gesture }: { gesture: Gesture }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Hand className="h-4 w-4 text-primary" />
          <p className="font-display text-xl font-bold">{gesture.name}</p>
          {gesture.whistle_count !== null && (
            <Badge variant="secondary">
              <Volume2 className="mr-1 h-3 w-3" />
              {gesture.whistle_count === 0 ? "Pas de sifflet" : `${gesture.whistle_count} coup(s)`}
            </Badge>
          )}
        </div>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <Row label="Signification" value={gesture.meaning} />
          <Row label="Situation" value={gesture.situation} />
          <Row label="Sanction" value={gesture.sanction} />
          <Row label="Reprise du jeu" value={gesture.restart} />
          <Row label="Signal au sifflet" value={gesture.whistle} />
          <Row label="Erreurs fréquentes" value={gesture.common_errors} />
        </dl>
        <p className="mt-3 text-xs text-muted-foreground">
          {gesture.federation} · {gesture.ruleset_version}
        </p>
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function GestureTraining({ gestures }: { gestures: Gesture[] }) {
  const [round, setRound] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);

  const deck = useMemo(() => shuffle(gestures).slice(0, 4), [gestures, round]);
  const target = deck[0];

  if (gestures.length < 3) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Il faut au moins 3 gestes enregistrés pour lancer l'entraînement sur ce sport.
        </CardContent>
      </Card>
    );
  }

  const options = useMemo(() => shuffle(deck), [deck]);

  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Quel geste dois-je faire ?</p>
        <p className="mt-2 font-display text-xl font-bold">{target.situation}</p>
        <div className="mt-4 space-y-2">
          {options.map((g) => {
            const revealed = picked !== null;
            const correct = g.id === target.id;
            return (
              <button
                key={g.id}
                disabled={revealed}
                onClick={() => setPicked(g.id)}
                className={[
                  "w-full rounded-xl border px-4 py-3 text-left text-sm transition-colors",
                  !revealed && "border-border hover:border-primary",
                  revealed && correct && "border-success bg-success/15 text-success",
                  revealed && !correct && picked === g.id && "border-destructive bg-destructive/15 text-destructive",
                  revealed && !correct && picked !== g.id && "opacity-60",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {g.name}
              </button>
            );
          })}
        </div>

        {picked && (
          <div className="mt-4 rounded-xl border border-border bg-secondary/50 p-4 text-sm">
            <p className="font-semibold">{target.name}</p>
            <p className="text-muted-foreground">{target.meaning}</p>
            <p className="mt-1 text-muted-foreground">
              Sifflet : {target.whistle ?? "non applicable"} · Reprise : {target.restart ?? "—"}
            </p>
          </div>
        )}

        <Button
          className="mt-4 w-full"
          onClick={() => {
            setPicked(null);
            setRound((r) => r + 1);
          }}
        >
          Situation suivante
        </Button>
      </CardContent>
    </Card>
  );
}
