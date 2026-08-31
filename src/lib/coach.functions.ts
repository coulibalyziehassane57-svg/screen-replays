import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  context: z.string().max(4000),
  question: z.string().min(3).max(500),
});

export const askCoach = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return { answer: "Le Coach IA n'est pas disponible pour le moment." };

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-3.5-flash",
        messages: [
          {
            role: "system",
            content:
              "Tu es un formateur d'arbitres. Réponds en français, en 4 phrases maximum, de façon pédagogique. " +
              "Base-toi uniquement sur les éléments fournis dans le contexte et sur les règles officielles largement établies. " +
              "Si tu n'es pas certain d'une règle, dis-le explicitement au lieu d'inventer.",
          },
          { role: "user", content: `Contexte de l'élève : ${data.context}\n\nQuestion : ${data.question}` },
        ],
      }),
    });

    if (response.status === 429) return { answer: "Trop de demandes au Coach IA, réessayez dans un instant." };
    if (!response.ok) return { answer: "Le Coach IA est momentanément indisponible." };

    const payload = (await response.json()) as { choices?: { message?: { content?: string } }[] };
    return { answer: payload.choices?.[0]?.message?.content ?? "Pas de réponse." };
  });
