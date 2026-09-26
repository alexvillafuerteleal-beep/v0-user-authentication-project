import Anthropic from "@anthropic-ai/sdk"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { AI_MODEL, DAILY_TOKEN_LIMIT, SYSTEM_PROMPT, TOOLS, TOOL_STATUS, runTool } from "@/lib/ai/assistant"

export const runtime = "nodejs"
export const maxDuration = 60

const MAX_TOOL_ROUNDS = 6

const BodySchema = z.object({
  conversationId: z.string().uuid().optional(),
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(4000) }))
    .min(1)
    .max(40),
})

/** Eventos que recibe el widget, uno por línea (NDJSON). */
type ChatEvent =
  | { type: "meta"; conversationId: string | null }
  | { type: "text"; delta: string }
  | { type: "status"; label: string }
  | { type: "action"; url: string; label: string }
  | { type: "done" }
  | { type: "error"; message: string }

const today = () => new Date().toISOString().slice(0, 10)

async function readUsage(userId: string) {
  try {
    const admin = createAdminClient()
    const { data } = await admin.from("ai_usage").select("input_tokens, output_tokens").eq("user_id", userId).eq("day", today()).maybeSingle()
    return (data?.input_tokens ?? 0) + (data?.output_tokens ?? 0)
  } catch {
    return 0 // Sin tabla o sin service role no se bloquea el chat.
  }
}

async function addUsage(userId: string, input: number, output: number) {
  try {
    const admin = createAdminClient()
    const { data } = await admin.from("ai_usage").select("input_tokens, output_tokens").eq("user_id", userId).eq("day", today()).maybeSingle()
    await admin.from("ai_usage").upsert({
      user_id: userId,
      day: today(),
      input_tokens: (data?.input_tokens ?? 0) + input,
      output_tokens: (data?.output_tokens ?? 0) + output,
    })
  } catch (error) {
    console.error("[ai/chat] no se pudo registrar el uso:", error)
  }
}

export async function POST(req: NextRequest) {
  // Sin llave el widget usa el chatbot por palabras clave (/api/ai-support).
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "El asistente con IA no está configurado", fallback: true }, { status: 503 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Inicia sesión para usar el asistente", fallback: true }, { status: 401 })

  const parsedBody = BodySchema.safeParse(await req.json().catch(() => null))
  if (!parsedBody.success) return NextResponse.json({ error: "Mensaje inválido" }, { status: 400 })
  const { messages: history } = parsedBody.data
  if (history[0].role !== "user" || history[history.length - 1].role !== "user") {
    return NextResponse.json({ error: "La conversación debe empezar y terminar con un mensaje del usuario" }, { status: 400 })
  }

  if ((await readUsage(user.id)) >= DAILY_TOKEN_LIMIT) {
    return NextResponse.json({ error: "Llegaste al límite diario del asistente. Vuelve a intentarlo mañana." }, { status: 429 })
  }

  // Conversación: si las tablas aún no existen, el chat funciona sin guardar historial.
  let conversationId = parsedBody.data.conversationId ?? null
  const lastUserText = history[history.length - 1].content
  if (!conversationId) {
    const { data } = await supabase
      .from("ai_conversations")
      .insert({ user_id: user.id, title: lastUserText.slice(0, 60) })
      .select("id")
      .single()
    conversationId = data?.id ?? null
  }
  if (conversationId) {
    await supabase.from("ai_messages").insert({
      conversation_id: conversationId,
      user_id: user.id,
      role: "user",
      content: { text: lastUserText },
    })
  }

  const client = new Anthropic()
  const messages: Anthropic.Beta.BetaMessageParam[] = history.map((m) => ({ role: m.role, content: m.content }))
  // La fecha va en el último turno y no en el prompt de sistema, para no invalidar la caché.
  messages[messages.length - 1] = {
    role: "user",
    content: [
      { type: "text", text: `(Fecha de hoy: ${new Date().toLocaleDateString("es-MX", { dateStyle: "long", timeZone: "America/Mexico_City" })})` },
      { type: "text", text: lastUserText },
    ],
  }

  const encoder = new TextEncoder()
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: ChatEvent) => controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"))
      let inputTokens = 0
      let outputTokens = 0
      let answer = ""

      send({ type: "meta", conversationId })
      try {
        for (let round = 0, jsonRetries = 0; round < MAX_TOOL_ROUNDS; round++) {
          const stream = client.beta.messages.stream({
            model: AI_MODEL,
            max_tokens: 64000,
            betas: ["server-side-fallback-2026-07-01"],
            fallbacks: "default",
            output_config: { effort: "low" },
            system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
            tools: TOOLS,
            messages,
          })
          stream.on("text", (delta) => {
            answer += delta
            send({ type: "text", delta })
          })

          let message: Anthropic.Beta.BetaMessage
          try {
            message = await stream.finalMessage()
            jsonRetries = 0
          } catch (err) {
            // Solo se reintenta una entrada de herramienta que no se pudo parsear; los errores de la API suben.
            if (err instanceof Anthropic.APIError || jsonRetries++ >= 2) throw err
            round--
            continue
          }
          inputTokens += message.usage.input_tokens + (message.usage.cache_read_input_tokens ?? 0) + (message.usage.cache_creation_input_tokens ?? 0)
          outputTokens += message.usage.output_tokens

          if (message.stop_reason === "refusal") {
            if (!answer) send({ type: "text", delta: "No puedo ayudarte con eso. Pregúntame sobre tus servicios o pagos." })
            break
          }
          if (message.stop_reason === "pause_turn") {
            messages.push({ role: "assistant", content: message.content })
            continue
          }

          const toolUses = message.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use")
          if (toolUses.length === 0) break
          if (message.stop_reason === "max_tokens") throw new Error("La respuesta se cortó antes de terminar.")

          messages.push({ role: "assistant", content: message.content })
          const results: Anthropic.Beta.BetaToolResultBlockParam[] = []
          for (const tool of toolUses) {
            const status = TOOL_STATUS[tool.name as keyof typeof TOOL_STATUS]
            if (status) send({ type: "status", label: status })
            const outcome = await runTool(tool.name, tool.input, supabase, user.id)
            if (outcome.action) send({ type: "action", url: outcome.action.url, label: outcome.action.label })
            results.push({ type: "tool_result", tool_use_id: tool.id, content: outcome.content, is_error: outcome.isError })
          }
          // Todos los resultados de una ronda van en un solo mensaje para no desalentar llamadas en paralelo.
          messages.push({ role: "user", content: results })
          if (answer && !answer.endsWith("\n")) {
            answer += "\n\n"
            send({ type: "text", delta: "\n\n" })
          }
        }
        send({ type: "done" })
      } catch (error) {
        console.error("[ai/chat]", error)
        const message =
          error instanceof Anthropic.RateLimitError
            ? "El asistente está muy ocupado. Intenta de nuevo en un minuto."
            : error instanceof Anthropic.APIError
              ? "El asistente no está disponible en este momento."
              : "No pude terminar la respuesta. Intenta de nuevo."
        send({ type: "error", message })
      } finally {
        await addUsage(user.id, inputTokens, outputTokens)
        if (conversationId && answer.trim()) {
          await supabase.from("ai_messages").insert({
            conversation_id: conversationId,
            user_id: user.id,
            role: "assistant",
            content: { text: answer.trim() },
            input_tokens: inputTokens,
            output_tokens: outputTokens,
          })
        }
        controller.close()
      }
    },
  })

  return new Response(body, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" },
  })
}
