// Content Script - Monitors dataLayer and communicates with popup
console.log('[InnexBot] Content script loaded');

// DataLayer monitoring
let dataLayerEvents = [];
let dataLayerObserver = null;

// Initialize dataLayer monitoring
function initDataLayerMonitoring() {
  // Check if dataLayer exists
  if (!window.dataLayer) {
    console.log('[InnexBot] dataLayer not found, will retry...');
    
    // Retry dopo 2 secondi (alcuni siti caricano GTM in ritardo)
    setTimeout(() => {
      if (window.dataLayer) {
        console.log('[InnexBot] dataLayer found on retry');
        initDataLayerMonitoring();
      } else {
        console.log('[InnexBot] dataLayer still not found, creating empty array');
        window.dataLayer = [];
      }
    }, 2000);
    
    return;
  }

  // Store initial dataLayer state con timestamp
  dataLayerEvents = window.dataLayer.map(event => ({
    ...event,
    _timestamp: event._timestamp || new Date().toISOString()
  }));
  
  console.log(`[InnexBot] DataLayer initialized with ${dataLayerEvents.length} existing events`);
  
  // Log primi 5 eventi per debug
  if (dataLayerEvents.length > 0) {
    console.log('[InnexBot] First 5 events:', dataLayerEvents.slice(0, 5).map(e => 
      e.event || e.eventName || e.eventType || 'unknown'
    ));
  }

  // Monitor dataLayer changes
  const originalPush = window.dataLayer.push;
  window.dataLayer.push = function(...args) {
    // Store new events
    args.forEach(event => {
      const timestampedEvent = {
        ...event,
        _timestamp: new Date().toISOString()
      };
      dataLayerEvents.push(timestampedEvent);
      
      console.log('[InnexBot] New dataLayer event:', event.event || event.eventName || 'unknown', event);
    });

    // Notify popup of new event
    chrome.runtime.sendMessage({
      type: 'DATALAYER_EVENT',
      event: args[0]
    }).catch(() => {
      // Popup might not be open, ignore error
    });

    return originalPush.apply(this, args);
  };

  console.log('[InnexBot] DataLayer monitoring initialized');
}

// Check dataLayer for specific event
function checkDataLayerForEvent(eventName) {
  console.log(`[InnexBot] Checking for event: ${eventName}`);
  console.log(`[InnexBot] DataLayer length: ${window.dataLayer ? window.dataLayer.length : 0}`);
  
  if (!window.dataLayer || window.dataLayer.length === 0) {
    return {
      found: false,
      data: null,
      timestamp: null,
      message: 'dataLayer is empty or not found'
    };
  }

  // Normalize event name for comparison (supporta varianti)
  const normalizedEventName = eventName.toLowerCase().trim();
  const eventVariants = generateEventVariants(normalizedEventName);
  
  console.log(`[InnexBot] Searching for variants:`, eventVariants);

  // Search in last 100 events (most recent first) - aumentato da 50 a 100
  const recentEvents = dataLayerEvents.slice(-100).reverse();
  
  console.log(`[InnexBot] Searching in ${recentEvents.length} recent events`);

  for (let i = 0; i < recentEvents.length; i++) {
    const event = recentEvents[i];
    if (!event || typeof event !== 'object') continue;

    // Check various event name fields
    const eventField = event.event || event.eventName || event.eventType || event.eventAction || '';
    const normalizedEventField = String(eventField).toLowerCase().trim();
    
    // Log primi 10 eventi per debug
    if (i < 10) {
      console.log(`[InnexBot] Event ${i}:`, normalizedEventField, event);
    }

    // Check if matches any variant
    if (eventVariants.includes(normalizedEventField)) {
      console.log(`[InnexBot] ✓ Event found:`, normalizedEventField);
      
      // Sanitize data (remove PII)
      const sanitizedData = sanitizeEventData(event);

      return {
        found: true,
        data: sanitizedData,
        timestamp: event._timestamp || new Date().toISOString(),
        message: `Event found in dataLayer as "${normalizedEventField}"`
      };
    }
  }

  console.log(`[InnexBot] ✗ Event NOT found. Last 5 events:`, 
    recentEvents.slice(0, 5).map(e => e.event || e.eventName || 'unknown'));

  return {
    found: false,
    data: null,
    timestamp: null,
    message: `Event "${eventName}" not found in last 100 dataLayer events`
  };
}

