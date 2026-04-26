import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const origin = requestUrl.origin
  const next = requestUrl.searchParams.get("next") || "/dashboard"

  // If there's no code, redirect to dashboard
  if (!code) {
    return NextResponse.redirect(`${origin}/dashboard`)
  }

  try {
    const supabase = await createClient()
    
    // Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error("Auth exchange error:", error)
      // On error, redirect to login
      return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(error.message)}`)
    }

    // Verify user is authenticated before redirecting
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error("User verification error:", userError)
      return NextResponse.redirect(`${origin}/auth/login?error=Verification%20failed`)
    }

    // Successfully authenticated, redirect to dashboard
    return NextResponse.redirect(`${origin}${next}`)
  } catch (error) {
    console.error("Callback error:", error)
    return NextResponse.redirect(`${origin}/auth/login?error=Authentication%20failed`)
  }
}
