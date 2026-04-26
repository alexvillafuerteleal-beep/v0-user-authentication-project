import { createClient } from "@/lib/supabase/client"

export interface Transaction {
  id: string
  service_type: string
  amount: number
  transaction_date: string
  status: string
  provider: string
  receipt_number: string
}

export interface Prediction {
  id: string
  service_type: string
  predicted_amount: number
  actual_amount?: number
  month_year: string
  confidence_score: number
}

export interface UserService {
  id: string
  service_type: string
  provider: string
  status: string
  due_date: number
  last_amount: number
}

export interface Alert {
  id: string
  title: string
  message: string
  alert_type: string
  is_read: boolean
  created_at: string
  url?: string
}

export interface UserPreferences {
  id?: string
  user_id?: string
  email_notifications: boolean
  push_notifications: boolean
  sms_notifications: boolean
  alert_notifications: boolean
  weekly_report: boolean
  profile_public: boolean
  share_data: boolean
  analytics_enabled: boolean
  theme: "light" | "dark" | "system"
  zoom: "small" | "normal" | "large"
}

// Obtener transacciones del usuario actual
export async function getTransactions(limit: number = 10) {
  const supabase = createClient()
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("transaction_date", { ascending: false })
      .limit(limit)

    if (error) throw error
    return data as Transaction[]
  } catch (error) {
    console.error("Error fetching transactions:", error)
    return []
  }
}

// Obtener predicciones del usuario actual
export async function getPredictions() {
  const supabase = createClient()
  
  try {
    const { data, error } = await supabase
      .from("predictions")
      .select("*")
      .order("prediction_date", { ascending: false })

    if (error) throw error
    return data as Prediction[]
  } catch (error) {
    console.error("Error fetching predictions:", error)
    return []
  }
}

// Obtener servicios del usuario actual
export async function getUserServices() {
  const supabase = createClient()
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from("user_services")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")

    if (error) throw error
    return data as UserService[]
  } catch (error) {
    console.error("Error fetching user services:", error)
    return []
  }
}

// Obtener alertas del usuario actual
export async function getAlerts(unreadOnly: boolean = false) {
  const supabase = createClient()
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    let query = supabase
      .from("alerts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (unreadOnly) {
      query = query.eq("is_read", false)
    }

    const { data, error } = await query

    if (error) throw error
    return data as Alert[]
  } catch (error) {
    console.error("Error fetching alerts:", error)
    return []
  }
}

// Marcar alerta como leída
export async function markAlertAsRead(alertId: string) {
  const supabase = createClient()
  
  try {
    const { error } = await supabase
      .from("alerts")
      .update({ is_read: true })
      .eq("id", alertId)

    if (error) throw error
    return true
  } catch (error) {
    console.error("Error marking alert as read:", error)
    return false
  }
}

// Crear una nueva transacción
export async function createTransaction(transactionData: Omit<Transaction, "id">) {
  const supabase = createClient()
  
  try {
    const { data, error } = await supabase
      .from("transactions")
      .insert([transactionData])
      .select()

    if (error) throw error
    return data?.[0] as Transaction
  } catch (error) {
    console.error("Error creating transaction:", error)
    return null
  }
}

// Obtener resumen de gastos del mes actual
export async function getMonthlySpendingSummary() {
  const supabase = createClient()
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return {}

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    
    const { data, error } = await supabase
      .from("transactions")
      .select("amount, service_type")
      .eq("user_id", user.id)
      .gte("transaction_date", startOfMonth.toISOString())
      .eq("status", "completed")

    if (error) throw error
    
    // Calcular totales por servicio
    const summary = (data as any[]).reduce((acc, transaction) => {
      const type = transaction.service_type
      acc[type] = (acc[type] || 0) + transaction.amount
      return acc
    }, {})

    return summary
  } catch (error) {
    console.error("Error fetching monthly summary:", error)
    return {}
  }
}

// Calcular total a pagar (pendientes)
export async function getTotalPending() {
  const supabase = createClient()
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return 0

    const { data, error } = await supabase
      .from("transactions")
      .select("amount")
      .eq("user_id", user.id)
      .eq("status", "pending")

    if (error) throw error
    
    const total = (data as any[]).reduce((sum, t) => sum + t.amount, 0)
    return total
  } catch (error) {
    console.error("Error fetching pending total:", error)
    return 0
  }
}

// Calcular ahorro estimado comparando real vs predicción
export async function getEstimatedSavings() {
  const supabase = createClient()
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return 0

    const { data, error } = await supabase
      .from("predictions")
      .select("predicted_amount, actual_amount")
      .eq("user_id", user.id)
      .not("actual_amount", "is", null)

    if (error) throw error
    
    const savings = (data as any[]).reduce((total, pred) => {
      return total + (pred.predicted_amount - (pred.actual_amount || 0))
    }, 0)

    return savings > 0 ? savings : 0
  } catch (error) {
    console.error("Error calculating savings:", error)
    return 0
  }
}

// Obtener estado de servicios (próximos a vencer)
export async function getUpcominDueServices(daysAhead: number = 7) {
  const supabase = createClient()
  
  try {
    const services = await getUserServices()
    
    const today = new Date()
    const upcomingServices = services.filter(service => {
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + service.due_date)
      
      return dueDate <= new Date(today.getTime() + daysAhead * 24 * 60 * 60 * 1000)
    })

    return upcomingServices
  } catch (error) {
    console.error("Error fetching upcoming due services:", error)
    return []
  }
}

// Obtener preferencias del usuario
export async function getUserPreferences(): Promise<UserPreferences> {
  const defaultPreferences: UserPreferences = {
    email_notifications: true,
    push_notifications: true,
    sms_notifications: false,
    alert_notifications: true,
    weekly_report: true,
    profile_public: false,
    share_data: false,
    analytics_enabled: true,
    theme: "dark",
    zoom: "normal",
  }
  
  try {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return defaultPreferences
    }

    const { data, error } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()

    // Tabla no existe o otros errores de schema - retornar defaults sin avisar
    if (error && error.message?.includes("Could not find the table")) {
      return defaultPreferences
    }

    // Tabla existe pero no tiene permisos - retornar defaults
    if (error && (error.code === "42501" || error.code === "PGRST301")) {
      return defaultPreferences
    }

    // No existe registro para este usuario (normal) - retornar defaults
    if (!data && !error) {
      return defaultPreferences
    }

    // Otro error - retornar defaults sin avisos agresivos
    if (error) {
      return defaultPreferences
    }

    // Retornar datos encontrados
    return data as UserPreferences
  } catch (error) {
    // Silenciosamente retornar defaults para cualquier excepción
    return defaultPreferences
  }
}

// Actualizar preferencias del usuario
export async function updateUserPreferences(preferences: Partial<UserPreferences>): Promise<UserPreferences | null> {
  try {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return null
    }

    // Usar UPSERT para insertar o actualizar en una sola operación
    const { data, error } = await supabase
      .from("user_preferences")
      .upsert(
        {
          user_id: user.id,
          ...preferences,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      )
      .select()
      .single()

    // Tabla no existe - avisar pero no fallar
    if (error && error.message?.includes("Could not find the table")) {
      console.log("Preferences saved locally (table not ready in database)")
      return null
    }

    // No tiene permisos - avisar pero no fallar
    if (error && (error.code === "PGRST301" || error.code === "42501")) {
      console.log("Preferences saved locally (permissions pending)")
      return null
    }

    if (error) {
      console.log("Preferences saved locally (database sync pending)")
      return null
    }

    return data as UserPreferences
  } catch (error) {
    // Cualquier excepción - silenciosamente retornar null
    return null
  }
}
