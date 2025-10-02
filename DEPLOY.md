# InnexBot - Guida Deploy Completa

Guida step-by-step per deploy backend su Railway e pubblicazione estensione Chrome.

---

## FASE 1: Setup Repository GitHub

### 1.1 Inizializza Git

```bash
cd C:\Users\ciopp\Desktop\innexbot
git init
git add .
git commit -m "Initial commit: InnexBot tracking audit extension"
```

### 1.2 Crea Repository su GitHub

**Opzione A: Via Web**
1. Vai su https://github.com/new
2. Nome repository: `innexbot`
3. Descrizione: `E-commerce Tracking Audit Extension - Chrome extension with backend API`
4. Pubblico
5. NON inizializzare con README (già presente)
6. Clicca "Create repository"

**Opzione B: Via GitHub CLI**
```bash
gh repo create innexbot --public --source=. --remote=origin --push
```

### 1.3 Push Codice

```bash
git remote add origin https://github.com/Instilla-AI/innexbot.git
git branch -M main
git push -u origin main
```

---

## FASE 2: Deploy Backend su Railway

### 2.1 Installa Railway CLI (se non presente)

```bash
npm install -g @railway/cli
```

### 2.2 Login Railway

```bash
railway login
```

Si aprirà il browser per autenticazione.

### 2.3 Deploy Backend

```bash
cd backend
railway init
```

Seleziona:
- "Create new project"
- Nome: `innexbot-api`
- Environment: `production`

```bash
# Deploy
railway up

# Attendi completamento (circa 2 minuti)
```

### 2.4 Configura Variabili d'Ambiente

```bash
# Genera API key sicura (32+ caratteri)
# Esempio: sk_live_abc123xyz789def456ghi012jkl345mno

railway variables set API_KEY=sk_live_abc123xyz789def456ghi012jkl345mno
railway variables set NODE_ENV=production
railway variables set ALLOWED_ORIGINS="chrome-extension://*"
```

### 2.5 Ottieni URL Pubblico

```bash
railway domain
```

Output esempio:
```
https://innexbot-api-production.up.railway.app
```

**IMPORTANTE**: Copia questo URL, ti servirà per configurare l'estensione!

### 2.6 Test Backend

```bash
# Test health check
curl https://innexbot-api-production.up.railway.app/health

# Dovrebbe ritornare:
# {"status":"healthy","version":"1.0.0","timestamp":"...","uptime":...}
```

---

## FASE 3: Configura Estensione Chrome

### 3.1 Aggiorna URL API

Modifica `extension/scripts/background.js`:

```javascript
const CONFIG = {
  API_BASE_URL: 'https://innexbot-api-production.up.railway.app', // ← IL TUO URL RAILWAY
  API_KEY: 'sk_live_abc123xyz789def456ghi012jkl345mno',           // ← LA TUA API KEY
  EXTENSION_ID: 'innexbot-v1',
  EXTENSION_VERSION: '1.0.0',
  // ...
};
```

### 3.2 Genera Icone

**Opzione Rapida: Placeholder Temporaneo**

Crea 4 file PNG nella cartella `extension/icons/`:

1. Vai su https://via.placeholder.com/128/FF6B35/FFFFFF?text=IB
2. Salva come `icon128.png`
3. Ridimensiona per altre dimensioni:
   - https://via.placeholder.com/48/FF6B35/FFFFFF?text=IB → `icon48.png`
   - https://via.placeholder.com/32/FF6B35/FFFFFF?text=IB → `icon32.png`
   - https://via.placeholder.com/16/FF6B35/FFFFFF?text=IB → `icon16.png`

**Opzione Professionale: Figma/Canva**

Vedi `extension/icons/README.md` per istruzioni dettagliate.

### 3.3 Test Locale

1. Apri Chrome → `chrome://extensions/`
2. Abilita "Modalità sviluppatore"
3. Clicca "Carica estensione non pacchettizzata"
4. Seleziona cartella `C:\Users\ciopp\Desktop\innexbot\extension`
5. L'estensione apparirà nella toolbar

### 3.4 Test Funzionalità

