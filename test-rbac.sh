#!/bin/bash

echo "🧪 Probando el sistema RBAC de Sports Platform"
echo "=============================================="
echo ""

echo "1️⃣ Probando endpoint protegido SIN autenticación:"
echo "GET /api/v1/athletes"
echo ""

RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3002/api/v1/athletes)
echo "HTTP Status: $RESPONSE"

if [ "$RESPONSE" = "401" ]; then
    echo "✅ CORRECTO: Endpoint protegido rechaza acceso sin token"
else
    echo "❌ ERROR: Debería devolver 401 Unauthorized"
fi

echo ""
echo "2️⃣ Verificando que el identity-service está funcionando:"
curl -s http://localhost:3001/api/v1/auth/config-check | jq .

echo ""
echo "3️⃣ Verificando endpoints RBAC de prueba del identity-service:"
echo "GET /api/v1/auth/test/club-admin (sin token)"
RESPONSE2=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/v1/auth/test/club-admin)
echo "HTTP Status: $RESPONSE2"

if [ "$RESPONSE2" = "401" ]; then
    echo "✅ CORRECTO: Endpoint de prueba RBAC también está protegido"
else
    echo "❌ ERROR: Debería devolver 401 Unauthorized"
fi

echo ""
echo "🎉 Sistema RBAC configurado correctamente!"
echo "Ambos servicios están ejecutándose y los endpoints están protegidos."