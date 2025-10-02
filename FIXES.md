# InnexBot - Correzioni Implementate

## ✅ Problema 1: Persistenza Sessione tra Pagine

### Problema Originale
L'utente cambiava pagina durante il wizard e perdeva tutti i progressi dell'audit.

### Soluzione Implementata

**1. Sistema di Salvataggio Automatico**
- Ogni step completato viene salvato in `chrome.storage.local`
- Ogni skip viene salvato
- Sessione persiste anche se l'utente chiude e riapre il popup

**2. Ripristino Automatico**
- Al caricamento del popup, verifica se esiste una sessione salvata
- Ripristina automaticamente: `currentStep`, `results`, `auditComplete`
- Timeout sessione: 1 ora (dopo viene resettata automaticamente)

**3. Funzioni Aggiunte**
```javascript
// Carica sessione salvata all'avvio
await loadAuditSession();

// Salva dopo ogni step
await saveAuditSession();

// Pulisce sessione al restart
await clearAuditSession();
```

**4. Storage Structure**
```javascript
{
  currentAudit: {
    currentStep: 2,
    results: [...],
    auditComplete: false,
    timestamp: "2025-10-02T12:00:00Z"
  }
}
```

### Benefici
- ✅ L'utente può cambiare pagina senza perdere progressi
- ✅ Può chiudere e riaprire il popup
- ✅ Sessione scade dopo 1 ora (evita dati obsoleti)
- ✅ Reset manuale disponibile con "Nuovo Audit"

---

## ✅ Problema 2: Lettura DataLayer Migliorata

### Problema Originale
Gli eventi presenti nel dataLayer non venivano rilevati correttamente a causa di nomenclature diverse.

### Soluzione Implementata

**1. Supporto Varianti Nomenclatura**
Ora supporta tutte queste varianti per ogni evento:
- `pageview` → `page_view`, `PageView`, `page-view`, `pageView`
- `view_item` → `viewItem`, `ViewItem`, `product_view`, `productView`
- `add_to_cart` → `addToCart`, `AddToCart`, `addtocart`, `cart_add`
- E così via per tutti gli eventi

**2. Ricerca Estesa**
- Cerca negli ultimi **100 eventi** (prima erano 50)
- Controlla campi multipli: `event`, `eventName`, `eventType`, `eventAction`
- Logging dettagliato per debug

**3. Retry Automatico DataLayer**
- Se dataLayer non esiste al caricamento, retry dopo 2 secondi
- Supporta siti che caricano GTM in ritardo
- Cattura eventi già presenti all'inizializzazione

**4. Logging Avanzato**
```javascript
console.log('[InnexBot] DataLayer length: 45');
console.log('[InnexBot] Searching for variants:', ['pageview', 'page_view', ...]);
console.log('[InnexBot] Event 0: pageview', {...});
console.log('[InnexBot] ✓ Event found: pageview');
```

**5. Funzione generateEventVariants()**
Genera automaticamente tutte le possibili varianti di un nome evento:
- snake_case → camelCase
- camelCase → PascalCase
- Con/senza underscore
- Con/senza trattini
- Varianti specifiche per evento

### Benefici
- ✅ Rileva eventi con qualsiasi nomenclatura
- ✅ Supporta GA4, GTM, Adobe Analytics, Facebook Pixel
- ✅ Debug facilitato con logging dettagliato
- ✅ Retry automatico per siti lenti

---

## 🧪 Come Testare

### Test Persistenza Sessione

1. Installa estensione in Chrome
2. Vai su un sito e-commerce
3. Avvia audit e completa 2-3 step
4. **Cambia pagina** (es: da homepage a categoria)
5. Riapri il popup → Dovresti vedere i progressi salvati
6. Continua l'audit dalla pagina nuova

### Test Lettura DataLayer

1. Apri DevTools (F12) → Console
2. Verifica dataLayer: `console.log(window.dataLayer)`
3. Avvia audit
4. Clicca "Ho completato l'azione"
5. Controlla console per vedere:
   ```
   [InnexBot] Checking for event: pageview
   [InnexBot] DataLayer length: 45
   [InnexBot] Searching for variants: ['pageview', 'page_view', ...]
   [InnexBot] ✓ Event found: pageview
   ```

### Debug Avanzato

**Popup Console:**
- Tasto destro su popup → Ispeziona
- Vai su Console
- Cerca messaggi `[InnexBot]`

**Content Script Console:**
- Console della pagina web (F12)
- Cerca messaggi `[InnexBot]`
- Vedi tutti gli eventi rilevati in tempo reale

**Background Service Worker:**
- `chrome://extensions/` → InnexBot → "Ispeziona vista service worker"
- Vedi comunicazioni tra popup e content script

---

## 📋 Checklist Verifica

Prima di usare l'estensione:

- [ ] Icone generate e salvate in `extension/icons/`
- [ ] URL API configurato in `scripts/background.js`
- [ ] API key configurata in `scripts/background.js`
- [ ] Estensione caricata in Chrome (modalità sviluppatore)
- [ ] Test su sito con dataLayer funzionante

---

## 🔍 Troubleshooting

### Eventi non rilevati

**Verifica dataLayer:**
```javascript
// Nella console della pagina
console.log(window.dataLayer);
// Dovrebbe mostrare array con eventi
```

**Verifica nomenclatura:**
```javascript
// Controlla come sono chiamati gli eventi
window.dataLayer.forEach(e => console.log(e.event || e.eventName));
```

**Soluzione:**
- Se gli eventi usano nomi diversi, aggiungili in `generateEventVariants()`
- Oppure modifica la configurazione eventi nel pannello Settings

### Sessione non persiste

**Verifica storage:**
```javascript
// Nella console del popup
chrome.storage.local.get(['currentAudit'], (result) => {
  console.log('Sessione salvata:', result);
});
```

**Soluzione:**
- Verifica che il permesso `storage` sia presente in `manifest.json`
- Controlla console per errori di salvataggio

---

## 🚀 Prossimi Step

1. **Ricarica estensione** in Chrome: `chrome://extensions/` → Ricarica
2. **Test completo** su sito e-commerce reale
3. **Verifica logs** in tutte e 3 le console (popup, content, background)
4. **Deploy backend** su Railway se non ancora fatto
5. **Test invio dati** al backend

---

## 📊 Miglioramenti Implementati

| Feature | Prima | Dopo |
|---------|-------|------|
| Persistenza sessione | ❌ Nessuna | ✅ Auto-save ogni step |
| Eventi ricercati | 50 | 100 |
| Varianti evento | 1 | 10+ per evento |
| Retry dataLayer | ❌ No | ✅ Dopo 2 secondi |
| Logging debug | Minimo | Dettagliato |
| Timeout sessione | ❌ Infinito | ✅ 1 ora |

---

**Status: Correzioni Complete ✅**

L'estensione ora:
- Mantiene la sessione tra cambio pagine
- Rileva correttamente eventi con qualsiasi nomenclatura
- Fornisce logging dettagliato per debug
- Gestisce edge cases (dataLayer lento, eventi con nomi diversi)