// Generate event name variants (supporta diverse nomenclature)
function generateEventVariants(eventName) {
  const variants = [eventName];
  
  // Aggiungi varianti comuni
  const withUnderscore = eventName.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
  const withoutUnderscore = eventName.replace(/_/g, '');
  const camelCase = eventName.replace(/_([a-z])/g, (m, p1) => p1.toUpperCase());
  const pascalCase = camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
  
  variants.push(withUnderscore);
  variants.push(withoutUnderscore);
  variants.push(camelCase);
  variants.push(pascalCase);
  
  // Varianti specifiche comuni
  const specificVariants = {
    'pageview': ['page_view', 'PageView', 'page-view', 'pageView'],
    'view_item': ['viewItem', 'ViewItem', 'view-item', 'product_view', 'productView'],
    'view_item_list': ['viewItemList', 'ViewItemList', 'view-item-list', 'product_list_view'],
    'add_to_cart': ['addToCart', 'AddToCart', 'add-to-cart', 'addtocart', 'cart_add'],
    'begin_checkout': ['beginCheckout', 'BeginCheckout', 'begin-checkout', 'checkout_start'],
    'purchase': ['Purchase', 'transaction', 'order_complete', 'orderComplete']
  };
  
  if (specificVariants[eventName]) {
    variants.push(...specificVariants[eventName]);
  }
  
  // Rimuovi duplicati e ritorna
  return [...new Set(variants)];
}

// Sanitize event data (remove PII and sensitive info)
function sanitizeEventData(data) {
  if (!data || typeof data !== 'object') return data;

  const sensitiveFields = [
    'email', 'phone', 'phoneNumber', 'telephone',
    'name', 'firstName', 'lastName', 'fullName',
    'address', 'streetAddress', 'postalCode', 'zipCode',
    'creditCard', 'cardNumber', 'cvv', 'ccv',
    'password', 'token', 'accessToken', 'apiKey',
    'userId', 'user_id', 'customerId', 'customer_id',
    'ipAddress', 'ip', 'ipAddr'
  ];

  const sanitized = {};

  for (const key in data) {
    // Skip sensitive fields
    if (sensitiveFields.some(field => 
      key.toLowerCase().includes(field.toLowerCase())
    )) {
      sanitized[key] = '[REDACTED]';
      continue;
    }

    // Recursively sanitize nested objects
    if (typeof data[key] === 'object' && data[key] !== null) {
      if (Array.isArray(data[key])) {
        sanitized[key] = data[key].map(item => 
          typeof item === 'object' ? sanitizeEventData(item) : item
        );
      } else {
        sanitized[key] = sanitizeEventData(data[key]);
      }
    } else {
      sanitized[key] = data[key];
    }
  }

  return sanitized;
}

// Detect page type
function detectPageType() {
  const url = window.location.href.toLowerCase();
  const pathname = window.location.pathname.toLowerCase();

  // Homepage
  if (pathname === '/' || pathname === '/index.html' || pathname === '/home') {
    return 'homepage';
  }

  // Product Detail Page (PDP)
  if (pathname.includes('/product') || pathname.includes('/item') || 
      pathname.includes('/p/') || pathname.includes('/pd/')) {
    return 'pdp';
  }

  // Product List Page (PLP) / Category
  if (pathname.includes('/category') || pathname.includes('/collection') || 
      pathname.includes('/shop') || pathname.includes('/products')) {
    return 'plp';
  }

  // Cart
  if (pathname.includes('/cart') || pathname.includes('/basket')) {
    return 'cart';
  }

  // Checkout
  if (pathname.includes('/checkout') || pathname.includes('/payment')) {
    return 'checkout';
  }

  // Order Confirmation
  if (pathname.includes('/confirmation') || pathname.includes('/thank-you') || 
      pathname.includes('/success') || pathname.includes('/order-complete')) {
    return 'confirmation';
  }

  return 'other';
}

// Get current dataLayer state
function getDataLayerState() {
  return {
    exists: !!window.dataLayer,
    length: window.dataLayer ? window.dataLayer.length : 0,
    recentEvents: dataLayerEvents.slice(-10).map(e => ({
      event: e.event || e.eventName || 'unknown',
      timestamp: e._timestamp || 'unknown'
    })),
    pageType: detectPageType()
  };
}

// Message listener from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[InnexBot] Message received:', request.type);

  switch (request.type) {
    case 'CHECK_EVENT':
      const result = checkDataLayerForEvent(request.eventName);
      sendResponse(result);
      break;

    case 'GET_DATALAYER_STATE':
      sendResponse(getDataLayerState());
      break;

    case 'GET_PAGE_TYPE':
      sendResponse({ pageType: detectPageType() });
      break;

    case 'CLEAR_EVENTS':
      dataLayerEvents = [];
      sendResponse({ success: true });
      break;

    default:
      sendResponse({ error: 'Unknown message type' });
  }

  return true; // Keep message channel open for async response
});

// Initialize on load
initDataLayerMonitoring();

// Notify popup that content script is ready
chrome.runtime.sendMessage({
  type: 'CONTENT_SCRIPT_READY',
  pageType: detectPageType()
}).catch(() => {
  // Popup might not be open, ignore error
});
