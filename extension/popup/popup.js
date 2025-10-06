// InnexBot Popup - Main Widget Interface
// Using Vanilla JS with React-like patterns (no external dependencies)

// State Management
const state = {
  auditId: null, // Unique ID for this audit session
  currentStep: 0,
  auditConfig: [],
  results: [],
  dataSharing: null,
  showPrivacyModal: false,
  showConfigPanel: false,
  isChecking: false,
  auditComplete: false,
  currentUrl: null, // Track current site URL
  dataLayerWarning: false, // Warning if dataLayer not found
  isShopify: false, // Is site on Shopify
  shopifyInfo: null, // Shopify detection details
  ctaSettings: null // CTA settings from backend
};

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
  console.log('[InnexBot] 🚀 Popup inizializzato');
  
  await loadConfiguration();
  await loadAuditSession();
  await checkDataLayerStatus();
  
  if (state.dataSharing === null) {
    state.showPrivacyModal = true;
  }
  
  render();
  
  const root = document.getElementById('root');
  
  root.addEventListener('click', async (e) => {
    const button = e.target.closest('button');
    
    if (!button) return;
    
    console.log('[InnexBot] 🎯 Button clicked:', button.id);
    
    // Previeni click multipli durante il processing
    if (state.isChecking) {
      console.log('[InnexBot] ⚠️ Already checking, ignoring click');
      return;
    }
    
    switch (button.id) {
      case 'checkEventBtn':
        // NON usare await - lascia che l'handler gestisca tutto
        // Il .catch() previene che errori asincroni blocchino l'event listener
        handleCheckEvent().catch(err => {
          console.error('[InnexBot] ❌ Error in handleCheckEvent:', err);
          state.isChecking = false;
          render();
        });
        break;
        
      case 'skipBtn':
        handleSkipEvent().catch(err => {
          console.error('[InnexBot] ❌ Error in handleSkipEvent:', err);
          state.isChecking = false;
          render();
        });
        break;
    }
  });
  
  console.log('[InnexBot] ✅ Event listeners attached');
});

// Check dataLayer status on current page
async function checkDataLayerStatus() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: 'GET_DATALAYER_STATE'
    });
    
    if (response) {
      // Mostra warning solo se manca sia dataLayer che GTM/GA4
      if (!response.exists && !response.hasTracking) {
        console.warn('[InnexBot] ⚠️ Tracking non rilevato su questa pagina');
        state.dataLayerWarning = true;
      } else {
        console.log('[InnexBot] ✓ Tracking rilevato:', {
          dataLayer: response.exists,
          GTM: response.hasGTM,
          GA4: response.hasGA4,
          eventi: response.length
        });
        state.dataLayerWarning = false;
      }
      
      // Salva info Shopify
      if (response.isShopify) {
        state.isShopify = true;
        state.shopifyInfo = {
          method: response.shopifyMethod,
          shop: response.shopifyShop
        };
        console.log('[InnexBot] 🛍️ Shopify rilevato:', state.shopifyInfo);
      } else {
        state.isShopify = false;
        state.shopifyInfo = null;
      }
    }
  } catch (error) {
    console.error('[InnexBot] Error checking dataLayer:', error);
    // Non mostrare warning se c'è un errore di comunicazione
    state.dataLayerWarning = false;
  }
}

// Load configuration from storage
async function loadConfiguration() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_CONFIG' });
    
    if (response.auditConfig) {
      state.auditConfig = response.auditConfig;
    } else {
      // Use default config
      state.auditConfig = getDefaultConfig();
    }
    
    state.dataSharing = response.dataSharing;
    
    // Carica CTA settings
    const ctaResult = await chrome.storage.local.get(['ctaSettings']);
    if (ctaResult.ctaSettings) {
      state.ctaSettings = ctaResult.ctaSettings;
      console.log('[InnexBot] CTA settings loaded:', state.ctaSettings);
    }
    
  } catch (error) {
    console.error('[InnexBot] Error loading config:', error);
    state.auditConfig = getDefaultConfig();
  }
}

