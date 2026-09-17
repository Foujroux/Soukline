import { NextResponse } from "next/server";
import { sanitizeText } from "@/lib/sanitize";

export const runtime = "nodejs";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
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
    body: JSON.stringify({ contents }),
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