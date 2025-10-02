#!/bin/bash
# Script para testing avanzado del RBAC con club

TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYjc1ZWU3YS01ODNmLTQ3NDMtOGY1My01ZGUzZTE1MzQ1M2EiLCJlbWFpbCI6IiIsInNlc3Npb25JZCI6Ijc4MzI2MTc1LTkzMjgtNGFhZi1hZDVlLTBmM2FhYzMyYTViYSIsImNsdWJJZCI6bnVsbCwicm9sZXMiOltdLCJpYXQiOjE3NTkzNjExODcsImV4cCI6MTc1OTM2MjA4NywiYXVkIjoic3BvcnRzLXBsYXRmb3JtLXVzZXJzIiwiaXNzIjoic3BvcnRzLXBsYXRmb3JtIn0.E8J_0J7Np563jUyAWuwfpbZcMOgU5CzL4J171nr9Hs8"

echo "🏊‍♂️ Testing RBAC con Club y Roles"
echo "================================="

echo "1️⃣ Verificar perfil actual:"
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/v1/auth/me | jq '.email, .firstName'

echo -e "\n2️⃣ Verificar clubs disponibles:"
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/v1/auth/clubs

echo -e "\n3️⃣ Verificar permisos actuales:"
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/v1/auth/permissions

echo -e "\n4️⃣ Probar sports service (debería fallar por token):"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $TOKEN" http://localhost:3002/api/v1/athletes)
echo "HTTP Status: $HTTP_CODE"

echo -e "\n5️⃣ Endpoints que necesitan club (403 esperado):"
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/v1/auth/test/club-admin | jq '.message'

echo -e "\n💡 Para continuar testing completo:"
echo "   1. Crear un club en la BD"
echo "   2. Asignar usuario al club con rol CLUB_ADMIN"
echo "   3. Renovar token con nuevo contexto"
echo "   4. Probar endpoints protegidos"