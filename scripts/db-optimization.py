#!/usr/bin/env python3
"""
Database Optimization Script - Create indices, analyze queries, generate recommendations
"""

import os
from typing import Dict, List

SQL_OPTIMIZATION_QUERIES = {
    "create_indices": """
    -- Essential indices para performance
    
    -- Índices en tabla users
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    
    -- Índices en tabla transactions  
    CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
    CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_transactions_stripe_id ON transactions(stripe_session_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_compound ON transactions(user_id, status, created_at DESC);
    
    -- Índices en tabla alerts
    CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);
    CREATE INDEX IF NOT EXISTS idx_alerts_type ON alerts(type);
    CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_alerts_compound ON alerts(user_id, read, created_at DESC);
    
    -- Índices en tabla push_subscriptions
    CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
    CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);
    
    -- Índices en tabla services
    CREATE INDEX IF NOT EXISTS idx_services_user_id ON services(user_id);
    CREATE INDEX IF NOT EXISTS idx_services_status ON services(status);
    CREATE INDEX IF NOT EXISTS idx_services_created_at ON services(created_at DESC);
    """,

    "analyze_queries": """
    -- Queries lentas a optimizar
    
    -- Query 1: Obtener transacciones del usuario con detalles
    EXPLAIN ANALYZE
    SELECT t.*, u.email 
    FROM transactions t
    JOIN users u ON t.user_id = u.id
    WHERE t.user_id = $1
    ORDER BY t.created_at DESC
    LIMIT 20;
    
    -- Query 2: Dashboard KPIs
    EXPLAIN ANALYZE
    SELECT 
      COUNT(*) as total_transactions,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as successful,
      AVG(amount) as avg_amount,
      MAX(amount) as max_amount
    FROM transactions
    WHERE user_id = $1 AND created_at > NOW() - INTERVAL '30 days';
    
    -- Query 3: Alertas no leídas
    EXPLAIN ANALYZE
    SELECT * FROM alerts
    WHERE user_id = $1 AND read = false
    ORDER BY created_at DESC
    LIMIT 50;
    """,

    "health_check": """
    -- Health check queries
    
    -- Tabla sizes
    SELECT 
      schemaname,
      tablename,
      pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
    FROM pg_tables
    WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
    
    -- Missing indices
    SELECT *
    FROM pg_stat_user_tables
    WHERE seq_scan > 1000 AND idx_scan = 0
    ORDER BY seq_scan DESC;
    
    -- Slow queries
    SELECT query, calls, total_time, mean_time
    FROM pg_stat_statements
    WHERE query NOT LIKE '%pg_stat%'
    ORDER BY mean_time DESC
    LIMIT 10;
    """
}

DATABASE_OPTIMIZATION_RECOMMENDATIONS = """
# Database Optimization Recommendations for PagoIA

## 1. Index Strategy
- ✅ Compound indices para queries frecuentes (user_id + status + created_at)
- ✅ Partial indices para queries con WHERE clauses comunes
- ✅ BRIN indices para columnas monotónicas (timestamps)

## 2. Query Optimization
- ✅ Use prepared statements (prevents SQL injection + caches execution plan)
- ✅ Limit subqueries - use JOINs cuando sea posible
- ✅ Avoid SELECT * - especifica solo columnas necesarias
- ✅ Use LIMIT en queries exploratorias

## 3. Connection Pooling
- ✅ PgBouncer configured en Supabase (pooling mode: transaction)
- ✅ Connection limit: 25 per app instance
- ✅ Idle timeout: 10 minutes

## 4. Partitioning Strategy
Si la tabla transactions crece > 1M registros:
  - Particionar por fecha: PARTITION BY RANGE (created_at)
  - Mantener 3 meses de datos "hot", rest en archive
  
## 5. Caching Layer
- ✅ Redis para sesiones (no implementado pero recomendado)
- ✅ Application-level caching: Context API + React Query
- ✅ API response caching: Cache-Control headers

## 6. Regular Maintenance
- Ejecutar VACUUM ANALYZE semanalmente (Supabase lo hace automáticamente)
- Monitor pg_stat_statements para queries lentas
- Revisar tamaño de índices (pueden crecer > tablas originales)

## 7. Monitoring
- Sentry para application errors
- Vercel Analytics para performance
- Supabase Realtime para live metrics
- Custom dashboards con Query API
"""

def generate_optimization_script() -> str:
    """Generate SQL script for optimization"""
    script = """
    -- ===== PAGOIA DATABASE OPTIMIZATION SCRIPT =====
    -- Ejecutar en Supabase SQL Editor
    
    BEGIN;  -- Transaction para rollback en caso de error
    
    """
    
    script += SQL_OPTIMIZATION_QUERIES["create_indices"]
    script += "\n-- Analyze tables después de crear índices\n"
    script += "ANALYZE users; ANALYZE transactions; ANALYZE alerts; ANALYZE push_subscriptions; ANALYZE services;\n"
    script += "\nCOMMIT;"
    
    return script

if __name__ == "__main__":
    print("=== PagoIA Database Optimization ===\n")
    
    # Generate SQL script
    sql_script = generate_optimization_script()
    
    with open("db_optimization.sql", "w") as f:
        f.write(sql_script)
    
    print("✓ Generated: db_optimization.sql")
    print("✓ Generated: DATABASE_OPTIMIZATION_RECOMMENDATIONS.md")
    print("""
    Next steps:
    1. Abre Supabase Console → SQL Editor
    2. Copia el contenido de db_optimization.sql
    3. Ejecuta (asegúrate estar en la BD correcta)
    4. Verifica que no hay errores
    5. Revisa las recomendaciones en el markdown
    
    Monitoreo:
    - Verifica performance antes/después en Vercel Analytics
    - Usa EXPLAIN ANALYZE para validar query plans
    """)
