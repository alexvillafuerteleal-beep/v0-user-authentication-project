#!/usr/bin/env powershell

Write-Host "`n" -ForegroundColor Green
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         🚀 SETUP AUTOMÁTICO - PROYECTO PAGO IA        ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host "`n"

# Check .env.local
Write-Host "📝 Verificando configuración..." -ForegroundColor Yellow
if (Test-Path ".env.local") {
    Write-Host "✅ .env.local encontrado" -ForegroundColor Green
} else {
    Write-Host "❌ .env.local NO ENCONTRADO" -ForegroundColor Red
    Write-Host "   Copia .env.local.example a .env.local y completa variables"
    exit 1
}

# Check Node.js
Write-Host "📦 Verificando Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version
Write-Host "✅ Node.js $nodeVersion" -ForegroundColor Green

# Install dependencies
Write-Host "`n📚 Instalando dependencias (si necesario)..." -ForegroundColor Yellow
npm ci --silent
Write-Host "✅ Dependencias listas" -ForegroundColor Green

# Build
Write-Host "`n🔨 Compilando proyecto..." -ForegroundColor Yellow
$buildOutput = npm run build 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build exitoso" -ForegroundColor Green
} else {
    Write-Host "❌ Error en build:" -ForegroundColor Red
    Write-Host $buildOutput
    exit 1
}

# Show next steps
Write-Host "`n" -ForegroundColor Green
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║              ✅ SETUP COMPLETADO                      ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host "`n"

Write-Host "🚀 PRÓXIMOS PASOS:" -ForegroundColor Cyan
Write-Host "`n1️⃣  INICIAR SERVIDOR (en nueva terminal):" -ForegroundColor Yellow
Write-Host "   npm run dev`n" -ForegroundColor White

Write-Host "2️⃣  EJECUTAR SQL EN SUPABASE:" -ForegroundColor Yellow
Write-Host "   • Abre: https://app.supabase.com" -ForegroundColor Gray
Write-Host "   • SQL Editor → NEW QUERY" -ForegroundColor Gray
Write-Host "   • Copia contenido de: scripts/003_create_services_tables.sql" -ForegroundColor Gray
Write-Host "   • Click: RUN`n" -ForegroundColor Gray

Write-Host "3️⃣  ACCEDER A LA APLICACIÓN:" -ForegroundColor Yellow
Write-Host "   • Landing: http://localhost:3000/" -ForegroundColor Gray
Write-Host "   • Admin:    http://localhost:3000/admin" -ForegroundColor Gray
Write-Host "   • Email:    test@example.com" -ForegroundColor Gray
Write-Host "   • Password: Test123456`n" -ForegroundColor Gray

Write-Host "📖 Ver documentación completa:" -ForegroundColor Yellow
Write-Host "   GUIA_FUNCIONAL_COMPLETA.md`n" -ForegroundColor White

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "¿Necesitas ayuda? Lee: GUIA_FUNCIONAL_COMPLETA.md" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "`n"
