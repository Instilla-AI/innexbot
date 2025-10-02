# InnexBot API Backend

Backend API per InnexBot Chrome Extension - Tracking Audit System.

## Features

- ✅ Ricezione risultati audit da estensione Chrome
- ✅ Statistiche aggregate in tempo reale
- ✅ Autenticazione via API Key
- ✅ Rate limiting (10 req/15min)
- ✅ Sanitizzazione dati (no PII)
- ✅ CORS per Chrome extensions
- ✅ Health check endpoint

## Quick Start

### Installazione

```bash
npm install
```

### Configurazione

Copia `.env.example` in `.env` e configura:

```bash
cp .env.example .env
```

Modifica `.env`:
```env
API_KEY=sk_live_your_secure_key_here_min_32_chars
NODE_ENV=production
```

### Avvio Locale

```bash
# Development
npm run dev

# Production
npm start
```

Server disponibile su: `http://localhost:3000`

## API Endpoints

### Public

**GET /health**
```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2025-10-02T10:00:00Z",
  "uptime": 123.45
}
```

### Authenticated (require X-API-Key header)

**POST /api/v1/audit-results**

Riceve risultati audit dall'estensione.

Headers:
- `X-API-Key`: your_api_key
- `X-Extension-ID`: tracking-audit-v1
- `Content-Type`: application/json

Body:
```json
{
  "timestamp": "2025-10-02T10:00:00Z",
  "extensionVersion": "1.0.0",
  "score": 85,
  "healthStatus": "Eccellente",
  "eventsChecked": [
    {
      "eventType": "pageview",
      "found": true,
      "weight": 15,
      "category": "navigation"
    }
  ],
  "totalTests": 6,
  "successfulTests": 5,
  "failedTests": 1,
  "skippedTests": 0
}
```

Response:
```json
{
  "success": true,
  "auditId": "uuid-here",
  "message": "Audit results received successfully"
}
```

**GET /api/v1/stats**

Ritorna statistiche aggregate.

```bash
curl -H "X-API-Key: your_key" http://localhost:3000/api/v1/stats
```

Response:
```json
{
  "totalAudits": 150,
  "averageScore": 72,
  "scoreDistribution": {
    "excellent": { "count": 45, "percentage": 30 },
    "good": { "count": 60, "percentage": 40 },
    "fair": { "count": 30, "percentage": 20 },
    "critical": { "count": 15, "percentage": 10 }
  },
  "mostFailedEvents": [
    { "eventType": "purchase", "failureCount": 89 },
    { "eventType": "begin_checkout", "failureCount": 67 }
  ]
}
```

**GET /api/v1/audits?limit=50**

Ritorna ultimi audit ricevuti.

```bash
curl -H "X-API-Key: your_key" http://localhost:3000/api/v1/audits?limit=10
```

## Deploy su Railway

### Opzione 1: Da GitHub (Consigliato)

```bash
# Push su GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/Instilla-AI/innexbot.git
git push -u origin main
```

Poi su Railway:
1. Vai su [railway.app](https://railway.app)
2. "New Project" → "Deploy from GitHub repo"
3. Seleziona `innexbot` repository
4. Railway rileva automaticamente Node.js
5. Aggiungi variabili d'ambiente:
   - `API_KEY=sk_live_your_secure_key`
   - `NODE_ENV=production`
6. Deploy automatico in ~2 minuti

### Opzione 2: Railway CLI

```bash
# Installa Railway CLI
npm install -g @railway/cli

# Login
railway login

# Inizializza progetto
railway init

# Aggiungi variabili
railway variables set API_KEY=sk_live_your_key
railway variables set NODE_ENV=production

# Deploy
railway up

# Ottieni URL
railway domain
```

### Configurazione Railway

Railway genera automaticamente un URL tipo:
```
https://innexbot-api-production.up.railway.app
```

Copia questo URL per configurare l'estensione Chrome.

## Testing

```bash
# Test health check
curl https://your-app.up.railway.app/health

# Test audit endpoint
curl -X POST https://your-app.up.railway.app/api/v1/audit-results \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_key" \
  -H "X-Extension-ID: tracking-audit-v1" \
  -d '{
    "timestamp": "2025-10-02T10:00:00Z",
    "extensionVersion": "1.0.0",
    "score": 85,
    "healthStatus": "Eccellente",
    "eventsChecked": [],
    "totalTests": 6,
    "successfulTests": 5,
    "failedTests": 1,
    "skippedTests": 0
  }'
```

## Security

- ✅ Helmet.js per security headers
- ✅ Rate limiting per IP
- ✅ API Key authentication
- ✅ Sanitizzazione automatica dati sensibili
- ✅ CORS configurato per Chrome extensions
- ✅ Validazione rigorosa input

## Dati Bloccati (Privacy)

Il backend rifiuta automaticamente richieste contenenti:
- URL, email, userId, IP address
- Nomi, telefoni, indirizzi
- Dati pagamento, password, token

## Monitoring

```bash
# Railway logs in tempo reale
railway logs

# Status
railway status
```

## License

MIT
