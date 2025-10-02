#!/bin/bash
# Script simple para probar los servicios sin interfierir con ellos

echo "🧪 Probando servicios (sin reiniciarlos)"
echo "======================================"

echo "1️⃣ Identity Service (3001):"
curl -s http://localhost:3001/api/v1/auth/config-check | head -c 80
echo ""

echo -e "\n2️⃣ Sports Service (3002) - Sin autenticación (debe fallar con 401):"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3002/api/v1/athletes)
echo "HTTP Status: $HTTP_CODE"

if [ "$HTTP_CODE" = "401" ]; then
    echo "✅ Endpoint protegido correctamente"
else
    echo "❌ Problema en la protección"
fi

echo -e "\n3️⃣ Para probar OAuth completo:"
echo "🔗 Abre en tu navegador: http://localhost:3001/api/v1/auth/google"
echo "📝 Después usa el JWT token para probar los endpoints protegidos"

echo -e "\n4️⃣ URLs importantes:"
echo "• Identity Service: http://localhost:3001"  
echo "• Sports Service: http://localhost:3002"
echo "• Swagger Identity: http://localhost:3001/api/docs"
echo "• Swagger Sports: http://localhost:3002/api/docs"