// Load saved audit session
async function loadAuditSession() {
  try {
    // Get current tab URL
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Estrai dominio base (senza www)
    const currentDomain = extractBaseDomain(tab.url);
    
    // Usa auditSession invece di currentAudit (nome aggiornato)
    const result = await chrome.storage.local.get(['auditSession']);
    
    if (result.auditSession) {
      const session = result.auditSession;
      
      // Verifica se il sito è cambiato (confronta domini base)
      if (session.domain && session.domain !== currentDomain) {
        console.log(`[InnexBot] Sito cambiato da ${session.domain} a ${currentDomain}, reset audit`);
        await clearAuditSession();
        state.currentUrl = currentDomain;
        state.auditId = generateAuditId(); // Genera nuovo ID
        return;
      }
      
      console.log('[InnexBot] Sessione audit ripristinata:', session);
      console.log('[InnexBot] Step corrente:', session.currentStep, 'Risultati:', session.results?.length);
      
      state.auditId = session.auditId || generateAuditId(); // Usa ID esistente o genera nuovo
      state.currentStep = session.currentStep || 0;
      state.results = session.results || [];
      state.auditComplete = session.auditComplete || false;
      state.currentUrl = session.domain;
      
      // Verifica che la sessione non sia troppo vecchia (max 24 ore)
      const sessionAge = Date.now() - new Date(session.timestamp).getTime();
      if (sessionAge > 24 * 60 * 60 * 1000) {
        console.log('[InnexBot] Sessione scaduta (>24h), reset audit');
        await clearAuditSession();
        state.auditId = generateAuditId(); // Genera nuovo ID
      }
    } else {
      state.currentUrl = currentDomain;
      state.auditId = generateAuditId(); // Genera nuovo ID per nuovo audit
      console.log('[InnexBot] Nessuna sessione salvata, nuovo audit per:', currentDomain);
      console.log('[InnexBot] Nuovo auditId generato:', state.auditId);
    }
  } catch (error) {
    console.error('[InnexBot] Error loading audit session:', error);
  }
}

// Estrae dominio base (rimuove www e sottodomini comuni)
function extractBaseDomain(url) {
  try {
    const hostname = new URL(url).hostname;
    // Rimuovi www. se presente
    return hostname.replace(/^www\./, '');
  } catch (error) {
    console.error('[InnexBot] Error extracting domain:', error);
    return url;
  }
}

// Timeout utility to prevent deadlocks
function withTimeout(promise, ms = 1500) {
  return Promise.race([
    promise,
    new Promise(resolve => setTimeout(() => {
      console.warn(`[InnexBot] ⚠️ Operation timed out after ${ms}ms`);
      resolve();
    }, ms))
  ]);
}

// Generate unique audit ID
function generateAuditId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `audit_${timestamp}_${random}`;
}

// Save audit session (con gestione errori e timeout)
function saveAuditSession() {
  return new Promise((resolve) => {
    try {
      // Minimizza i dati per evitare quota limits
      const minimal = {
        auditId: state.auditId,
        currentStep: state.currentStep,
        auditComplete: state.auditComplete,
        domain: state.currentUrl,
        timestamp: new Date().toISOString(),
        results: state.results.map(r => ({
          eventType: r.eventType,
          found: !!r.found,
          weight: r.weight ?? 0,
          timestamp: r.timestamp ?? Date.now()
        }))
      };

      chrome.storage.local.set({ auditSession: minimal }, () => {
        if (chrome.runtime.lastError) {
          console.warn('[InnexBot] ⚠️ Storage error:', chrome.runtime.lastError);
          // ⚠️ Risolvi comunque per evitare deadlock
          return resolve();
        }
        
        console.log('[InnexBot] ✓ Sessione salvata:', {
          auditId: state.auditId,
          domain: state.currentUrl,
          step: state.currentStep,
          results: state.results.length,
          complete: state.auditComplete
        });
        
        resolve();
      });
    } catch (error) {
      console.error('[InnexBot] Error saving audit session:', error);
      // Risolvi comunque per non bloccare il flusso
      resolve();
    }
  });
}

// Clear audit session
async function clearAuditSession() {
  try {
    await chrome.storage.local.remove(['auditSession']);
    state.auditId = generateAuditId(); // Genera nuovo ID
    state.currentStep = 0;
    state.results = [];
    state.auditComplete = false;
    console.log('[InnexBot] Sessione resettata, nuovo auditId:', state.auditId);
  } catch (error) {
    console.error('[InnexBot] Error clearing audit session:', error);
  }
}

