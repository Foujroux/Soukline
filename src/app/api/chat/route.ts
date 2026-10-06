import { NextResponse } from "next/server";
import { sanitizeText } from "@/lib/sanitize";

export const runtime = "nodejs";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const SYSTEM_PROMPT = `Tu es l'assistant officiel de Souk.dz, une plateforme algérienne de petites annonces. Réponds toujours dans la langue de l'utilisateur (français ou arabe), de façon concise et utile.

À propos de Souk.dz :
- Place de marché entre particuliers et professionnels dans les 58 wilayas d'Algérie.
- Les vendeurs publient des annonces (photo, description, prix) ; les acheteurs les consultent et contactent directement le vendeur pour convenir de l'état des biens, du prix ou d'un échange.
- Le paiement se fait uniquement à la livraison.
- Seuls les articles légaux sont autorisés ; les articles interdits sont rejetés et les autorités peuvent être contactées.
- Les administrateurs ne sont pas responsables des activités illégales des utilisateurs.
- Pour publier : créer un compte avec nom, téléphone et wilaya, compléter le profil, puis « Déposer une annonce ».
- Contacte-nous en cas de problème avec une annonce ou un vendeur. Suggestion de rencontre dans un lieu public sûr.`;

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.gemini_api_key;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured" },
      { status: 500 }
    );
  }

  let body: { messages?: ChatMessage[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!Array.isArray(body?.messages) || body.messages.length === 0) {
    return NextResponse.json(
      { error: "messages required" },
      { status: 400 }
    );
  }

  const contents: { role: string; parts: { text: string }[] }[] = [];
  for (const m of body.messages) {
    if (m.role !== "user" && m.role !== "assistant") continue;
    const text = sanitizeText(m.content, 4000);
    if (!text) continue;
    contents.push({ role: m.role === "user" ? "user" : "model", parts: [{ text }] });
  }
  if (contents.length === 0) {
    return NextResponse.json({ error: "messages required" }, { status: 400 });
  }

  const model = process.env.GEMINI_MODEL || "gemini-3.6-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system_instruction: { parts: [{ text: SYSTEM_PROMPT }] }, contents }),
  });

  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json(
      { error: data?.error?.message ?? "Gemini API error" },
      { status: res.status }
    );
  }

  const text = data?.candidates?.[0]?.content?.parts
    ?.map((p: { text?: string }) => p.text ?? "")
    .join("");

  if (!text) {
    return NextResponse.json({ error: "Empty response from Gemini" }, { status: 502 });
  }

  return NextResponse.json({ reply: text });
}