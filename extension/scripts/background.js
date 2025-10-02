// Background Service Worker
console.log('[InnexBot] Background service worker loaded');

// Configuration
const CONFIG = {
  API_BASE_URL: 'https://innexbot-api-production.up.railway.app', // Update after Railway deploy
  API_KEY: 'sk_live_your_api_key_here', // Update with your API key
  EXTENSION_ID: 'innexbot-v1',
  EXTENSION_VERSION: '1.0.0',
  RETRY_INTERVAL: 5 * 60 * 1000, // 5 minutes
  MAX_QUEUE_SIZE: 10
};

// Default audit configuration
const DEFAULT_AUDIT_CONFIG = [
  { eventType: 'pageview', weight: 15, category: 'navigation', instruction: 'Visita la homepage del sito' },
  { eventType: 'view_item_list', weight: 20, category: 'product', instruction: 'Naviga verso una pagina categoria/collezione' },
  { eventType: 'view_item', weight: 20, category: 'product', instruction: 'Apri una pagina prodotto' },
  { eventType: 'add_to_cart', weight: 25, category: 'cart', instruction: 'Aggiungi un prodotto al carrello' },
  { eventType: 'begin_checkout', weight: 15, category: 'checkout', instruction: 'Inizia il processo di checkout' },
  { eventType: 'purchase', weight: 5, category: 'conversion', instruction: 'Completa un acquisto (se possibile)' }
];

// Initialize extension on install
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[InnexBot] Extension installed:', details.reason);

  if (details.reason === 'install') {
    // Set default values
    await chrome.storage.local.set({
      dataSharing: null, // null = not decided yet
      auditConfig: DEFAULT_AUDIT_CONFIG,
      retryQueue: [],
      installDate: new Date().toISOString()
    });

    console.log('[InnexBot] Default configuration set');
  }

  if (details.reason === 'update') {
    console.log('[InnexBot] Extension updated to version', chrome.runtime.getManifest().version);
  }
});

// Message handler
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[InnexBot] Background received message:', request.type);

  switch (request.type) {
    case 'SEND_AUDIT_RESULTS':
      handleSendAuditResults(request.data)
        .then(result => sendResponse(result))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true; // Keep channel open for async

    case 'GET_CONFIG':
      chrome.storage.local.get(['auditConfig', 'dataSharing'])
        .then(data => sendResponse(data))
        .catch(error => sendResponse({ error: error.message }));
      return true;

    case 'UPDATE_CONFIG':
      chrome.storage.local.set(request.data)
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'GET_RETRY_QUEUE':
      chrome.storage.local.get(['retryQueue'])
        .then(data => sendResponse({ queue: data.retryQueue || [] }))
        .catch(error => sendResponse({ error: error.message }));
      return true;

    default:
      sendResponse({ error: 'Unknown message type' });
  }

  return true;
});

// Send audit results to API
async function handleSendAuditResults(auditData) {
  try {
    // Check if data sharing is enabled
    const { dataSharing } = await chrome.storage.local.get(['dataSharing']);
    
    if (dataSharing === false) {
      console.log('[InnexBot] Data sharing disabled, skipping API call');
      return { success: true, message: 'Data sharing disabled' };
    }

    // Sanitize data
    const sanitizedData = sanitizeAuditData(auditData);

    // Send to API
    const result = await sendToAPI(sanitizedData);

    // Update last sent timestamp
    await chrome.storage.local.set({
      lastAuditSent: new Date().toISOString()
    });

    return result;

  } catch (error) {
    console.error('[InnexBot] Error sending audit results:', error);

    // Add to retry queue
    await addToRetryQueue(auditData);

    return {
      success: false,
      error: error.message,
      queued: true
    };
  }
}