// Get default configuration
function getDefaultConfig() {
  return [
    { eventType: 'pageview', weight: 15, category: 'navigation', instruction: 'Visita la homepage del sito' },
    { eventType: 'view_item_list', weight: 20, category: 'product', instruction: 'Naviga verso una pagina categoria/collezione' },
    { eventType: 'view_item', weight: 20, category: 'product', instruction: 'Apri una pagina prodotto' },
    { eventType: 'add_to_cart', weight: 25, category: 'cart', instruction: 'Aggiungi un prodotto al carrello' },
    { eventType: 'begin_checkout', weight: 15, category: 'checkout', instruction: 'Inizia il processo di checkout' },
    { eventType: 'purchase', weight: 5, category: 'conversion', instruction: 'Completa un acquisto (se possibile)' }
  ];
}

// Main render function
function render() {
  console.log('[InnexBot] 🎨 Rendering UI...');
  
  const root = document.getElementById('root');
  if (!root) {
    console.error('[InnexBot] ❌ Root element not found!');
    return;
  }
  
  if (state.showConfigPanel) {
    root.innerHTML = renderConfigPanel();
    attachConfigPanelListeners();
  } else {
    root.innerHTML = renderMainUI();
    attachMainUIListeners();
  }
  
  // Render privacy modal if needed
  if (state.showPrivacyModal) {
    renderPrivacyModal();
  }
  
  console.log('[InnexBot] ✅ UI rendered');
}

// Render main UI
function renderMainUI() {
  const currentEvent = state.auditConfig[state.currentStep];
  const progress = (state.currentStep / state.auditConfig.length) * 100;
  
  return `
    ${renderHeader()}
    ${!state.auditComplete ? renderProgress(progress) : ''}
    <div class="content">
      ${state.auditComplete ? renderResults() : renderAuditStep(currentEvent)}
    </div>
  `;
}

// Render header
function renderHeader() {
  return `
    <div class="header">
      <div class="header-left">
        <div class="logo"><img src="../icons/icon48.png" alt="InnexBot" style="width: 100%; height: 100%; object-fit: contain;"></div>
        <div>
          <div class="header-title">InnexBot</div>
          <div class="header-subtitle">Tracking Audit</div>
        </div>
      </div>
      <div style="display: flex; gap: 8px;">
        ${!state.auditComplete ? `
          <button class="settings-btn" id="resetBtn" title="Reset Audit">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
              <path d="M21 3v5h-5"></path>
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
              <path d="M3 21v-5h5"></path>
            </svg>
          </button>
        ` : ''}
        <button class="settings-btn" id="settingsBtn" title="Impostazioni">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M12 1v6m0 6v6m-6-6h6m6 0h-6"></path>
          </svg>
        </button>
      </div>
    </div>
  `;
}

// Render progress bar
function renderProgress(progress) {
  return `
    <div class="progress-container">
      <div class="progress-text">
        <span>Step ${state.currentStep + 1} di ${state.auditConfig.length}</span>
        <span>${Math.round(progress)}%</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${progress}%"></div>
      </div>
    </div>
  `;
}

// Render audit step
function renderAuditStep(event) {
  if (!event) return '<div class="message"><div class="message-content">Configurazione non valida</div></div>';
  
  const lastResult = state.results[state.currentStep - 1];
  
  return `
    <div class="message">
      <div class="message-avatar"><img src="../icons/icon48.png" alt="InnexBot" style="width: 100%; height: 100%; object-fit: contain; border-radius: 8px;"></div>
      <div class="message-content">
        <div class="message-text">
          ${state.currentStep === 0 ? 
            'Benvenuto! Iniziamo l\'audit del tracking e-commerce. Seguirò passo dopo passo per verificare gli eventi.' : 
            'Perfetto! Passiamo al prossimo evento da verificare.'
          }
        </div>
        
        ${state.dataLayerWarning && state.currentStep === 0 ? `
          <div style="font-size: 12px; color: #f59e0b; margin-top: 8px; padding: 8px; background: #fffbeb; border-radius: 6px; border-left: 3px solid #f59e0b;">
            ⚠️ <strong>Attenzione:</strong> DataLayer non rilevato su questa pagina. Questo sito potrebbe non utilizzare Google Tag Manager o GA4. Gli eventi non verranno trovati.
          </div>
        ` : ''}
        
        ${lastResult ? renderLastResult(lastResult) : ''}
        
        <div class="step-instruction">
          <div class="step-text">
            <span class="step-number">${state.currentStep + 1}</span>
            ${event.instruction}
          </div>
        </div>
        
        <div class="message-text mt-3">
          <strong>Evento da verificare:</strong> <code>${event.eventType}</code>
        </div>
        
        <div style="font-size: 12px; color: #6b7280; margin-top: 8px; padding: 8px; background: #f9fafb; border-radius: 6px;">
          💡 <strong>Tip:</strong> Dopo aver completato l'azione, clicca il pulsante. La sessione viene salvata automaticamente.
        </div>
        
        <div class="btn-group">
          <button class="btn btn-primary" id="checkEventBtn" ${state.isChecking ? 'disabled' : ''}>
            ${state.isChecking ? '<span class="spinner"></span>' : '✓'} Ho completato l'azione
          </button>
          <button class="btn btn-skip" id="skipBtn" ${state.isChecking ? 'disabled' : ''}>
            Salta
          </button>
        </div>
      </div>
    </div>
  `;
}

