# InnexBot - Quick Start Guide ⚡

Avvia il progetto in 10 minuti!

---

## 🎯 Step 1: Genera le Icone (2 minuti)

1. Apri `extension/icons/generate-icons.html` nel browser
2. Clicca "Genera Tutte le Icone"
3. Scarica le 4 icone (icon128.png, icon48.png, icon32.png, icon16.png)
4. Salva nella cartella `extension/icons/`

---

## 🚀 Step 2: Deploy Backend su Railway (5 minuti)

### Opzione A: Deploy Automatico da GitHub

```bash
# 1. Inizializza Git
cd C:\Users\ciopp\Desktop\innexbot
git init
git add .
git commit -m "Initial commit"

# 2. Crea repo GitHub (via web o CLI)
# Web: https://github.com/new → Nome: innexbot
# CLI: gh repo create innexbot --public --source=. --push

# 3. Push codice
git remote add origin https://github.com/Instilla-AI/innexbot.git
git push -u origin main
```

**Su Railway:**
1. Vai su https://railway.app
2. Login con GitHub
3. "New Project" → "Deploy from GitHub repo"
4. Seleziona `innexbot` → Seleziona cartella `backend`
5. Aggiungi variabili:
   - `API_KEY` = `sk_live_` + genera stringa casuale 32 caratteri
   - `NODE_ENV` = `production`
6. Attendi deploy (~2 minuti)
7. **Copia URL generato** (es: `https://innexbot-api-production.up.railway.app`)

### Opzione B: Deploy Diretto con CLI

```bash
# 1. Installa Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Deploy
cd backend
railway init
railway up

# 4. Configura variabili
railway variables set API_KEY=sk_live_abc123xyz789def456ghi012jkl345mno
railway variables set NODE_ENV=production

# 5. Ottieni URL
railway domain
```

**✅ Test Backend:**
```bash
curl https://your-railway-url.up.railway.app/health
# Deve ritornare: {"status":"healthy","version":"1.0.0",...}
```

---

## 🔧 Step 3: Configura Estensione (1 minuto)

Modifica `extension/scripts/background.js` (righe 5-8):

```javascript
const CONFIG = {
  API_BASE_URL: 'https://innexbot-api-production.up.railway.app', // ← TUO URL RAILWAY
  API_KEY: 'sk_live_abc123xyz789def456ghi012jkl345mno',           // ← TUA API KEY
  EXTENSION_ID: 'innexbot-v1',
  EXTENSION_VERSION: '1.0.0',
  // ...
};
```

---

## 🎨 Step 4: Installa Estensione in Chrome (1 minuto)

1. Apri Chrome → `chrome://extensions/`
2. Abilita "**Modalità sviluppatore**" (toggle in alto a destra)
3. Clicca "**Carica estensione non pacchettizzata**"
4. Seleziona cartella `C:\Users\ciopp\Desktop\innexbot\extension`
5. ✅ Estensione installata!

---

## ✨ Step 5: Test Completo (1 minuto)

1. Vai su un sito e-commerce (es: https://demo.vercel.store/)
2. Clicca icona **InnexBot** nella toolbar
3. Accetta privacy policy (primo avvio)
4. Clicca "**Ho completato l'azione**" per ogni step
5. Visualizza risultati finali con score

**Verifica invio dati:**
- Tasto destro su popup → Ispeziona → Console
- Cerca: `[InnexBot] Audit results sent`

**Verifica backend:**
```bash
railway logs
# Cerca: [AUDIT RECEIVED] ID: ..., Score: ...%
```

---

## 🎉 Fatto!

Ora hai:
- ✅ Backend API funzionante su Railway
- ✅ Estensione Chrome installata e configurata
- ✅ Sistema completo di tracking audit operativo

---

## 📋 Prossimi Passi

### Per Produzione:

1. **Icone Professionali**: Sostituisci placeholder con design definitivo
2. **Privacy Policy**: Pubblica online (es: innexdata.com/privacy-innexbot)
3. **Screenshot**: Cattura 3-5 screenshot dell'estensione
4. **Chrome Web Store**: Registra account ($5) e pubblica

Vedi `DEPLOY.md` per guida completa.

### Per Sviluppo:

**Modifica Backend:**
```bash
cd backend
# Modifica codice
git add .
git commit -m "Update: ..."
git push
# Railway fa auto-deploy in ~2 minuti
```

**Modifica Estensione:**
1. Modifica file in `extension/`
2. Vai su `chrome://extensions/`
3. Clicca icona "Ricarica" sull'estensione
4. Testa modifiche

---

## 🆘 Problemi Comuni

**Backend non risponde:**
```bash
railway logs
railway restart
```

**Estensione non trova eventi:**
- Verifica che il sito abbia `window.dataLayer`
- Ricarica pagina dopo installazione estensione

**Errore comunicazione:**
- Controlla URL e API key in `background.js`
- Verifica CORS nel backend (deve accettare `chrome-extension://*`)

---

## 📚 Documentazione

- **Deploy Completo**: `DEPLOY.md`
- **Backend API**: `backend/README.md`
- **Estensione**: `extension/README.md`
- **Privacy Policy**: `extension/privacy/privacy-policy.html`

---

## 💬 Supporto

- Email: support@innexdata.com
- GitHub: https://github.com/Instilla-AI/innexbot

---

**Buon lavoro! 🚀**
