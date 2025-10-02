// InnexBot Popup - Main Widget Interface
// Using Vanilla JS with React-like patterns (no external dependencies)

// State Management
const state = {
  currentStep: 0,
  auditConfig: [],
  results: [],
  dataSharing: null,
  showPrivacyModal: false,
  showConfigPanel: false,
  isChecking: false,
  auditComplete: false,
  currentUrl: null // Track current site URL
};

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
  console.log('[InnexBot] Popup loaded');
  
  // Load configuration
  await loadConfiguration();
  
  // Load saved audit session (if exists)
  await loadAuditSession();
  
  // Check if privacy consent is needed
  if (state.dataSharing === null) {
    state.showPrivacyModal = true;
  }
  
  // Render initial UI
  render();
});

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
    const currentDomain = new URL(tab.url).hostname;
    
    const result = await chrome.storage.local.get(['currentAudit']);
    
    if (result.currentAudit) {
      const session = result.currentAudit;
      
      // Verifica se il sito è cambiato
      if (session.domain && session.domain !== currentDomain) {
        console.log(`[InnexBot] Sito cambiato da ${session.domain} a ${currentDomain}, reset audit`);
        await clearAuditSession();
        state.currentUrl = currentDomain;
        return;
      }
      
      console.log('[InnexBot] Sessione audit ripristinata:', session);
      
      state.currentStep = session.currentStep || 0;
      state.results = session.results || [];
      state.auditComplete = session.auditComplete || false;
      state.currentUrl = session.domain;
      
      // Verifica che la sessione non sia troppo vecchia (max 1 ora)
      const sessionAge = Date.now() - new Date(session.timestamp).getTime();
      if (sessionAge > 60 * 60 * 1000) {
        console.log('[InnexBot] Sessione scaduta, reset audit');
        await clearAuditSession();
      }
    } else {
      state.currentUrl = currentDomain;
    }
  } catch (error) {
    console.error('[InnexBot] Error loading audit session:', error);
  }
}

// Save audit session
async function saveAuditSession() {
  try {
    await chrome.storage.local.set({
      currentAudit: {
        currentStep: state.currentStep,
        results: state.results,
        auditComplete: state.auditComplete,
        domain: state.currentUrl, // Salva dominio corrente
        timestamp: new Date().toISOString()
      }
    });
    console.log('[InnexBot] Sessione salvata per dominio:', state.currentUrl);
  } catch (error) {
    console.error('[InnexBot] Error saving audit session:', error);
  }
}

