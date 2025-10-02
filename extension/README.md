# InnexBot Chrome Extension

Chrome extension per audit guidato del tracking e-commerce con widget interattivo.

## Features

- ✅ Audit step-by-step guidato
- ✅ Verifica eventi dataLayer (PageView, view_item, add_to_cart, purchase, etc.)
- ✅ Sistema di scoring personalizzabile con pesi
- ✅ Report visuale con health status (Eccellente/Buono/Sufficiente/Critico)
- ✅ Privacy-first: solo dati anonimi
- ✅ Configurazione eventi personalizzabile
- ✅ Export risultati in JSON
- ✅ Integrazione backend API

## Installazione Locale (Sviluppo)

### 1. Prepara le Icone

Prima di installare, genera le icone richieste nella cartella `icons/`:
- icon16.png (16x16px)
- icon32.png (32x32px)
- icon48.png (48x48px)
- icon128.png (128x128px)

Vedi `icons/README.md` per istruzioni dettagliate.

### 2. Configura API Backend

Modifica `scripts/background.js` con l'URL del tuo backend Railway:

```javascript
const CONFIG = {
  API_BASE_URL: 'https://your-railway-app.up.railway.app',
  API_KEY: 'your_api_key_here',
  // ...
};
```

### 3. Carica in Chrome

1. Apri Chrome e vai su `chrome://extensions/`
2. Abilita "Modalità sviluppatore" (toggle in alto a destra)
3. Clicca "Carica estensione non pacchettizzata"
4. Seleziona la cartella `extension/`
5. L'estensione apparirà nella toolbar

## Utilizzo

### Avvio Audit

1. Clicca sull'icona InnexBot nella toolbar
2. Al primo avvio, accetta o rifiuta la condivisione dati anonimi
3. Segui le istruzioni step-by-step:
   - Visita la homepage → Clicca "Ho completato l'azione"
   - Naviga verso categoria → Clicca "Ho completato l'azione"
   - Apri pagina prodotto → Clicca "Ho completato l'azione"
   - Aggiungi al carrello → Clicca "Ho completato l'azione"
   - Inizia checkout → Clicca "Ho completato l'azione"
   - (Opzionale) Completa acquisto → Clicca "Ho completato l'azione"
4. Visualizza risultati finali con score e health status
5. Esporta report in JSON se necessario

### Configurazione

1. Clicca icona Settings (⚙️) nell'header
2. Modifica pesi per ogni evento (0-100%)
3. Abilita/disabilita condivisione dati anonimi
4. Salva configurazione

### Eventi Verificati (Default)

| Evento | Peso | Categoria | Descrizione |
|--------|------|-----------|-------------|
| pageview | 15% | navigation | Vista homepage |
| view_item_list | 20% | product | Vista categoria/PLP |
| view_item | 20% | product | Vista prodotto/PDP |
| add_to_cart | 25% | cart | Aggiunta carrello |
| begin_checkout | 15% | checkout | Inizio checkout |
| purchase | 5% | conversion | Acquisto completato |

## Struttura File

```
extension/
├── manifest.json           # Configurazione estensione
├── popup/
│   ├── popup.html         # UI principale
│   ├── popup.css          # Stili (palette InnexData)
│   └── popup.js           # Logica widget
├── scripts/
│   ├── background.js      # Service worker
│   └── content.js         # Monitoring dataLayer
├── utils/
│   ├── api-client.js      # Client API
│   ├── storage.js         # Gestione storage
│   ├── constants.js       # Costanti
│   └── validators.js      # Validatori
├── icons/
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── privacy/
    └── privacy-policy.html
```

## Permessi Chrome

- **activeTab**: Accesso al dataLayer della pagina corrente
- **scripting**: Iniezione content script
- **storage**: Salvataggio preferenze locali
- **host_permissions**: Accesso a tutti i siti web

## Privacy

### Dati Raccolti (se consenso dato):
- Risultati audit (eventi trovati/non trovati)
- Punteggi di valutazione
- Statistiche aggregate anonime

### Dati NON Raccolti:
- URL siti visitati
- Dati personali (email, nome, telefono)
- User ID o identificatori
- IP address
- Cronologia navigazione
- Contenuti pagine

