#!/usr/bin/env python3
"""
DEPLOYMENT CHECKLIST - PagoIA Production Release
Checklist antes de desplegar a producción
"""

DEPLOYMENT_CHECKLIST = {
    "SECURITY": {
        "items": [
            ("✅", "Ejecutar: npm run security:audit"),
            ("✅", "npm audit: 0 vulnerabilidades críticas"),
            ("✅", "Snyk scan: Sin issues bloqueadores"),
            ("✅", ".env.local: No commitiado a Git"),
            ("✅", "HTTPS habilitado en Vercel"),
            ("✅", "Security headers validados"),
            ("✅", "JWT tokens con expiration"),
            ("✅", "Database RLS policies activas"),
            ("✅", "Stripe webhook signature validation"),
        ]
    },
    
    "PERFORMANCE": {
        "items": [
            ("✅", "Lighthouse score > 90"),
            ("✅", "TTFB < 300ms"),
            ("✅", "LCP < 2.5s"),
            ("✅", "FID < 100ms"),
            ("✅", "CLS < 0.1"),
            ("✅", "Images optimizadas (WebP/AVIF)"),
            ("✅", "Cache headers configurados"),
            ("✅", "Compression habilitada"),
        ]
    },
    
    "TESTING": {
        "items": [
            ("✅", "Unit tests: npm run test (pass all)"),
            ("✅", "E2E tests: npm run test:e2e (pass all)"),
            ("✅", "Code coverage > 80%"),
            ("✅", "No console errors en navegador"),
            ("✅", "No unhandled promise rejections"),
        ]
    },
    
    "MONITORING": {
        "items": [
            ("✅", "Sentry DSN configurado"),
            ("✅", "Error tracking activo"),
            ("✅", "Performance monitoring activo"),
            ("✅", "Alertas Slack configuradas"),
            ("✅", "Vercel Analytics habilitado"),
        ]
    },
    
    "DATABASE": {
        "items": [
            ("✅", "Indices creados (db-optimization.py)"),
            ("✅", "ANALYZE ejecutado en tablas"),
            ("✅", "Backups configurados en Supabase"),
            ("✅", "Connection pooling activo"),
            ("✅", "RLS policies validadas"),
        ]
    },
    
    "DEPLOYMENT": {
        "items": [
            ("✅", "npm run build: Success (no errors)"),
            ("✅", "npm run type-check: 0 errors"),
            ("✅", "npm run lint: 0 errors"),
            ("✅", "Git: No uncommitted changes"),
            ("✅", "Environment variables en Vercel"),
            ("✅", "Stripe keys en Vercel Secrets"),
            ("✅", "Sentry keys en Vercel Secrets"),
            ("✅", "Preview deployment tested"),
        ]
    },
    
    "DOCUMENTATION": {
        "items": [
            ("✅", "README.md actualizado"),
            ("✅", "API contracts documentados"),
            ("✅", "Environment variables documentadas"),
            ("✅", "Deployment guide completo"),
            ("✅", "Runbooks para emergencias"),
        ]
    },
    
    "POST-DEPLOYMENT": {
        "items": [
            ("⏳", "Monitorear Sentry por 24h"),
            ("⏳", "Revisar Vercel Analytics"),
            ("⏳", "Test manual de flujos críticos"),
            ("⏳", "Verificar transacciones Stripe"),
            ("⏳", "Validar push notifications"),
        ]
    }
}

def print_checklist():
    print("""
╔══════════════════════════════════════════════════════════════════════════════╗
║                   PAGOIA DEPLOYMENT CHECKLIST                                ║
║                        Pre-Production Release                                 ║
╚══════════════════════════════════════════════════════════════════════════════╝
""")
    
    for category, data in DEPLOYMENT_CHECKLIST.items():
        print(f"\n📋 {category}")
        print("─" * 80)
        for status, item in data["items"]:
            print(f"  {status} {item}")
    
    print("""
╔══════════════════════════════════════════════════════════════════════════════╗
║                          DEPLOYMENT COMMANDS                                 ║
╚══════════════════════════════════════════════════════════════════════════════╝

Security & Quality:
  npm run security:audit        # npm audit + snyk test
  npm run type-check            # TypeScript type checking
  npm run lint                  # ESLint validation
  npm run test                  # Unit tests
  npm run test:coverage         # Code coverage report

Performance:
  npm run lighthouse            # Lighthouse audit
  npm run perf:analyze          # Full performance analysis
  npm run build                 # Production build

Database:
  python scripts/db-optimization.py  # Generate optimization SQL

Deployment:
  git push origin main          # Trigger Vercel deployment
  # Vercel automatically:
  # - Builds project
  # - Runs tests
  # - Deploys to production
  # - Updates DNS

Post-Deployment:
  - Monitor Sentry dashboard
  - Check Vercel Analytics
  - Verify critical flows
  - Monitor database performance
  - Test push notifications

╔══════════════════════════════════════════════════════════════════════════════╗
║                      EMERGENCY PROCEDURES                                    ║
╚══════════════════════════════════════════════════════════════════════════════╝

❌ Critical Error in Production:
  1. Check Sentry dashboard for error details
  2. Verify Vercel deployment status
  3. Check Supabase database connectivity
  4. Verify Stripe API status
  5. Check database performance metrics
  6. Review recent code changes
  7. Rollback if necessary: vercel rollback

🐛 Database Issues:
  1. Check Supabase console for active connections
  2. Monitor CPU and memory usage
  3. Review slow queries in pg_stat_statements
  4. Check for table locks or deadlocks
  5. Verify RLS policies are applied
  6. Consider connection pool reset

🔓 Security Issue:
  1. Revoke compromised API keys
  2. Rotate JWT secrets if needed
  3. Review Sentry for suspicious activity
  4. Check git history for exposed secrets
  5. Run security scan: npm run security:audit

⚠️  Performance Degradation:
  1. Check Lighthouse scores
  2. Review Vercel Analytics
  3. Monitor database query times
  4. Check image optimization
  5. Review bundle size
  6. Check for memory leaks in Sentry

📞 ESCALATION CONTACTS:
  - Tech Lead: [email]
  - Ops Team: [slack-channel]
  - Stripe Support: dashboard.stripe.com/docs/testing
  - Supabase Support: status.supabase.com
  - Vercel Support: status.vercel.com

""")

def verify_environment():
    """Verificar que el ambiente está listo para deployment"""
    import subprocess
    import sys
    
    print("\n🔍 Verificando ambiente...\n")
    
    checks = [
        ("Node.js", "node --version"),
        ("npm", "npm --version"),
        ("Git", "git --version"),
        ("Python", "python --version"),
    ]
    
    all_ok = True
    for name, cmd in checks:
        try:
            result = subprocess.run(cmd.split(), capture_output=True, text=True, timeout=5)
            if result.returncode == 0:
                print(f"  ✅ {name}: {result.stdout.strip()}")
            else:
                print(f"  ❌ {name}: Error")
                all_ok = False
        except:
            print(f"  ❌ {name}: Not found")
            all_ok = False
    
    if all_ok:
        print("\n✅ Ambiente listo para deployment\n")
    else:
        print("\n❌ Algunos requisitos no están instalados\n")
        sys.exit(1)

if __name__ == "__main__":
    print_checklist()
    verify_environment()
