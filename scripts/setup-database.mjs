#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "❌ Error: NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridos"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  db: {
    schema: "public",
  },
});

async function executeSqlFile(filePath) {
  try {
    console.log(`\n📂 Leyendo archivo SQL: ${filePath}`);

    const sql = fs.readFileSync(filePath, "utf-8");

    console.log("⏳ Ejecutando SQL en Supabase...");

    // Split by ; to handle multiple statements
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s && !s.startsWith("--"));

    for (const statement of statements) {
      if (statement) {
        console.log(`✓ Ejecutando: ${statement.substring(0, 50)}...`);
        await supabase.rpc("execute_sql", {
          sql: statement,
        }).catch(() => {
          // Fallback: try direct execution
          return supabase.query(statement);
        });
      }
    }

    console.log("\n✅ ¡SQL ejecutado exitosamente!");
    console.log("\n📊 Verificando tablas creadas...");

    // Verify tables exist
    const { data: tables, error } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public");

    if (!error && tables) {
      console.log("Tablas encontradas:");
      tables.forEach((t) =>
        console.log(`  ✓ ${t.table_name}`)
      );
    }
  } catch (error) {
    console.error("❌ Error ejecutando SQL:", error.message);
    process.exit(1);
  }
}

// Main
const sqlFile = path.join(
  process.cwd(),
  "scripts",
  "003_create_services_tables.sql"
);

if (!fs.existsSync(sqlFile)) {
  console.error(
    `❌ Archivo no encontrado: ${sqlFile}`
  );
  process.exit(1);
}

executeSqlFile(sqlFile);
