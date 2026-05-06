// OWASP Top 10 Security Checklist - PagoIA Implementation

const SECURITY_CHECKLIST = {
  "A01:2021 - Broken Access Control": {
    implemented: [
      "✅ Row Level Security (RLS) en Supabase - todos los datos filtrados por user_id",
      "✅ JWT validation en API routes - middleware chequea token antes de acceso",
      "✅ Admin role checks - operaciones sensibles requieren role='admin'",
      "✅ API endpoint protection - todos los endpoints requieren auth token",
      "✅ Database policies - SELECT/INSERT/UPDATE/DELETE restringidos por usuario"
    ],
    testing: [
      "Intenta acceder a recurso de otro usuario → debe retornar 403",
      "Modifica JWT en cliente → debe invalidar en servidor",
      "Intenta acceder sin token → debe retornar 401"
    ]
  },

  "A02:2021 - Cryptographic Failures": {
    implemented: [
      "✅ HTTPS en producción - certificado SSL/TLS en Vercel",
      "✅ Password hashing - bcrypt con salt rounds",
      "✅ JWT signing - HS256 con SECRET_KEY en .env",
      "✅ Stripe data encryption - PCI DSS compliant",
      "✅ Database connection encrypted - postgresql con SSL"
    ],
    testing: [
      "Verifica https:// en producción",
      "Intenta interceptar requests → datos encriptados en transito",
      "Revisa database passwords en logs → nunca visibles en plaintext"
    ]
  },

  "A03:2021 - Injection": {
    implemented: [
      "✅ SQL injection prevention - Supabase client uses prepared statements",
      "✅ No raw SQL queries - siempre usar ORM methods",
      "✅ Input validation - zod schemas validam todos los inputs",
      "✅ Parameterized queries - ${} syntax escapa automáticamente",
      "✅ NoSQL injection prevention - no applicable (PostgreSQL)"
    ],
    testing: [
      "INSERT INTO usuarios VALUES ('1\\' OR '1'='1) → debe fallar",
      "POST /api/payment con SQL en body → debe sanitizar",
      "Verifica que zod schema rechaza valores malformados"
    ]
  },

  "A04:2021 - Insecure Design": {
    implemented: [
      "✅ Threat modeling - documentado en MARCO_TEORICO.md",
      "✅ Secure by default - campos sensibles never exposed en frontend",
      "✅ Rate limiting - 100 requests/min/IP en API routes",
      "✅ CSRF tokens - Next.js incluye automáticamente en cookies",
      "✅ Security architecture - 3-tier con separación clara de concerns"
    ],
    testing: [
      "Rate limiting: send 150 requests en 1 min → exceeds limit",
      "CSRF: intenta POST sin token → debe fallar"
    ]
  },

  "A05:2021 - Security Misconfiguration": {
    implemented: [
      "✅ .env security - never committed a Git",
      "✅ Debug mode - disabled en producción",
      "✅ Security headers - CSP, X-Frame-Options, X-Content-Type-Options",
      "✅ Default credentials - changed immediately en setup",
      "✅ Dependencies updated - npm audit regularly, Snyk scanning"
    ],
    testing: [
      "Verifica que .env.local no está en .gitignore → debería estar",
      "Revisa headers en production → debe tener CSP",
      "npm audit → debería mostrar 0 vulnerabilidades"
    ]
  },

  "A06:2021 - Vulnerable and Outdated Components": {
    implemented: [
      "✅ Dependency audit - npm audit antes de deployment",
      "✅ Version pinning - semver ranges controlled",
      "✅ Snyk scanning - CI/CD pipeline chequea CVEs",
      "✅ Update policy - minor updates monthly, majors reviewed",
      "✅ Remove unused deps - tree-shaking minimizes attack surface"
    ],
    testing: [
      "npm audit → cero vulnerabilidades críticas",
      "npm ls stripe → verifica versión más reciente",
      "Snyk report en CI/CD → no debe bloquear PRs"
    ]
  },

  "A07:2021 - Identification and Authentication Failures": {
    implemented: [
      "✅ Password policy - min 8 chars, complexity checks",
      "✅ JWT expiration - tokens válidos 1 hora (refresh token 7 días)",
      "✅ Session management - Supabase maneja automáticamente",
      "✅ MFA ready - infrastructure soporta (no implementado en MVP)",
      "✅ Secure password reset - token con expiración 30min"
    ],
    testing: [
      "POST /auth/login con password < 8 chars → reject",
      "JWT expirado → refresh token debería renovar",
      "Password reset token > 30min → debería expirar"
    ]
  },

  "A08:2021 - Software and Data Integrity Failures": {
    implemented: [
      "✅ Signed commits - GitHub requires signature on main",
      "✅ Webhook signatures - HMAC-SHA256 validation en Stripe",
      "✅ Package integrity - npm lockfile para reproducibilidad",
      "✅ Deployment verification - CD pipeline verifica integridad",
      "✅ Source control - all changes tracked y auditable"
    ],
    testing: [
      "Webhook sin signature → debe retornar 401",
      "Modifica package.json manualmente → lockfile mismatch error",
      "Git log --verify-commit → todos los commits deben estar signed"
    ]
  },

  "A09:2021 - Logging and Monitoring Failures": {
    implemented: [
      "✅ Error logging - Sentry captures exceptions automatically",
      "✅ Access logging - API requests logged con timestamps",
      "✅ Monitoring - Vercel analytics + Sentry dashboard",
      "✅ Alerting - Sentry sends alerts en Slack para errors críticos",
      "✅ Audit trail - Database transaction logs en Supabase"
    ],
    testing: [
      "Trigger error en app → debe aparecer en Sentry dentro 1min",
      "Check Vercel analytics → debería mostrar requests/segundo",
      "Review Supabase logs → debería tener historial completo"
    ]
  },

  "A10:2021 - Server-Side Request Forgery": {
    implemented: [
      "✅ URL validation - whitelist de hosts permitidos",
      "✅ Internal network protection - no expone internal APIs",
      "✅ DNS rebinding protection - Supabase/Stripe endpoints trusted",
      "✅ Request timeout - 30 segundo timeout en API calls",
      "✅ Input validation - URL parameters validated"
    ],
    testing: [
      "POST /api/webhook con URL maliciosa → debe rechazar",
      "Intenta acceder a localhost desde webhook → debe fallar"
    ]
  }
};

// Export para testing
export default SECURITY_CHECKLIST;

// Test command: npm run security:audit
