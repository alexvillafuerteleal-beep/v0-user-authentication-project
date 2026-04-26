export type PaymentMethodId = "card"

export interface PaymentMethodDefinition {
  id: PaymentMethodId
  name: string
  shortName: string
  icon: string
  description: string
  badge: string
  commission: number
  minAmount: number
  maxAmount: number
  processingTime: string
  status: "active" | "inactive"
}

export const paymentMethods: PaymentMethodDefinition[] = [
  {
    id: "card",
    name: "Tarjeta de Crédito/Débito",
    shortName: "Tarjeta",
    icon: "💳",
    description: "Pago inmediato en tiempo real",
    badge: "Inmediato",
    commission: 2.9,
    minAmount: 50,
    maxAmount: 50000,
    processingTime: "instant",
    status: "active",
  },
]

export function isSupportedPaymentMethod(
  paymentMethod: string
): paymentMethod is PaymentMethodId {
  return paymentMethods.some((method) => method.id === paymentMethod)
}

export function getPaymentMethodDefinition(paymentMethod: string) {
  return paymentMethods.find((method) => method.id === paymentMethod) ?? null
}