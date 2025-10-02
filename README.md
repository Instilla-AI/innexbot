# InnexBot - E-commerce Tracking Audit Extension

Chrome extension per audit guidato del tracking e-commerce con backend API su Railway.

## Struttura Progetto

```
innexbot/
├── backend/          # API Node.js/Express
└── extension/        # Chrome Extension
```

## Quick Start

### Backend (Railway)
```bash
cd backend
npm install
npm start
```

### Extension (Chrome)
1. Apri Chrome → `chrome://extensions/`
2. Abilita "Modalità sviluppatore"
3. Clicca "Carica estensione non pacchettizzata"
4. Seleziona la cartella `extension/`

## Deploy

### Backend su Railway
```bash
cd backend
railway login
railway init
railway up
```

### Extension su Chrome Web Store
1. Crea ZIP della cartella `extension/`
2. Carica su Chrome Developer Dashboard
3. Attendi review (2-3 giorni)

## Features

- ✅ Audit guidato step-by-step
- ✅ Verifica eventi dataLayer (PageView, view_item, add_to_cart, etc.)
- ✅ Sistema di scoring personalizzabile
- ✅ Report visuale con health status
- ✅ Privacy-first (dati anonimi)
- ✅ Backend API con Railway

## License

MIT
