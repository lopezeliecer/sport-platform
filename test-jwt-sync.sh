#!/bin/bash
# Script para probar la sincronización JWT entre servicios

echo "🔄 Probando Sincronización JWT entre Servicios"
echo "=============================================="

echo "1️⃣ Iniciando nuevo flujo OAuth para obtener token sincronizado..."
echo "📋 Abre esta URL en tu navegador para obtener un nuevo token:"
echo "   http://localhost:3001/api/v1/auth/google"
echo ""

echo "2️⃣ Una vez que obtengas el nuevo token, úsalo para:"
echo ""
echo "# Probar identity-service:"
echo "curl -H \"Authorization: Bearer <NUEVO_TOKEN>\" http://localhost:3001/api/v1/auth/me"
echo ""
echo "# Probar sports-service (ahora debería funcionar):"
echo "curl -H \"Authorization: Bearer <NUEVO_TOKEN>\" http://localhost:3002/api/v1/athletes"
echo ""

echo "3️⃣ Esperamos que ambos servicios acepten el mismo token ahora 🤞"