// Render last result
function renderLastResult(result) {
  return `
    <div class="status-indicator ${result.found ? 'status-success' : 'status-error'}">
      ${result.found ? '✓' : '✗'} ${result.eventType}: ${result.found ? 'Trovato' : 'Non trovato'}
    </div>
  `;
}

// Render results summary
function renderResults() {
  const score = calculateScore();
  const healthStatus = getHealthStatus(score);
  const successCount = state.results.filter(r => r.found).length;
  const failedCount = state.results.filter(r => !r.found && !r.skipped).length;
  const skippedCount = state.results.filter(r => r.skipped).length;
  
  return `
    <div class="message">
      <div class="message-avatar"><img src="../icons/icon48.png" alt="InnexBot" style="width: 100%; height: 100%; object-fit: contain; border-radius: 8px;"></div>
      <div class="message-content">
        <div class="message-text">
          <strong>Audit completato!</strong> Ecco i risultati del tuo tracking e-commerce.
        </div>
        
        <div class="results-summary">
          <div class="score-display">
            <div class="score-circle health-${healthStatus.class}">
              <div class="score-value">${score}%</div>
              <div class="score-label">Score</div>
            </div>
            <div class="health-status health-${healthStatus.class}">
              ${healthStatus.label}
            </div>
          </div>
          
          <div class="event-results">
            <div class="event-item">
              <span class="event-name">Eventi verificati</span>
              <span class="event-status">${state.results.length}</span>
            </div>
            <div class="event-item">
              <span class="event-name">✓ Trovati</span>
              <span class="event-status" style="color: #10b981">${successCount}</span>
            </div>
            <div class="event-item">
              <span class="event-name">✗ Non trovati</span>
              <span class="event-status" style="color: #ef4444">${failedCount}</span>
            </div>
            ${skippedCount > 0 ? `
              <div class="event-item">
                <span class="event-name">⊘ Saltati</span>
                <span class="event-status" style="color: #6b7280">${skippedCount}</span>
              </div>
            ` : ''}
          </div>
          
          <div class="mt-3">
            <details>
              <summary style="cursor: pointer; font-size: 13px; font-weight: 500; color: #2C5F8D;">
                Dettagli eventi
              </summary>
              <div class="mt-2">
                ${state.results.map(r => `
                  <div class="event-item">
                    <span class="event-name">${r.eventType}</span>
                    <span class="event-status ${r.found ? 'status-success' : r.skipped ? 'status-pending' : 'status-error'}">
                      ${r.found ? '✓ Trovato' : r.skipped ? '⊘ Saltato' : '✗ Non trovato'}
                    </span>
                  </div>
                `).join('')}
              </div>
            </details>
          </div>
        </div>
        
        ${renderDynamicCTA(score)}
        
        <div class="btn-group">
          <button class="btn btn-primary" id="exportBtn">
            📥 Esporta JSON
          </button>
          <button class="btn btn-secondary" id="restartBtn">
            🔄 Nuovo Audit
          </button>
        </div>
      </div>
    </div>
  `;
}

