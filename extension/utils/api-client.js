// API Client for InnexBot Extension

class APIClient {
  constructor(config) {
    this.baseURL = config.baseURL;
    this.apiKey = config.apiKey;
    this.extensionId = config.extensionId;
    this.timeout = config.timeout || 10000;
  }

  // Send audit results
  async sendAuditResults(data) {
    const sanitizedData = this.sanitizeData(data);
    return this.makeRequest('/api/v1/audit-results', {
      method: 'POST',
      body: JSON.stringify(sanitizedData)
    });
  }

  // Get statistics
  async getStats() {
    return this.makeRequest('/api/v1/stats', {
      method: 'GET'
    });
  }

  // Health check
  async healthCheck() {
    return this.makeRequest('/health', {
      method: 'GET',
      skipAuth: true
    });
  }

  // Make HTTP request with retry logic
  async makeRequest(endpoint, options = {}) {
    const maxRetries = options.maxRetries || 3;
    let lastError;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const headers = {
          'Content-Type': 'application/json',
          ...options.headers
        };

        // Add authentication headers
        if (!options.skipAuth) {
          headers['X-API-Key'] = this.apiKey;
          headers['X-Extension-ID'] = this.extensionId;
        }

        const response = await fetch(`${this.baseURL}${endpoint}`, {
          ...options,
          headers,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();

      } catch (error) {
        lastError = error;
        console.error(`[APIClient] Request failed (attempt ${attempt + 1}/${maxRetries}):`, error);

        // Don't retry if it's not a network error
        if (!this.shouldRetry(error)) {
          throw error;
        }

        // Wait before retrying (exponential backoff)
        if (attempt < maxRetries - 1) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  // Determine if error is retryable
  shouldRetry(error) {
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

  // Sanitize data (remove PII and sensitive info)
  sanitizeData(data) {
    if (!data || typeof data !== 'object') return data;

    const forbiddenFields = [
      'url', 'urls', 'pageUrl', 'currentUrl',
      'email', 'emails', 'userEmail',
      'userId', 'user_id', 'customerId',
      'ipAddress', 'ip', 'ipAddr',
      'name', 'firstName', 'lastName', 'fullName',
      'phone', 'phoneNumber', 'telephone',
      'address', 'streetAddress', 'postalCode',
      'creditCard', 'cardNumber', 'cvv',
      'password', 'token', 'accessToken'
    ];

    const sanitized = {};

    for (const key in data) {
      // Skip forbidden fields
      if (forbiddenFields.some(forbidden => 
        key.toLowerCase().includes(forbidden.toLowerCase())
      )) {
        continue;
      }

      // Recursively sanitize nested objects
      if (typeof data[key] === 'object' && data[key] !== null) {
        if (Array.isArray(data[key])) {
          sanitized[key] = data[key].map(item => 
            typeof item === 'object' ? this.sanitizeData(item) : item
          );
        } else {
          sanitized[key] = this.sanitizeData(data[key]);
        }
      } else {
        sanitized[key] = data[key];
      }
    }

    return sanitized;
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = APIClient;
}
