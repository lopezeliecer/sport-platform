#!/bin/bash
# Script para probar el flujo completo de OAuth y RBAC

echo "🔐 Probando Flujo Completo de Autenticación OAuth + RBAC"
echo "========================================================"

# Colors para output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Verificar servicios
echo -e "\n${BLUE}1️⃣ Verificando servicios...${NC}"
echo "   🔍 Identity Service (3001):"
IDENTITY_STATUS=$(curl -s -w "HTTPSTATUS:%{http_code}" http://localhost:3001/api/v1/auth/config-check)
IDENTITY_HTTP_CODE=$(echo $IDENTITY_STATUS | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')

if [ "$IDENTITY_HTTP_CODE" = "200" ]; then
    echo -e "   ${GREEN}✅ Identity Service funcionando${NC}"
else
    echo -e "   ${RED}❌ Identity Service no responde${NC}"
    exit 1
fi

echo "   🏃 Sports Service (3002):"
SPORTS_STATUS=$(curl -s -w "HTTPSTATUS:%{http_code}" http://localhost:3002/api/v1/athletes)
SPORTS_HTTP_CODE=$(echo $SPORTS_STATUS | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')

if [ "$SPORTS_HTTP_CODE" = "401" ]; then
    echo -e "   ${GREEN}✅ Sports Service funcionando y protegido${NC}"
else
    echo -e "   ${RED}❌ Sports Service problema: HTTP $SPORTS_HTTP_CODE${NC}"
fi

# Test 2: Información de OAuth
echo -e "\n${BLUE}2️⃣ Configuración OAuth${NC}"
echo "   🔗 Para iniciar OAuth manualmente:"
echo "   👉 Abrir en navegador: ${YELLOW}http://localhost:3001/api/v1/auth/google${NC}"
echo ""
echo "   📋 O usar curl para obtener la URL de redirección:"
echo "   ${YELLOW}curl -v http://localhost:3001/api/v1/auth/google${NC}"

# Test 3: Endpoints de prueba internos
echo -e "\n${BLUE}3️⃣ Probando endpoints de testing sin autenticación...${NC}"

echo "   🧪 Test endpoint - Club Admin (debe fallar):"
ADMIN_TEST=$(curl -s -w "HTTPSTATUS:%{http_code}" http://localhost:3001/api/v1/auth/test/club-admin)
ADMIN_HTTP_CODE=$(echo $ADMIN_TEST | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')

if [ "$ADMIN_HTTP_CODE" = "401" ]; then
    echo -e "   ${GREEN}✅ Endpoint protegido correctamente${NC}"
else
    echo -e "   ${RED}❌ Endpoint no protegido: HTTP $ADMIN_HTTP_CODE${NC}"
fi

echo "   🧪 Test endpoint - Manage Athletes (debe fallar):"
ATHLETES_TEST=$(curl -s -w "HTTPSTATUS:%{http_code}" http://localhost:3001/api/v1/auth/test/manage-athletes)
ATHLETES_HTTP_CODE=$(echo $ATHLETES_TEST | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')

if [ "$ATHLETES_HTTP_CODE" = "401" ]; then
    echo -e "   ${GREEN}✅ Endpoint protegido correctamente${NC}"
else
    echo -e "   ${RED}❌ Endpoint no protegido: HTTP $ATHLETES_HTTP_CODE${NC}"
fi

# Test 4: Documentación
echo -e "\n${BLUE}4️⃣ Verificando documentación Swagger...${NC}"

echo "   📚 Identity Service Docs:"
DOCS_IDENTITY=$(curl -s -w "HTTPSTATUS:%{http_code}" http://localhost:3001/api/docs)
DOCS_IDENTITY_CODE=$(echo $DOCS_IDENTITY | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')

if [ "$DOCS_IDENTITY_CODE" = "200" ]; then
    echo -e "   ${GREEN}✅ Swagger disponible en: http://localhost:3001/api/docs${NC}"
else
    echo -e "   ${YELLOW}⚠️  Swagger no disponible en identity-service${NC}"
fi

echo "   📚 Sports Service Docs:"
DOCS_SPORTS=$(curl -s -w "HTTPSTATUS:%{http_code}" http://localhost:3002/api/docs)
DOCS_SPORTS_CODE=$(echo $DOCS_SPORTS | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')

if [ "$DOCS_SPORTS_CODE" = "200" ]; then
    echo -e "   ${GREEN}✅ Swagger disponible en: http://localhost:3002/api/docs${NC}"
else
    echo -e "   ${YELLOW}⚠️  Swagger no disponible en sports-service${NC}"
fi

# Test 5: Instrucciones para OAuth testing
echo -e "\n${BLUE}5️⃣ Instrucciones para testing completo:${NC}"
echo ""
echo -e "${YELLOW}PASO A PASO PARA PROBAR OAUTH:${NC}"
echo "1. Abrir navegador en: http://localhost:3001/api/v1/auth/google"
echo "2. Completar flujo OAuth con Google"
echo "3. Copiar el JWT token de la respuesta"
echo "4. Usar el token para probar endpoints protegidos:"
echo ""
echo -e "${YELLOW}EJEMPLOS CON TOKEN:${NC}"
echo "# Obtener perfil del usuario autenticado:"
echo "curl -H \"Authorization: Bearer <tu-jwt-token>\" http://localhost:3001/api/v1/auth/me"
echo ""
echo "# Probar endpoint protegido de atletas:"
echo "curl -H \"Authorization: Bearer <tu-jwt-token>\" http://localhost:3002/api/v1/athletes"
echo ""
echo "# Probar endpoint de permisos:"
echo "curl -H \"Authorization: Bearer <tu-jwt-token>\" http://localhost:3001/api/v1/auth/permissions"

echo -e "\n${GREEN}🎉 Sistema listo para testing completo con OAuth!${NC}"
echo -e "${BLUE}🔗 URLs importantes:${NC}"
echo "   • Identity Service: http://localhost:3001"
echo "   • Sports Service: http://localhost:3002"
echo "   • OAuth Start: http://localhost:3001/api/v1/auth/google"
echo "   • Swagger Identity: http://localhost:3001/api/docs"
echo "   • Swagger Sports: http://localhost:3002/api/docs"