// Render dynamic CTA based on score and platform
function renderDynamicCTA(score) {
  // Se non ci sono settings, non mostrare CTA
  if (!state.ctaSettings) return '';
  
  const threshold = state.ctaSettings.scoreThreshold || 70;
  
  // Mostra CTA solo se score è sotto la soglia
  if (score >= threshold) return '';
  
  // CTA per Shopify
  if (state.isShopify) {
    const message = state.ctaSettings.shopify.message.replace(
      '{coupon}', 
      state.ctaSettings.shopify.couponCode
    );
    
    return `
      <div style="margin-top: 16px; padding: 16px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; color: white;">
        <div style="font-size: 14px; font-weight: 600; margin-bottom: 8px;">
          🛍️ Migliora il tuo Tracking Shopify
        </div>
        <div style="font-size: 12px; line-height: 1.5; margin-bottom: 12px;">
          ${message}
        </div>
        <button class="btn" id="shopifyCTABtn" style="background: white; color: #667eea; width: 100%; font-weight: 600;">
          Scarica InnexData Gratis
        </button>
      </div>
    `;
  }
  
  // CTA per non-Shopify
  const message = state.ctaSettings.nonShopify.message;
  const link = state.ctaSettings.nonShopify.link;
  
  return `
    <div style="margin-top: 16px; padding: 16px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 8px; color: white;">
      <div style="font-size: 14px; font-weight: 600; margin-bottom: 8px;">
        📊 Ottimizza il Tuo Tracking
      </div>
      <div style="font-size: 12px; line-height: 1.5; margin-bottom: 12px;">
        ${message}
      </div>
      <button class="btn" id="contactCTABtn" data-link="${link}" style="background: white; color: #f5576c; width: 100%; font-weight: 600;">
        Contattaci Ora
      </button>
    </div>
  `;
}

// Render configuration panel (solo privacy)
function renderConfigPanel() {
  return `
    ${renderHeader()}
    <div class="config-panel">
      <div class="config-section">
        <div class="config-title">⚙️ Impostazioni</div>
        
        <div class="config-item">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div class="config-item-name">🔒 Condivisione dati anonimi</div>
              <div style="font-size: 11px; color: #6b7280; margin-top: 4px;">
                Aiutaci a migliorare il servizio condividendo statistiche anonime
              </div>
            </div>
            <label class="toggle">
              <input type="checkbox" id="dataSharingToggle" ${state.dataSharing ? 'checked' : ''}>
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>
        
        <div style="font-size: 11px; color: #6b7280; margin-top: 12px; padding: 8px; background: #f3f4f6; border-radius: 4px;">
          <strong>ℹ️ Nota:</strong> La configurazione degli eventi viene gestita centralmente dal dashboard.
          Le modifiche si sincronizzano automaticamente con l'estensione.
        </div>
      </div>
      
      <div class="btn-group">
        <button class="btn btn-primary" id="saveConfigBtn">
          💾 Salva
        </button>
        <button class="btn btn-secondary" id="closeConfigBtn">
          ← Indietro
        </button>
      </div>
    </div>
  `;
}

