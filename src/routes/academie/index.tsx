import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { fetchSports } from "@/lib/refmaster";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/academie/")({
  head: () => ({
    meta: [
      { title: "Académie d'arbitrage — REFMASTER" },
      { name: "description", content: "Choisissez votre sport et suivez des leçons progressives d'arbitrage validées par quiz." },
      { property: "og:title", content: "Académie d'arbitrage — REFMASTER" },
      { property: "og:description", content: "Leçons progressives par sport, validées par un quiz de 10 questions." },
    ],
  }),
  component: AcademiePage,
});

function AcademiePage() {
  const sports = useQuery({ queryKey: ["sports"], queryFn: fetchSports });
  const counts = useQuery({
    queryKey: ["lesson-counts"],
    queryFn: async () => {
      const { data } = await supabase.from("lessons").select("sport_id");
      const map: Record<string, number> = {};
      (data ?? []).forEach((row) => {
        map[row.sport_id] = (map[row.sport_id] ?? 0) + 1;
      });
      return map;
    },
  });

  return (
    <AppShell>
      <h1 className="text-3xl font-bold">Académie</h1>
      <p className="mt-1 text-muted-foreground">
        Chaque leçon se termine par un quiz obligatoire de 10 questions. La leçon suivante reste verrouillée
        tant que le score minimum n'est pas atteint.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(sports.data ?? []).map((sport) => {
          const count = counts.data?.[sport.id] ?? 0;
          return (
            <Link key={sport.id} to="/academie/$sport" params={{ sport: sport.slug }}>
              <Card className="h-full transition-colors hover:border-primary">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{sport.emoji}</span>
                    <div>
                      <p className="font-display text-lg font-bold">{sport.name}</p>
                      <p className="text-xs text-muted-foreground">{sport.federation}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{sport.description}</p>
                  <p className="mt-3 text-xs font-semibold text-primary">
                    {count > 0 ? `${count} leçon${count > 1 ? "s" : ""} disponibles` : "Contenu bientôt disponible"}
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}