1. Vai su un sito e-commerce (es: https://demo.vercel.store/)
2. Clicca icona InnexBot
3. Accetta privacy policy
4. Avvia audit e segui gli step
5. Verifica che gli eventi vengano rilevati
6. Controlla risultati finali

### 3.5 Verifica Invio Dati Backend

Apri DevTools dell'estensione:
- Tasto destro su popup → Ispeziona
- Vai su tab Console
- Cerca messaggi tipo: `[InnexBot] Audit results sent: {auditId: "..."}`

Oppure controlla Railway logs:
```bash
railway logs
```

Dovresti vedere:
```
[AUDIT RECEIVED] ID: uuid-here, Score: 75%, Status: Buono
```

---

## FASE 4: Preparazione per Chrome Web Store

### 4.1 Crea Screenshot

Cattura 3-5 screenshot dell'estensione in azione:
1. Widget principale con step audit
2. Risultati finali con score
3. Pannello configurazione
4. Privacy modal
5. Report dettagliato eventi

Dimensioni richieste: 1280x800 o 640x400 px

### 4.2 Pubblica Privacy Policy

Opzioni:
- **Hosting proprio**: Carica `extension/privacy/privacy-policy.html` sul tuo sito
- **GitHub Pages**: Usa repository per hosting gratuito
- **Railway**: Aggiungi endpoint al backend per servire la policy

Esempio URL: `https://innexdata.com/privacy-innexbot`

### 4.3 Crea ZIP per Upload

```bash
cd C:\Users\ciopp\Desktop\innexbot
```

**Windows PowerShell:**
```powershell
Compress-Archive -Path extension\* -DestinationPath innexbot-extension-v1.0.0.zip
```

**Verifica ZIP:**
- Dimensione < 20MB ✓
- Contiene manifest.json ✓
- Contiene tutte le icone ✓
- NON contiene .git, node_modules, .DS_Store ✓

### 4.4 Registra Account Chrome Developer

1. Vai su https://chrome.google.com/webstore/devconsole
2. Accetta Terms of Service
3. Paga $5 (una tantum, carta di credito)
4. Attendi conferma (immediata)

### 4.5 Upload Estensione

1. Clicca "New Item"
2. Upload `innexbot-extension-v1.0.0.zip`
3. Attendi elaborazione (1-2 minuti)

### 4.6 Compila Store Listing

**Dettagli Prodotto:**
- **Nome**: InnexBot - E-commerce Tracking Audit
- **Descrizione breve** (132 char max):
  ```
  Verifica tracking e-commerce con audit guidati step-by-step. Score, report e privacy-first.
  ```
- **Descrizione dettagliata**:
  ```
  InnexBot è uno strumento professionale per verificare l'implementazione del tracking e-commerce.

  CARATTERISTICHE PRINCIPALI:
  ✓ Audit guidato step-by-step per eventi GA4/GTM
  ✓ Verifica pageview, view_item, add_to_cart, purchase e altri
  ✓ Sistema di scoring personalizzabile con pesi
  ✓ Report visuale con health status (Eccellente/Buono/Sufficiente/Critico)
  ✓ Export risultati in JSON
  ✓ Privacy-first: solo dati anonimi aggregati (con consenso)

  IDEALE PER:
  - Digital Marketing Manager
  - E-commerce Manager
  - Web Analyst
  - SEO Specialist
  - Developer

  COME FUNZIONA:
  1. Clicca sull'icona InnexBot
  2. Segui le istruzioni per ogni step (homepage, categoria, prodotto, carrello, checkout)
  3. L'estensione verifica automaticamente il dataLayer
  4. Visualizza risultati con score finale e dettagli eventi
  5. Esporta report per condividerlo con il team

  PRIVACY E SICUREZZA:
  InnexBot NON raccoglie URL, dati personali, email, o PII. Solo statistiche anonime aggregate con tuo consenso esplicito. Conformità GDPR e Chrome Web Store User Data Policy.

  SUPPORTO:
  Email: support@innexdata.com
  Sito: https://innexdata.com
  ```

- **Categoria**: Developer Tools
- **Lingua**: Italiano (primary), Inglese (secondary)

**Grafica:**
- Carica 5 screenshot (1280x800 px)
- Icona store: 128x128 px (già presente)
- Tile promozionale piccolo: 440x280 px (opzionale)

**Privacy:**
- Link Privacy Policy: `https://innexdata.com/privacy-innexbot`
- Giustificazione permessi:
  ```
  - activeTab: Necessario per accedere al dataLayer della pagina corrente
  - scripting: Richiesto per iniettare il content script che monitora gli eventi
  - storage: Utilizzato per salvare preferenze utente (configurazione eventi, consenso privacy)
  - host_permissions: Permette di funzionare su tutti i siti web per audit universale
  ```

**Dichiarazione Limited Use:**
```
L'uso delle informazioni ricevute dalle API di Google rispetta la Chrome Web Store User Data Policy, inclusi i requisiti Limited Use. InnexBot raccoglie solo dati anonimi aggregati (risultati audit, punteggi) e NON raccoglie URL, dati personali, cronologia di navigazione o PII.
```

**Single Purpose:**
```
Verificare l'implementazione del tracking e-commerce tramite audit guidati del dataLayer.
```

### 4.7 Submit per Review

1. Clicca "Submit for review"
2. Conferma dichiarazioni
3. Attendi email di conferma

**Tempi di review:**
- Prima submission: 2-7 giorni lavorativi
- Update successivi: 1-3 giorni

---

## FASE 5: Post-Deploy

### 5.1 Monitoring Backend

**Railway Dashboard:**
```bash
# Logs in tempo reale
railway logs --follow

# Status
railway status

# Metrics
railway metrics
```

**Endpoint Monitoring:**
- Configura Uptime Robot (gratuito): https://uptimerobot.com
- Monitora `/health` ogni 5 minuti
- Alert via email se down

### 5.2 Analytics Backend

Controlla statistiche:
```bash
curl -H "X-API-Key: your_key" https://your-app.up.railway.app/api/v1/stats
```

Output:
```json
{
  "totalAudits": 150,
  "averageScore": 72,
  "scoreDistribution": {
    "excellent": {"count": 45, "percentage": 30},
    "good": {"count": 60, "percentage": 40},
    "fair": {"count": 30, "percentage": 20},
    "critical": {"count": 15, "percentage": 10}
  },
  "mostFailedEvents": [
    {"eventType": "purchase", "failureCount": 89},
    {"eventType": "begin_checkout", "failureCount": 67}
  ]
}
```

### 5.3 Aggiornamenti Estensione

Per pubblicare update:

1. Modifica codice
2. Incrementa versione in `manifest.json`: `1.0.0` → `1.0.1`
3. Crea nuovo ZIP
4. Chrome Web Store → Tuo item → "Upload updated package"
5. Descrivi modifiche nel changelog
6. Submit per review (1-3 giorni)

### 5.4 Aggiornamenti Backend

```bash
cd backend
# Modifica codice
git add .
git commit -m "Fix: improved validation"
git push origin main

# Railway fa auto-deploy in ~2 minuti
railway logs --follow
```

---

## TROUBLESHOOTING

### Backend non risponde

```bash
# Check status
railway status

# Restart service
railway restart

# Check logs
railway logs --tail 100
```

### Estensione non comunica con backend

1. Verifica URL in `background.js` sia corretto
2. Controlla API key sia corretta
3. Verifica CORS nel backend (deve accettare `chrome-extension://*`)
4. Controlla Railway logs per errori 401/403

### Eventi non rilevati

1. Verifica che il sito abbia dataLayer: `console.log(window.dataLayer)`
2. Controlla nomenclatura eventi (case insensitive)
3. Ricarica pagina dopo installazione estensione
4. Controlla console content script per errori

### Review Chrome Web Store rifiutata

Motivi comuni:
- Privacy policy mancante o non accessibile
- Permessi non giustificati
- Screenshot mancanti o non chiari
- Descrizione insufficiente
- Violazione Limited Use policy

Soluzione: Leggi email di rifiuto, correggi problemi, re-submit.

---

## COSTI STIMATI

### Railway (Backend)
- **Tier Gratuito**: $5 credito/mese
- **Stima uso**: $0-3/mese (sufficiente per 100k+ richieste)
- **Upgrade Hobby**: $5/mese (se necessario)

### Chrome Web Store
- **Registrazione**: $5 una tantum
- **Hosting estensione**: Gratuito

### Totale
- **Setup iniziale**: $5 (Chrome Developer)
- **Mensile**: $0-3 (Railway tier gratuito)

---

## CHECKLIST FINALE

Prima di considerare il deploy completo:

**Backend:**
- [ ] Codice pushato su GitHub
- [ ] Deploy Railway completato
- [ ] Variabili d'ambiente configurate
- [ ] Health check funzionante
- [ ] Test endpoint `/api/v1/audit-results` OK
- [ ] Logs Railway puliti (no errori)

**Estensione:**
- [ ] URL API aggiornato in `background.js`
- [ ] API key configurata
- [ ] Icone generate (4 dimensioni)
- [ ] Test locale completato
- [ ] Eventi rilevati correttamente
- [ ] Invio dati backend verificato
- [ ] Privacy policy pubblicata online

**Chrome Web Store:**
- [ ] Account Developer registrato ($5 pagati)
- [ ] ZIP estensione creato
- [ ] Screenshot preparati (3-5)
- [ ] Store listing compilato
- [ ] Privacy policy linkata
- [ ] Dichiarazione Limited Use completata
- [ ] Submit per review inviato

---

## SUPPORTO

Per problemi o domande:
- **Email**: support@innexdata.com
- **GitHub Issues**: https://github.com/Instilla-AI/innexbot/issues
- **Railway Docs**: https://docs.railway.app
- **Chrome Extension Docs**: https://developer.chrome.com/docs/extensions

---

**Buon deploy! 🚀**
