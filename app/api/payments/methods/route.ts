import { NextResponse } from "next/server"
import { paymentMethods } from "@/lib/payments/methods"

export async function GET() {
  return NextResponse.json({
    methods: paymentMethods,
    count: paymentMethods.length,
    generatedAt: new Date().toISOString(),
  })
}