Vedi `privacy/privacy-policy.html` per dettagli completi.

## Debugging

### Console Logs

Apri DevTools (F12) e controlla:
- **Popup**: Tasto destro su popup → Ispeziona
- **Background**: chrome://extensions/ → Dettagli → Ispeziona vista service worker
- **Content Script**: Console della pagina web

### Messaggi Comuni

```
[InnexBot] Content script loaded
[InnexBot] DataLayer monitoring initialized
[InnexBot] Checking for event: pageview
[InnexBot] Background service worker loaded
```

### Problemi Comuni

**dataLayer non trovato:**
- Verifica che il sito abbia Google Tag Manager o GA4
- Controlla nella console: `window.dataLayer`

**Errore comunicazione:**
- Ricarica la pagina web
- Ricarica l'estensione da chrome://extensions/

**Eventi non rilevati:**
- Verifica nomenclatura eventi (case insensitive)
- Controlla che l'evento sia effettivamente pushato nel dataLayer
- Alcuni eventi potrebbero usare nomi diversi (es: "page_view" vs "pageview")

## Build per Produzione

### 1. Prepara File

```bash
# Rimuovi file di sviluppo
rm -rf .git
rm -rf node_modules
rm README.md
```

### 2. Aggiorna Configurazione

- Verifica URL API backend in `scripts/background.js`
- Verifica API key corretta
- Controlla che tutte le icone siano presenti

### 3. Crea ZIP

```bash
# Da cartella parent
cd ..
zip -r innexbot-extension.zip extension/ -x "*.git*" "*.DS_Store" "*node_modules*"
```

### 4. Test Finale

1. Installa da ZIP in Chrome
2. Testa tutti gli step dell'audit
3. Verifica invio dati al backend
4. Controlla export JSON
5. Testa configurazione eventi

## Deploy su Chrome Web Store

### Requisiti

1. Account Chrome Developer ($5 una tantum)
2. Icone in tutte le dimensioni
3. Screenshot dell'estensione (1280x800 o 640x400)
4. Privacy Policy pubblicata online
5. Descrizione dettagliata

### Procedura

1. Vai su [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Clicca "New Item"
3. Carica file ZIP
4. Compila informazioni:
   - Nome: InnexBot - E-commerce Tracking Audit
   - Descrizione breve: Verifica tracking e-commerce con audit guidati
   - Descrizione dettagliata: (vedi sotto)
   - Categoria: Developer Tools
   - Lingua: Italiano
5. Carica screenshot (minimo 1, massimo 5)
6. Aggiungi link Privacy Policy
7. Dichiara Limited Use compliance
8. Submit per review

### Descrizione Suggerita

```
InnexBot è uno strumento professionale per verificare l'implementazione del tracking e-commerce sui siti web.

CARATTERISTICHE:
✓ Audit guidato step-by-step
✓ Verifica eventi GA4/GTM (pageview, view_item, add_to_cart, purchase)
✓ Sistema di scoring personalizzabile
✓ Report visuale con health status
✓ Privacy-first: solo dati anonimi
✓ Export risultati in JSON

IDEALE PER:
- Digital Marketing Manager
- E-commerce Manager
- Web Analyst
- SEO Specialist
- Developer

PRIVACY:
InnexBot NON raccoglie URL, dati personali o PII. Solo statistiche anonime aggregate (con consenso).

CONFORMITÀ:
✓ GDPR compliant
✓ Chrome Web Store User Data Policy
✓ Limited Use requirements
```

### Review Time

- Prima review: 2-7 giorni
- Update successivi: 1-3 giorni

## Aggiornamenti

Per aggiornare l'estensione:

1. Incrementa versione in `manifest.json`
2. Crea nuovo ZIP
3. Carica su Chrome Web Store
4. Descrivi modifiche nel changelog
5. Submit per review

## Supporto

- **Email**: support@innexdata.com
- **Sito**: https://innexdata.com
- **GitHub**: https://github.com/Instilla-AI/innexbot

## License

MIT License - Vedi LICENSE file per dettagli.

## Credits

Sviluppato da InnexData
© 2025 InnexData. Tutti i diritti riservati.
