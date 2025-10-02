#!/bin/bash
# Script de diagnóstico JWT

echo "🔧 Diagnóstico de Configuración JWT"
echo "=================================="

echo "1️⃣ Verificando archivos .env existentes:"
echo "Identity Service:"
if [ -f "/Users/eliecer.lopez/sports-platform/apps/identity-service/.env" ]; then
    echo "✅ .env existe"
    echo "JWT_SECRET configurado: $(grep JWT_SECRET /Users/eliecer.lopez/sports-platform/apps/identity-service/.env)"
else
    echo "❌ .env NO existe"
fi

echo -e "\nSports Service:"
if [ -f "/Users/eliecer.lopez/sports-platform/apps/sports-service/.env" ]; then
    echo "✅ .env existe" 
    echo "JWT_SECRET configurado: $(grep JWT_SECRET /Users/eliecer.lopez/sports-platform/apps/sports-service/.env)"
else
    echo "❌ .env NO existe"
fi

echo -e "\n2️⃣ Estado de los servicios:"
lsof -ti:3001,3002 | wc -l | xargs echo "Servicios ejecutándose:"

echo -e "\n3️⃣ Solución sugerida:"
echo "Copiar configuración JWT del identity-service al sports-service"