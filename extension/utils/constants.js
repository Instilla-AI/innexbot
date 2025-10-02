// Constants for InnexBot Extension

const CONSTANTS = {
  // API Configuration
  API: {
    BASE_URL: 'https://innexbot-api-production.up.railway.app',
    KEY: 'sk_live_your_api_key_here',
    EXTENSION_ID: 'innexbot-v1',
    TIMEOUT: 10000
  },

  // Extension Info
  EXTENSION: {
    VERSION: '1.0.0',
    NAME: 'InnexBot - E-commerce Tracking Audit'
  },

  // Colors (InnexData Palette)
  COLORS: {
    PRIMARY_DARK: '#1B3B6F',
    PRIMARY_MEDIUM: '#2C5F8D',
    CTA_ORANGE: '#FF6B35',
    CTA_GOLD: '#F7931E',
    SUCCESS: '#10b981',
    ERROR: '#ef4444',
    WARNING: '#f59e0b',
    INFO: '#3b82f6'
  },

  // Health Status
  HEALTH_STATUS: {
    EXCELLENT: { min: 80, label: 'Eccellente', color: '#10b981' },
    GOOD: { min: 60, label: 'Buono', color: '#3b82f6' },
    FAIR: { min: 40, label: 'Sufficiente', color: '#f59e0b' },
    CRITICAL: { min: 0, label: 'Critico', color: '#ef4444' }
  },

  // Default Events Configuration
  DEFAULT_EVENTS: [
    {
      eventType: 'pageview',
      weight: 15,
      category: 'navigation',
      instruction: 'Visita la homepage del sito',
      pageType: 'homepage'
    },
    {
      eventType: 'view_item_list',
      weight: 20,
      category: 'product',
      instruction: 'Naviga verso una pagina categoria/collezione',
      pageType: 'plp'
    },
    {
      eventType: 'view_item',
      weight: 20,
      category: 'product',
      instruction: 'Apri una pagina prodotto',
      pageType: 'pdp'
    },
    {
      eventType: 'add_to_cart',
      weight: 25,
      category: 'cart',
      instruction: 'Aggiungi un prodotto al carrello',
      pageType: 'any'
    },
    {
      eventType: 'begin_checkout',
      weight: 15,
      category: 'checkout',
      instruction: 'Inizia il processo di checkout',
      pageType: 'checkout'
    },
    {
      eventType: 'purchase',
      weight: 5,
      category: 'conversion',
      instruction: 'Completa un acquisto (se possibile)',
      pageType: 'confirmation'
    }
  ],

  // Messages
  MESSAGES: {
    WELCOME: 'Benvenuto in InnexBot! Iniziamo l\'audit del tracking e-commerce.',
    PRIVACY_TITLE: 'Privacy e Condivisione Dati',
    PRIVACY_DESCRIPTION: 'InnexBot raccoglie solo dati anonimi aggregati per migliorare il servizio.',
    PRIVACY_SHARED: 'Cosa viene condiviso: risultati audit, punteggi, eventi trovati/mancanti (dati anonimi)',
    PRIVACY_NOT_SHARED: 'Cosa NON viene condiviso: URL visitati, dati personali, PII, cronologia navigazione',
    AUDIT_START: 'Audit avviato! Segui le istruzioni per ogni step.',
    AUDIT_COMPLETE: 'Audit completato! Ecco i risultati.',
    ERROR_GENERIC: 'Si è verificato un errore. Riprova.',
    ERROR_DATALAYER: 'dataLayer non trovato su questa pagina.',
    ERROR_API: 'Errore di connessione al server. I dati verranno inviati più tardi.'
  },

  // Storage Keys
  STORAGE_KEYS: {
    DATA_SHARING: 'dataSharing',
    AUDIT_CONFIG: 'auditConfig',
    RETRY_QUEUE: 'retryQueue',
    LAST_AUDIT_SENT: 'lastAuditSent',
    INSTALL_DATE: 'installDate',
    CURRENT_AUDIT: 'currentAudit'
  }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONSTANTS;
}
