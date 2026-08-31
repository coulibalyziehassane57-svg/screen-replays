import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles } from "lucide-react";
import { askCoach } from "@/lib/coach.functions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const SUGGESTIONS = [
  "Pourquoi ma décision est-elle incorrecte ?",
  "Explique-moi cette règle simplement.",
  "Donne-moi une situation similaire.",
];

export function CoachPanel({ context }: { context: string }) {
  const ask = useServerFn(askCoach);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function send(text: string) {
    if (text.trim().length < 3) return;
    setBusy(true);
    setAnswer(null);
    try {
      const result = await ask({ data: { context, question: text } });
      setAnswer(result.answer);
    } catch {
      setAnswer("Le Coach IA est momentanément indisponible.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardContent className="p-5">
        <h3 className="flex items-center gap-2 font-display text-lg font-bold">
          <Sparkles className="h-4 w-4 text-primary" /> Coach IA
        </h3>
        <p className="text-sm text-muted-foreground">
          Posez une question sur vos erreurs. Les explications déjà enregistrées sont utilisées en priorité ;
          le Coach n'est appelé que lorsque vous le demandez.
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <Button key={s} size="sm" variant="secondary" disabled={busy} onClick={() => send(s)}>
              {s}
            </Button>
          ))}
        </div>

        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            send(question);
          }}
        >
          <Input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Votre question…" />
          <Button type="submit" disabled={busy}>
            {busy ? "…" : "Envoyer"}
          </Button>
        </form>

        {answer && <p className="mt-3 rounded-xl border border-border bg-secondary/50 p-4 text-sm">{answer}</p>}
      </CardContent>
    </Card>
  );
}
