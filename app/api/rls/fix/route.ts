import { createClient } from "@supabase/supabase-js";

// Crear cliente con la anon key (no será suficiente, pero lo intentamos)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    // Esta es una ruta protegida que debería usar service role
    // pero vamos a intentar hacer lo máximo posible con la anon key
    
    const sql = `
      -- Predictions
      DROP POLICY IF EXISTS "Users can only view their own predictions" ON predictions;
      DROP POLICY IF EXISTS "Users can insert their own predictions" ON predictions;
      DROP POLICY IF EXISTS "Users can update their own predictions" ON predictions;
      
      CREATE POLICY "Users can view their own predictions" ON predictions
        FOR SELECT USING (auth.uid() = user_id);
      
      CREATE POLICY "Users can insert their own predictions" ON predictions
        FOR INSERT WITH CHECK (auth.uid() = user_id);
      
      CREATE POLICY "Users can update their own predictions" ON predictions
        FOR UPDATE USING (auth.uid() = user_id);
      
      -- Alerts
      DROP POLICY IF EXISTS "Users can only view their own alerts" ON alerts;
      DROP POLICY IF EXISTS "Users can update their own alerts" ON alerts;
      DROP POLICY IF EXISTS "Users can insert their own alerts" ON alerts;
      DROP POLICY IF EXISTS "Users can delete their own alerts" ON alerts;
      
      CREATE POLICY "Users can view their own alerts" ON alerts
        FOR SELECT USING (auth.uid() = user_id);
      
      CREATE POLICY "Users can insert their own alerts" ON alerts
        FOR INSERT WITH CHECK (auth.uid() = user_id);
      
      CREATE POLICY "Users can update their own alerts" ON alerts
        FOR UPDATE USING (auth.uid() = user_id);
      
      CREATE POLICY "Users can delete their own alerts" ON alerts
        FOR DELETE USING (auth.uid() = user_id);
    `;

    // Nota: Esta ruta no puede ejecutar DDL (CREATE POLICY)
    // El usuario debe ejecutar esto en el SQL Editor de Supabase
    
    return Response.json({
      error: "Esta operación requiere ejecutar SQL en Supabase directamente",
      sql,
      instructions: "Abre https://supabase.com/dashboard/project/wweoeziquaofporasczt/sql/new y pega el SQL arriba"
    });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
