import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Medal } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { levelFromXp } from "@/lib/refmaster";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/classement")({
  head: () => ({
    meta: [
      { title: "Classement des arbitres — REFMASTER" },
      { name: "description", content: "Comparez votre XP et votre niveau avec les autres arbitres de la communauté REFMASTER." },
      { property: "og:title", content: "Classement des arbitres — REFMASTER" },
      { property: "og:description", content: "Classement mondial des arbitres, masquable depuis votre profil." },
    ],
  }),
  component: LeaderboardPage,
});

function LeaderboardPage() {
  const { user } = useAuth();
  const board = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, country, xp, streak_days")
        .eq("hidden_from_leaderboard", false)
        .order("xp", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <AppShell>
      <h1 className="text-3xl font-bold">Classement</h1>
      <p className="mt-1 text-muted-foreground">
        Top 50 mondial par XP. Vous pouvez masquer votre profil depuis la page Profil.
      </p>

      <div className="mt-6 space-y-2">
        {(board.data ?? []).length === 0 && (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              Aucun arbitre classé pour l'instant. Terminez une leçon pour apparaître ici.
            </CardContent>
          </Card>
        )}
        {(board.data ?? []).map((row, index) => (
          <Card key={row.id} className={row.id === user?.id ? "border-primary" : ""}>
            <CardContent className="flex items-center gap-4 p-4">
              <span className="w-8 font-display text-xl font-bold text-muted-foreground">
                {index < 3 ? <Medal className="h-5 w-5 text-primary" /> : index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{row.display_name}</p>
                <p className="text-xs text-muted-foreground">
                  Niveau {levelFromXp(row.xp)} · série {row.streak_days} j{row.country ? ` · ${row.country}` : ""}
                </p>
              </div>
              <Badge variant="secondary">{row.xp} XP</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
