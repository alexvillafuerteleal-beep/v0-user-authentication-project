import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { isPushConfigured } from "@/lib/notifications/push"

const subscriptionSchema = z.object({
  subscription: z.object({
    endpoint: z.string().url(),
    expirationTime: z.number().nullable().optional(),
    keys: z.object({
      p256dh: z.string().min(1),
      auth: z.string().min(1),
    }),
  }),
})

const unsubscribeSchema = z.object({
  endpoint: z.string().url().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const parsedBody = subscriptionSchema.safeParse(await req.json())

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: parsedBody.error.flatten() },
        { status: 400 }
      )
    }

    const { subscription } = parsedBody.data
    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        user_id: user.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        expiration_time: subscription.expirationTime || null,
        is_active: true,
        user_agent: req.headers.get("user-agent"),
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "endpoint",
      }
    )

    if (error) {
      throw new Error(error.message)
    }

    return NextResponse.json({
      success: true,
      pushConfigured: isPushConfigured(),
      endpoint: subscription.endpoint,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: `No se pudo registrar la suscripción push: ${errorMessage}` },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const parsedBody = unsubscribeSchema.safeParse(await req.json().catch(() => ({})))

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: parsedBody.error.flatten() },
        { status: 400 }
      )
    }

    let query = supabase
      .from("push_subscriptions")
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)

    if (parsedBody.data.endpoint) {
      query = query.eq("endpoint", parsedBody.data.endpoint)
    }

    const { error } = await query

    if (error) {
      throw new Error(error.message)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: `No se pudo desactivar la suscripción push: ${errorMessage}` },
      { status: 500 }
    )
  }
}