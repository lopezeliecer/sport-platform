# 🎯 INSTRUCCIONES PARA PROBAR EL SISTEMA OAUTH + RBAC

## ✅ Estado Actual

- ✅ Identity Service ejecutándose en puerto 3001
- ✅ Sports Service ejecutándose en puerto 3002
- ✅ Sistema RBAC implementado y funcional

## 🧪 PASOS PARA PROBAR EL SISTEMA

### Paso 1: Verificar servicios (en un TERMINAL NUEVO)

```bash
# Abrir una nueva terminal y ejecutar:
cd /Users/eliecer.lopez/sports-platform

# Probar identity service
curl -s http://localhost:3001/api/v1/auth/config-check

# Probar sports service sin autenticación (debe dar 401)
curl -s -w "\nHTTP_STATUS:%{http_code}" http://localhost:3002/api/v1/athletes
```

### Paso 2: Probar flujo OAuth completo

#### Opción A: En navegador (RECOMENDADO)

1. Abrir navegador en: `http://localhost:3001/api/v1/auth/google`
2. Completar el flujo OAuth con Google
3. Copiar el JWT token de la respuesta
4. Usar ese token para probar endpoints protegidos

#### Opción B: Con curl (en terminal nuevo)

```bash
# Ver la redirección OAuth
curl -v http://localhost:3001/api/v1/auth/google

# Probar endpoint de prueba RBAC sin token (debe dar 401)
curl -s -w "\nHTTP_STATUS:%{http_code}" http://localhost:3001/api/v1/auth/test/club-admin
```

### Paso 3: Probar con JWT token (después de OAuth)

```bash
# Reemplazar <TOKEN> con el JWT obtenido del flujo OAuth

# Obtener perfil del usuario autenticado
curl -H "Authorization: Bearer <TOKEN>" http://localhost:3001/api/v1/auth/me

# Probar endpoint protegido de atletas
curl -H "Authorization: Bearer <TOKEN>" http://localhost:3002/api/v1/athletes

# Probar permisos del usuario
curl -H "Authorization: Bearer <TOKEN>" http://localhost:3001/api/v1/auth/permissions

# Probar endpoints RBAC específicos
curl -H "Authorization: Bearer <TOKEN>" http://localhost:3001/api/v1/auth/test/club-admin
curl -H "Authorization: Bearer <TOKEN>" http://localhost:3001/api/v1/auth/test/manage-athletes
```

### Paso 4: Probar Swagger UI

- Identity Service: http://localhost:3001/api/docs
- Sports Service: http://localhost:3002/api/docs

## 🔗 URLs Importantes

- **Identity Service**: http://localhost:3001
- **Sports Service**: http://localhost:3002
- **OAuth Start**: http://localhost:3001/api/v1/auth/google
- **Swagger Identity**: http://localhost:3001/api/docs
- **Swagger Sports**: http://localhost:3002/api/docs

## ⚠️ IMPORTANTE

- NO ejecutar estos comandos en los terminales donde están corriendo los servicios
- Usar siempre un TERMINAL NUEVO para las pruebas
- Los servicios deben seguir ejecutándose en background

## 🎯 Resultados Esperados

- ✅ Identity service responde con configuración OAuth
- ✅ Sports service rechaza peticiones sin token (401)
- ✅ OAuth redirecciona a Google
- ✅ Con JWT token válido, endpoints protegidos responden correctamente
- ✅ Swagger UI carga correctamente en ambos servicios