// Send data to API with retry logic
async function sendToAPI(data, retryCount = 0) {
  const MAX_RETRIES = 3;
  const TIMEOUT = 10000; // 10 seconds

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

    const response = await fetch(`${CONFIG.API_BASE_URL}/api/v1/audit-results`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': CONFIG.API_KEY,
        'X-Extension-ID': CONFIG.EXTENSION_ID
      },
      body: JSON.stringify(data),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const result = await response.json();
    console.log('[InnexBot] Audit sent successfully:', result.auditId);

    return {
      success: true,
      auditId: result.auditId,
      message: result.message
    };

  } catch (error) {
    console.error(`[InnexBot] API call failed (attempt ${retryCount + 1}):`, error);

    // Retry logic
    if (retryCount < MAX_RETRIES && shouldRetry(error)) {
      console.log(`[InnexBot] Retrying in ${(retryCount + 1) * 2} seconds...`);
      await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 2000));
      return sendToAPI(data, retryCount + 1);
    }

    throw error;
  }
}

// Determine if error is retryable
function shouldRetry(error) {
  const retryableErrors = [
    'Failed to fetch',
    'NetworkError',
    'TimeoutError',
    'AbortError',
    'HTTP 500',
    'HTTP 502',
    'HTTP 503',
    'HTTP 504'
  ];

  return retryableErrors.some(retryable => 
    error.message.includes(retryable)
  );
}

// Add failed audit to retry queue
async function addToRetryQueue(auditData) {
  try {
    const { retryQueue = [] } = await chrome.storage.local.get(['retryQueue']);

    // Add to queue (max 10 items)
    const newQueue = [...retryQueue, {
      data: auditData,
      timestamp: new Date().toISOString(),
      retries: 0
    }].slice(-CONFIG.MAX_QUEUE_SIZE);

    await chrome.storage.local.set({ retryQueue: newQueue });
    console.log('[InnexBot] Added to retry queue, size:', newQueue.length);

  } catch (error) {
    console.error('[InnexBot] Error adding to retry queue:', error);
  }
}

// Process retry queue
async function processRetryQueue() {
  try {
    const { retryQueue = [] } = await chrome.storage.local.get(['retryQueue']);

    if (retryQueue.length === 0) return;

    console.log('[InnexBot] Processing retry queue, size:', retryQueue.length);

    const successfulItems = [];

    for (const item of retryQueue) {
      try {
        const sanitizedData = sanitizeAuditData(item.data);
        await sendToAPI(sanitizedData);
        successfulItems.push(item);
        console.log('[InnexBot] Retry successful for item from', item.timestamp);
      } catch (error) {
        console.error('[InnexBot] Retry failed:', error);
        item.retries = (item.retries || 0) + 1;

        // Remove if too many retries
        if (item.retries >= 5) {
          successfulItems.push(item);
          console.log('[InnexBot] Removing item after 5 failed retries');
        }
      }
    }

    // Update queue (remove successful items)
    const newQueue = retryQueue.filter(item => !successfulItems.includes(item));
    await chrome.storage.local.set({ retryQueue: newQueue });

  } catch (error) {
    console.error('[InnexBot] Error processing retry queue:', error);
  }
}

// Sanitize audit data (remove sensitive fields)
function sanitizeAuditData(data) {
  const sanitized = { ...data };

  // Remove forbidden fields
  const forbiddenFields = [
    'url', 'urls', 'pageUrl', 'currentUrl',
    'email', 'userId', 'customerId', 'ipAddress'
  ];

  forbiddenFields.forEach(field => {
    delete sanitized[field];
  });

  // Sanitize eventsChecked
  if (sanitized.eventsChecked && Array.isArray(sanitized.eventsChecked)) {
    sanitized.eventsChecked = sanitized.eventsChecked.map(event => ({
      eventType: event.eventType,
      found: event.found,
      weight: event.weight,
      category: event.category
    }));
  }

  return sanitized;
}

// Health check API
async function healthCheck() {
  try {
    // Endpoint corretto: /health (non /api/health)
    const response = await fetch(`${CONFIG.API_BASE_URL.replace('/api', '')}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log('[InnexBot] ✓ API health check:', data.status);
    return data;

  } catch (error) {
    console.error('[InnexBot] ✗ Health check failed:', error);
    return null;
  }
}

// Periodic retry queue processing (every 5 minutes)
setInterval(() => {
  processRetryQueue();
}, CONFIG.RETRY_INTERVAL);

// Initial health check
healthCheck();

console.log('[InnexBot] Background service worker initialized');
