#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

function deploySchema() {
  console.log('🚀 Validando schema SQL...\n')

  try {
    // Leer archivos SQL
    const sqlFiles = [
      '001_create_profiles.sql',
      '002_create_tables.sql',
      '003_enable_rls.sql',
      '004_fix_rls_policies.sql'
    ]

    const sqlDir = path.join(process.cwd(), 'scripts')
    let allContent = ''
    let successCount = 0

    for (const file of sqlFiles) {
      const sqlPath = path.join(sqlDir, file)
      
      if (fs.existsSync(sqlPath)) {
        const content = fs.readFileSync(sqlPath, 'utf-8')
        const statements = content
          .split(';')
          .map((s) => s.trim())
          .filter((s) => s.length > 0 && !s.startsWith('--'))
        
        console.log(`✅ ${file} - ${statements.length} statements`)
        allContent += content + '\n\n'
        successCount++
      } else {
        console.log(`⚠️  ${file} - No encontrado`)
      }
    }

    console.log(`\n📊 Archivos procesados: ${successCount}/${sqlFiles.length}\n`)

    if (successCount === 0) {
      console.error('❌ No se encontraron archivos SQL')
      process.exit(1)
    }

    console.log('📋 INSTRUCCIONES:\n')
    console.log('1. Abre https://supabase.com/dashboard/project/wweoeziquaofporasczt/sql/new')
    console.log('2. Copia y pega el siguiente SQL:')
    console.log('\n' + '='.repeat(80))
    console.log(allContent)
    console.log('='.repeat(80) + '\n')
    console.log('3. Haz click en "Run"')
    console.log('4. Verifica que todos los comandos se ejecuten correctamente\n')
    console.log('✅ Schema listo para aplicar\n')

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('❌ Error al procesar schema:', errorMessage)
    process.exit(1)
  }
}

deploySchema()