// Render privacy modal
function renderPrivacyModal() {
  const modalHTML = `
    <div class="modal-overlay" id="privacyModal">
      <div class="modal">
        <div class="modal-title">🔒 Privacy e Condivisione Dati</div>
        
        <div class="modal-text">
          InnexBot raccoglie solo dati anonimi aggregati per migliorare il servizio.
        </div>
        
        <div class="modal-text font-bold">✓ Cosa viene condiviso:</div>
        <ul class="modal-list">
          <li>Risultati audit (punteggi, eventi trovati/mancanti)</li>
          <li>Statistiche aggregate anonime</li>
          <li>Dati tecnici sull'estensione</li>
        </ul>
        
        <div class="modal-text font-bold">✗ Cosa NON viene condiviso:</div>
        <ul class="modal-list negative">
          <li>URL dei siti visitati</li>
          <li>Dati personali (email, nome, telefono)</li>
          <li>Cronologia di navigazione</li>
          <li>Contenuti delle pagine</li>
        </ul>
        
        <div class="modal-text text-xs" style="color: #6b7280;">
          Puoi modificare questa preferenza in qualsiasi momento dalle impostazioni.
        </div>
        
        <div class="modal-actions">
          <button class="btn btn-primary" id="acceptPrivacyBtn">
            Accetta
          </button>
          <button class="btn btn-secondary" id="declinePrivacyBtn">
            Rifiuta
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  attachPrivacyModalListeners();
}

// Attach main UI listeners
function attachMainUIListeners() {
  const settingsBtn = document.getElementById('settingsBtn');
  const resetBtn = document.getElementById('resetBtn');
  const checkEventBtn = document.getElementById('checkEventBtn');
  const skipBtn = document.getElementById('skipBtn');
  const exportBtn = document.getElementById('exportBtn');
  const restartBtn = document.getElementById('restartBtn');
  const shopifyCTABtn = document.getElementById('shopifyCTABtn');
  const contactCTABtn = document.getElementById('contactCTABtn');
  
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      state.showConfigPanel = true;
      render();
    });
  }
  
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Vuoi davvero resettare l\'audit corrente? Tutti i progressi andranno persi.')) {
        handleRestart();
      }
    });
  }
  
  if (checkEventBtn) {
    checkEventBtn.addEventListener('click', async () => {
      await handleCheckEvent();
    });
  }
  
  if (skipBtn) {
    skipBtn.addEventListener('click', async () => {
      await handleSkipEvent();
    });
  }
  
  if (exportBtn) {
    exportBtn.addEventListener('click', handleExport);
  }
  
  if (restartBtn) {
    restartBtn.addEventListener('click', handleRestart);
  }
  
  // CTA buttons
  if (shopifyCTABtn) {
    shopifyCTABtn.addEventListener('click', () => {
      chrome.tabs.create({ url: 'https://innexdata.com/shopify' });
    });
  }
  
  if (contactCTABtn) {
    contactCTABtn.addEventListener('click', () => {
      const link = contactCTABtn.dataset.link || 'https://innexdata.com/contatti';
      chrome.tabs.create({ url: link });
    });
  }
}

// Attach config panel listeners
function attachConfigPanelListeners() {
  const saveBtn = document.getElementById('saveConfigBtn');
  const closeBtn = document.getElementById('closeConfigBtn');
  const dataSharingToggle = document.getElementById('dataSharingToggle');
  
  if (saveBtn) {
    saveBtn.addEventListener('click', handleSaveConfig);
  }
  
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      state.showConfigPanel = false;
      render();
    });
  }
  
  if (dataSharingToggle) {
    dataSharingToggle.addEventListener('change', (e) => {
      state.dataSharing = e.target.checked;
    });
  }
}

// Attach privacy modal listeners
function attachPrivacyModalListeners() {
  const acceptBtn = document.getElementById('acceptPrivacyBtn');
  const declineBtn = document.getElementById('declinePrivacyBtn');
  
  if (acceptBtn) {
    acceptBtn.addEventListener('click', async () => {
      state.dataSharing = true;
      await saveDataSharingPreference(true);
      closePrivacyModal();
    });
  }
  
  if (declineBtn) {
    declineBtn.addEventListener('click', async () => {
      state.dataSharing = false;
      await saveDataSharingPreference(false);
      closePrivacyModal();
    });
  }
}

// Close privacy modal
function closePrivacyModal() {
  const modal = document.getElementById('privacyModal');
  if (modal) {
    modal.remove();
  }
  state.showPrivacyModal = false;
}

// Handle check event
async function handleCheckEvent() {
  console.log('🔥🔥🔥 handleCheckEvent CALLED! 🔥🔥🔥');
  console.log('Current step:', state.currentStep);
  console.log('Total steps:', state.auditConfig.length);

  if (state.isChecking) {
    console.log('Already checking, returning...');
    return;
  }

  state.isChecking = true;
  render();

  const currentEvent = state.auditConfig[state.currentStep];
  let stepResult = null;

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const response = await sendMessageWithTimeout(tab.id, {
      type: 'CHECK_EVENT',
      eventName: currentEvent.eventType
    }, 8000); // timeout un po' più alto

    stepResult = {
      eventType: currentEvent.eventType,
      found: !!response?.found,
      weight: currentEvent.weight,
      category: currentEvent.category,
      timestamp: response?.timestamp || new Date().toISOString(),
      skipped: false,
      data: response?.data,
      message: response?.message || ''
    };
  } catch (err) {
    console.warn('[InnexBot] CHECK_EVENT failed, treating as not found:', err?.message || err);
    // Registra comunque lo step, così il flow avanza e può completare
    stepResult = {
      eventType: currentEvent.eventType,
      found: false,
      weight: currentEvent.weight,
      category: currentEvent.category,
      timestamp: new Date().toISOString(),
      skipped: false,
      data: null,
      message: 'Error: ' + (err?.message || 'channel closed')
    };
  } finally {
    if (stepResult) {
      try {
        state.results.push(stepResult);
        // Non permettere che lo storage blocchi il flow
        await Promise.race([
          saveAuditSession(),
          new Promise(res => setTimeout(res, 1500))
        ]);
      } catch (e) {
        console.warn('[InnexBot] saveAuditSession failed (ignored):', e);
      }

      console.log('[InnexBot] Current step:', state.currentStep, 'Total steps:', state.auditConfig.length);
      if (state.currentStep < state.auditConfig.length - 1) {
        console.log('[InnexBot] Moving to next step...');
        state.currentStep++;
        try {
          await Promise.race([
            saveAuditSession(),
            new Promise(res => setTimeout(res, 1500))
          ]);
        } catch {}
      } else {
        console.log('[InnexBot] Last step completed, calling completeAudit()...');
        try {
          await completeAudit();
        } catch (e) {
          console.error('[InnexBot] completeAudit failed:', e);
        }
      }
    }

    state.isChecking = false;
    render();
    console.log('[InnexBot] Current state:', state);
  }
}

// Invia messaggio con timeout
function sendMessageWithTimeout(tabId, message, timeout = 8000) {
  console.log(`[InnexBot] 📡 sendMessageWithTimeout started (timeout: ${timeout}ms)`);
  
  return new Promise((resolve, reject) => {
    let resolved = false;
    
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        console.log('[InnexBot] ⏰ Message timeout');
        reject(new Error('Message timeout'));
      }
    }, timeout);

    chrome.tabs.sendMessage(tabId, message)
      .then(response => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          console.log('[InnexBot] ✅ Message response received');
          resolve(response);
        }
      })
      .catch(error => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          
          // Gestisci errori comuni di Chrome Extension
          const errorMsg = error.message || String(error);
          
          // CRITICO: Questi errori NON devono bloccare l'audit
          if (errorMsg.includes('message channel closed') || 
              errorMsg.includes('receiving end does not exist') ||
              errorMsg.includes('message port closed')) {
            
            console.warn('[InnexBot] ⚠️ Message channel error (trattato come not found):', errorMsg);
            
            // Tratta come "evento non trovato" invece di errore fatale
            resolve({ 
              found: false, 
              error: 'channel_error',
              details: errorMsg 
            });
          } else {
            // Altri errori vengono rigettati normalmente
            console.error('[InnexBot] ❌ Message error:', errorMsg);
            reject(error);
          }
        }
      });
  });
}

// Handle skip event
async function handleSkipEvent() {
  const currentEvent = state.auditConfig[state.currentStep];
  
  state.results.push({
    eventType: currentEvent.eventType,
    found: false,
    weight: currentEvent.weight,
    category: currentEvent.category,
    timestamp: new Date().toISOString(),
    skipped: true
  });
  
  // Salva sessione dopo skip
  await saveAuditSession();
  
  if (state.currentStep < state.auditConfig.length - 1) {
    state.currentStep++;
  } else {
    await completeAudit();
  }
  
  render();
}

// Complete audit
async function completeAudit() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎊 completeAudit() STARTED');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  state.auditComplete = true;
  console.log('[InnexBot] ✅ Audit marked as complete');
  
  // Usa withTimeout per evitare deadlock
  await withTimeout(saveAuditSession(), 1500);
  console.log('[InnexBot] 💾 Final session saved');
  
  // Prepara dati per l'invio
  const auditData = {
    auditId: state.auditId,
    results: state.results,
    completedAt: new Date().toISOString()
  };
  
  console.log('[InnexBot] 📦 Audit data prepared:', auditData);
  
  let retries = 3;
  let lastError = null;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[InnexBot] 📤 Sending audit results (attempt ${attempt}/${retries})...`);
      
      await sendAuditResults();
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ AUDIT INVIATO CON SUCCESSO!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      // Successo! Esci dal loop
      return;
      
    } catch (error) {
      lastError = error;
      console.error(`[InnexBot] ❌ Attempt ${attempt} failed:`, error.message);
      
      if (attempt < retries) {
        const delay = attempt * 1000; // 1s, 2s, 3s
        console.log(`[InnexBot] ⏳ Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // Tutti i tentativi falliti
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('❌ INVIO AUDIT FALLITO DOPO', retries, 'TENTATIVI');
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('Last error:', lastError);
  
  // Salva lo stato di errore
  state.sendError = lastError.message;
  await saveAuditSession();
}

// Send audit results to backend
async function sendAuditResults() {
  try {
    const score = calculateScore();
    const healthStatus = getHealthStatus(score);
    
    const auditData = {
      auditId: state.auditId, // ✅ Include auditId
      timestamp: new Date().toISOString(),
      extensionVersion: '1.2.0',
      score: score,
      healthStatus: healthStatus.label,
      eventsChecked: state.results,
      totalTests: state.results.length,
      successfulTests: state.results.filter(r => r.found).length,
      failedTests: state.results.filter(r => !r.found && !r.skipped).length,
      skippedTests: state.results.filter(r => r.skipped).length,
      isShopify: state.isShopify, // ✅ Include Shopify info
      shopifyInfo: state.shopifyInfo
    };
    
    console.log('[InnexBot] 📤 Sending audit to background:', auditData);
    
    const response = await chrome.runtime.sendMessage({
      type: 'SEND_AUDIT_RESULTS',
      data: auditData
    });
    
    console.log('[InnexBot] 📥 Response from background:', response);
    
    // ✅ Check response status
    if (!response?.ok) {
      throw new Error(response?.error || 'Send failed');
    }
    
    console.log('[InnexBot] ✅ Audit sent successfully:', response?.result);
    
  } catch (error) {
    console.error('[InnexBot] ❌ Error sending audit results:', error);
    throw error; // Re-throw per gestione in completeAudit()
  }
}

// Calculate score
function calculateScore() {
  let totalWeight = 0;
  let achievedWeight = 0;
  
  state.results.forEach(result => {
    if (!result.skipped) {
      totalWeight += result.weight;
      if (result.found) {
        achievedWeight += result.weight;
      }
    }
  });
  
  return totalWeight > 0 ? Math.round((achievedWeight / totalWeight) * 100) : 0;
}

// Get health status
function getHealthStatus(score) {
  if (score >= 80) return { label: 'Eccellente', class: 'excellent' };
  if (score >= 60) return { label: 'Buono', class: 'good' };
  if (score >= 40) return { label: 'Sufficiente', class: 'fair' };
  return { label: 'Critico', class: 'critical' };
}

// Handle export
function handleExport() {
  const score = calculateScore();
  const healthStatus = getHealthStatus(score);
  
  const exportData = {
    timestamp: new Date().toISOString(),
    extensionVersion: '1.0.0',
    score: score,
    healthStatus: healthStatus.label,
    results: state.results,
    summary: {
      totalTests: state.results.length,
      successfulTests: state.results.filter(r => r.found).length,
      failedTests: state.results.filter(r => !r.found && !r.skipped).length,
      skippedTests: state.results.filter(r => r.skipped).length
    }
  };
  
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `innexbot-audit-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// Handle restart
async function handleRestart() {
  state.auditId = generateAuditId(); // Genera nuovo ID per nuovo audit
  state.currentStep = 0;
  state.results = [];
  state.auditComplete = false;
  
  console.log('[InnexBot] Audit riavviato, nuovo auditId:', state.auditId);
  
  // Pulisci sessione salvata
  await clearAuditSession();
  
  render();
}

// Handle save config (solo privacy)
async function handleSaveConfig() {
  try {
    await chrome.runtime.sendMessage({
      type: 'UPDATE_CONFIG',
      data: {
        dataSharing: state.dataSharing
      }
    });
    
    alert('Impostazioni salvate con successo!');
    state.showConfigPanel = false;
    render();
    
  } catch (error) {
    console.error('[InnexBot] Error saving config:', error);
    alert('Errore nel salvataggio delle impostazioni');
  }
}

// Save data sharing preference
async function saveDataSharingPreference(enabled) {
  try {
    await chrome.runtime.sendMessage({
      type: 'UPDATE_CONFIG',
      data: { dataSharing: enabled }
    });
  } catch (error) {
    console.error('[InnexBot] Error saving data sharing preference:', error);
  }
}