// Clear audit session
async function clearAuditSession() {
  try {
    await chrome.storage.local.remove(['currentAudit']);
    state.currentStep = 0;
    state.results = [];
    state.auditComplete = false;
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
  const root = document.getElementById('root');
  
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
        <div class="logo">IB</div>
        <div>
          <div class="header-title">InnexBot</div>
          <div class="header-subtitle">Tracking Audit</div>
        </div>
      </div>
      <button class="settings-btn" id="settingsBtn">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M12 1v6m0 6v6m-6-6h6m6 0h-6"></path>
        </svg>
      </button>
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
      <div class="message-avatar">IB</div>
      <div class="message-content">
        <div class="message-text">
          ${state.currentStep === 0 ? 
            'Benvenuto! Iniziamo l\'audit del tracking e-commerce. Seguirò passo dopo passo per verificare gli eventi.' : 
            'Perfetto! Passiamo al prossimo evento da verificare.'
          }
        </div>
        
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
      <div class="message-avatar">IB</div>
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

// Render configuration panel
function renderConfigPanel() {
  const totalWeight = state.auditConfig.reduce((sum, e) => sum + e.weight, 0);
  
  return `
    ${renderHeader()}
    <div class="config-panel">
      <div class="config-section">
        <div class="config-title">⚙️ Configurazione Eventi</div>
        <div style="font-size: 12px; color: #6b7280; margin-bottom: 12px;">
          Peso totale: <strong>${totalWeight}%</strong> ${totalWeight !== 100 ? '(dovrebbe essere 100%)' : '✓'}
        </div>
        
        ${state.auditConfig.map((event, index) => `
          <div class="config-item">
            <div class="config-item-header">
              <span class="config-item-name">${event.eventType}</span>
              <div class="config-weight">
                <input 
                  type="number" 
                  class="weight-input" 
                  data-index="${index}"
                  value="${event.weight}" 
                  min="0" 
                  max="100"
                />
                <span class="weight-label">%</span>
              </div>
            </div>
            <div style="font-size: 12px; color: #6b7280;">
              ${event.instruction}
            </div>
          </div>
        `).join('')}
      </div>
      
      <div class="config-section">
        <div class="config-title">🔒 Privacy</div>
        <div class="config-item">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div class="config-item-name">Condivisione dati anonimi</div>
              <div style="font-size: 11px; color: #6b7280; margin-top: 4px;">
                Aiutaci a migliorare il servizio
              </div>
            </div>
            <label class="toggle">
              <input type="checkbox" id="dataSharingToggle" ${state.dataSharing ? 'checked' : ''}>
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>
      
      <div class="btn-group">
        <button class="btn btn-primary" id="saveConfigBtn">
          💾 Salva Configurazione
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
  const checkEventBtn = document.getElementById('checkEventBtn');
  const skipBtn = document.getElementById('skipBtn');
  const exportBtn = document.getElementById('exportBtn');
  const restartBtn = document.getElementById('restartBtn');
  
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      state.showConfigPanel = true;
      render();
    });
  }
  
  if (checkEventBtn) {
    checkEventBtn.addEventListener('click', handleCheckEvent);
  }
  
  if (skipBtn) {
    skipBtn.addEventListener('click', handleSkipEvent);
  }
  
  if (exportBtn) {
    exportBtn.addEventListener('click', handleExport);
  }
  
  if (restartBtn) {
    restartBtn.addEventListener('click', handleRestart);
  }
}

// Attach config panel listeners
function attachConfigPanelListeners() {
  const saveBtn = document.getElementById('saveConfigBtn');
  const closeBtn = document.getElementById('closeConfigBtn');
  const dataSharingToggle = document.getElementById('dataSharingToggle');
  const weightInputs = document.querySelectorAll('.weight-input');
  
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
  
  weightInputs.forEach(input => {
    input.addEventListener('change', (e) => {
      const index = parseInt(e.target.dataset.index);
      const value = parseInt(e.target.value);
      
      if (value >= 0 && value <= 100) {
        state.auditConfig[index].weight = value;
      }
    });
  });
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
  if (state.isChecking) return;
  
  state.isChecking = true;
  render();
  
  const currentEvent = state.auditConfig[state.currentStep];
  
  try {
    // Get active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Send message to content script
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: 'CHECK_EVENT',
      eventName: currentEvent.eventType
    });
    
    // Store result
    state.results.push({
      eventType: currentEvent.eventType,
      found: response.found,
      weight: currentEvent.weight,
      category: currentEvent.category,
      timestamp: response.timestamp,
      skipped: false,
      data: response.data // Salva dati evento per debug
    });
    
    // Salva sessione dopo ogni step
    await saveAuditSession();
    
    // Move to next step or complete
    if (state.currentStep < state.auditConfig.length - 1) {
      state.currentStep++;
    } else {
      await completeAudit();
    }
    
  } catch (error) {
    console.error('[InnexBot] Error checking event:', error);
    alert('Errore: impossibile comunicare con la pagina. Ricarica la pagina e riprova.');
  }
  
  state.isChecking = false;
  render();
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
  state.auditComplete = true;
  
  // Send results to backend (if data sharing enabled)
  if (state.dataSharing) {
    await sendAuditResults();
  }
}

// Send audit results to backend
async function sendAuditResults() {
  try {
    const score = calculateScore();
    const healthStatus = getHealthStatus(score);
    
    const auditData = {
      timestamp: new Date().toISOString(),
      extensionVersion: '1.0.0',
      score: score,
      healthStatus: healthStatus.label,
      eventsChecked: state.results,
      totalTests: state.results.length,
      successfulTests: state.results.filter(r => r.found).length,
      failedTests: state.results.filter(r => !r.found && !r.skipped).length,
      skippedTests: state.results.filter(r => r.skipped).length
    };
    
    const response = await chrome.runtime.sendMessage({
      type: 'SEND_AUDIT_RESULTS',
      data: auditData
    });
    
    console.log('[InnexBot] Audit results sent:', response);
    
  } catch (error) {
    console.error('[InnexBot] Error sending audit results:', error);
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
  state.currentStep = 0;
  state.results = [];
  state.auditComplete = false;
  
  // Pulisci sessione salvata
  await clearAuditSession();
  
  render();
}

// Handle save config
async function handleSaveConfig() {
  try {
    await chrome.runtime.sendMessage({
      type: 'UPDATE_CONFIG',
      data: {
        auditConfig: state.auditConfig,
        dataSharing: state.dataSharing
      }
    });
    
    alert('Configurazione salvata con successo!');
    state.showConfigPanel = false;
    render();
    
  } catch (error) {
    console.error('[InnexBot] Error saving config:', error);
    alert('Errore nel salvataggio della configurazione');
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
