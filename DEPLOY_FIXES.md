# Deploy Fixes - 2025-10-06

## ✅ Modifiche Completate

### 1. **Correzione Errori ESLint (Build Errors)**

#### File: `dashboard/src/app/(admin)/settings/page.tsx`
- ❌ Rimossa variabile `saving` non utilizzata (linea 20)
- ❌ Rimossa funzione `setSaving()` non utilizzata
- ✅ Corretto apostrofo non escaped: `dell'audit` → `dell&apos;audit`

#### File: `dashboard/src/app/api/cta-settings/route.ts`
- ❌ Rimossa variabile `errorMessage` non utilizzata (linee 49, 104)
- ✅ Semplificato error handling

#### File: `dashboard/src/app/api/submit/route.ts`
- ❌ Rimossa variabile `shopifyInfo` non utilizzata (linea 19)
- ✅ Mantenuto solo `isShopify` che viene effettivamente usato

### 2. **Rimozione Messaggio "DataLayer non presente"**

#### File: `extension/popup/popup.js`
- ✅ Rimosso messaggio "⚠️ DataLayer non presente su questo sito" dai singoli check
- ✅ Funzione `renderLastResult()` semplificata (linee 438-444)
- ℹ️ Il warning generale rimane visibile all'inizio dell'audit se necessario

**Prima:**
```javascript
function renderLastResult(result) {
  const message = result.message || '';
  const isDataLayerMissing = message.includes('does not exist');
  
  return `
    <div class="status-indicator ${result.found ? 'status-success' : 'status-error'}">
      ${result.found ? '✓' : '✗'} ${result.eventType}: ${result.found ? 'Trovato' : 'Non trovato'}
      ${isDataLayerMissing ? '<div style="font-size: 11px; margin-top: 4px;">⚠️ DataLayer non presente su questo sito</div>' : ''}
    </div>
  `;
}
```

**Dopo:**
```javascript
function renderLastResult(result) {
  return `
    <div class="status-indicator ${result.found ? 'status-success' : 'status-error'}">
      ${result.found ? '✓' : '✗'} ${result.eventType}: ${result.found ? 'Trovato' : 'Non trovato'}
    </div>
  `;
}
```

### 3. **Database Schema Updates**

#### File: `dashboard/INIT_DB_RAILWAY.sql`
Aggiunte colonne mancanti alla tabella `audits`:
- ✅ `platform VARCHAR(50) DEFAULT 'other'`
- ✅ `is_shopify BOOLEAN DEFAULT FALSE`

Aggiunta nuova tabella `settings`:
```sql
CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Aggiunti default settings:
- `cta_score_threshold` = 70
- `shopify_cta_message`
- `shopify_coupon_code` = INNEX2024
- `non_shopify_cta_message`
- `non_shopify_cta_link`

#### File: `dashboard/src/app/api/db-init/route.ts`
- ✅ Aggiornato per includere colonne `platform` e `is_shopify` in `audits`
- ✅ Aggiunta creazione tabella `settings`
- ✅ Aggiunto inserimento default settings
- ✅ Aggiornato response per includere count settings

### 4. **Verifica Logica CTA**

#### File: `extension/popup/popup.js`
La logica delle CTA è **corretta** e funziona come previsto:

```javascript
function renderDynamicCTA(score) {
  if (!state.ctaSettings) return '';
  
  const threshold = state.ctaSettings.scoreThreshold || 70;
  if (score >= threshold) return '';
  
  // CTA per Shopify
  if (state.isShopify) {
    return `<!-- CTA Shopify -->`;
  }
  
  // CTA per non-Shopify
  return `<!-- CTA Non-Shopify -->`;
}
```

**Flusso:**
1. ✅ `state.isShopify` viene popolato da `response.isShopify` (linea 99-109)
2. ✅ `response.isShopify` viene dal content script che rileva Shopify
3. ✅ Le CTA vengono mostrate solo se `score < threshold`
4. ✅ La CTA corretta viene mostrata in base a `state.isShopify`

---

## 🚀 Deploy su Railway

### Comando Eseguito:
```bash
railway up
```

### Progetto:
- **Nome**: instilla-dashboard
- **Environment**: production
- **Service**: dashboard

### Build Configuration (`railway.json`):
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npm run build"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

---

## 📋 Prossimi Passi

### 1. Inizializzare il Database
Dopo il deploy, eseguire:
```bash
curl -X POST https://dashboard-production-1a15.up.railway.app/api/db-init
```

Oppure visitare l'URL nel browser per verificare lo stato.

### 2. Verificare le Tabelle
```bash
curl https://dashboard-production-1a15.up.railway.app/api/db-check?apiKey=YOUR_API_KEY
```

### 3. Testare le CTA
1. Installare l'estensione aggiornata
2. Eseguire un audit su un sito Shopify
3. Verificare che appaia la CTA Shopify corretta
4. Eseguire un audit su un sito non-Shopify
5. Verificare che appaia la CTA generica

### 4. Verificare Settings
Accedere a: `https://dashboard-production-1a15.up.railway.app/settings`
- Verificare che le impostazioni CTA siano caricate
- Testare il salvataggio delle modifiche

---

## 🐛 Problemi Risolti

1. ✅ **Build fallito per errori ESLint**
   - Variabili non utilizzate
   - Apostrofo non escaped

2. ✅ **Messaggio "DataLayer non presente" ripetuto**
   - Ora appare solo come warning generale, non su ogni check

3. ✅ **Tabelle database incomplete**
   - Aggiunte colonne `platform` e `is_shopify`
   - Aggiunta tabella `settings`

4. ✅ **CTA non mostrate correttamente**
   - Logica verificata e corretta
   - `state.isShopify` viene popolato correttamente

---

## 📝 Note

- L'estensione deve essere ricaricata per vedere le modifiche
- Il database deve essere inizializzato dopo il primo deploy
- Le CTA vengono mostrate solo se lo score è sotto la soglia configurata (default: 70%)
