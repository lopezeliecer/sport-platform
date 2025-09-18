#!/bin/bash

echo "🔐 Google OAuth Testing Script"
echo "============================="
echo ""

# Check if service is running
if curl -s http://localhost:3001/api/v1/auth/health > /dev/null 2>&1; then
    echo "✅ Service is running on port 3001"
else
    echo "❌ Service is not running. Please start it with:"
    echo "   cd /Users/eliecer.lopez/sports-platform/apps/identity-service"
    echo "   npm run start:dev"
    echo ""
    exit 1
fi

echo ""
echo "📋 Testing OAuth Configuration..."
echo "================================"

# Test configuration
echo "1. Checking OAuth configuration:"
curl -s http://localhost:3001/api/v1/auth/config-check | python3 -m json.tool

echo ""
echo "2. Testing Google OAuth initiation:"
OAUTH_RESPONSE=$(curl -s http://localhost:3001/api/v1/auth/google)
echo "$OAUTH_RESPONSE" | python3 -m json.tool

# Extract auth URL
AUTH_URL=$(echo "$OAUTH_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('authUrl', 'No authUrl found'))")

echo ""
echo "🌐 OAuth Flow Testing Instructions:"
echo "=================================="
echo ""
echo "1. Open this URL in your browser:"
echo "   $AUTH_URL"
echo ""
echo "2. Complete the Google authentication"
echo ""
echo "3. After redirect, copy the 'code' parameter from the callback URL"
echo "   Example: http://localhost:3001/api/v1/auth/google/callback?code=COPY_THIS_CODE"
echo ""
echo "4. Test the callback with the code:"
echo "   curl \"http://localhost:3001/api/v1/auth/google/callback?code=YOUR_CODE_HERE\""
echo ""
echo "🧪 Error Testing:"
echo "==============="
echo ""
echo "Test error handling:"
curl -s "http://localhost:3001/api/v1/auth/google/callback?error=access_denied" | python3 -m json.tool

echo ""
echo "Test missing code:"
curl -s "http://localhost:3001/api/v1/auth/google/callback" | python3 -m json.tool

echo ""
echo "🔍 Additional Tests:"
echo "=================="
echo ""
echo "Health check:"
curl -s http://localhost:3001/api/v1/auth/health | python3 -m json.tool

echo ""
echo "JWT test:"
curl -s http://localhost:3001/api/v1/auth/jwt-test | python3 -m json.tool

echo ""
echo "✅ Testing complete!"
echo ""
echo "📝 Next Steps:"
echo "1. If credentials are configured: Open the OAuth URL above"
echo "2. If not configured: Update .env with real Google credentials"
echo "3. Restart the service after updating credentials"