# 🔐 Google OAuth Setup Instructions

## Quick Setup for Testing

### Step 1: Get Google OAuth Credentials

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create a new project** (or use existing):
   - Project name: `sports-platform-dev`
3. **Enable APIs**:
   - Go to "APIs & Services" > "Library"
   - Search and enable "Google+ API" or "Google Identity Services API"
4. **Create OAuth 2.0 Credentials**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Application type: "Web application"
   - Name: "Sports Platform Development"

### Step 2: Configure Authorized URLs

**Authorized JavaScript origins:**

```
http://localhost:3001
http://localhost:4200
```

**Authorized redirect URIs:**

```
http://localhost:3001/api/v1/auth/google/callback
```

### Step 3: Update Environment Variables

Copy your Client ID and Client Secret, then update the `.env` file:

```bash
# Replace these with your actual credentials
GOOGLE_CLIENT_ID="your_actual_client_id_from_google_console"
GOOGLE_CLIENT_SECRET="your_actual_client_secret_from_google_console"
GOOGLE_CALLBACK_URL="http://localhost:3001/api/v1/auth/google/callback"
```

### Step 4: Test the OAuth Flow

1. Restart the identity service
2. Test the configuration: `curl http://localhost:3001/api/v1/auth/config-check`
3. Get the OAuth URL: `curl http://localhost:3001/api/v1/auth/google`
4. Open the returned `authUrl` in your browser
5. Complete the Google OAuth flow
6. Check the callback with the authorization code

## Testing Commands

```bash
# Check configuration
curl -s http://localhost:3001/api/v1/auth/config-check | jq .

# Get OAuth URL
curl -s http://localhost:3001/api/v1/auth/google | jq .

# Test error handling
curl -s "http://localhost:3001/api/v1/auth/google/callback?error=access_denied" | jq .
```

## Troubleshooting

### Common Issues:

1. **Invalid Client**: Check client ID and secret are correct
2. **Redirect URI Mismatch**: Ensure exact match in Google Console
3. **API Not Enabled**: Enable Google+ API or Google Identity Services
4. **CORS Issues**: Check authorized origins

### Debug Mode:

Set `NODE_ENV=development` to see detailed error messages.
