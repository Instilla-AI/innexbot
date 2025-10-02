// Validators for InnexBot Extension

const Validators = {
  // Validate event configuration
  isValidEventConfig(event) {
    return (
      event &&
      typeof event === 'object' &&
      typeof event.eventType === 'string' &&
      event.eventType.trim() !== '' &&
      typeof event.weight === 'number' &&
      event.weight >= 0 &&
      event.weight <= 100 &&
      typeof event.category === 'string' &&
      typeof event.instruction === 'string'
    );
  },

  // Validate audit configuration array
  isValidAuditConfig(config) {
    if (!Array.isArray(config) || config.length === 0) {
      return false;
    }

    // Check if all events are valid
    return config.every(event => this.isValidEventConfig(event));
  },

  // Validate weights sum to 100
  weightsSum(config) {
    if (!Array.isArray(config)) return 0;
    return config.reduce((sum, event) => sum + (event.weight || 0), 0);
  },

  // Validate audit results
  isValidAuditResults(results) {
    return (
      results &&
      typeof results === 'object' &&
      typeof results.score === 'number' &&
      results.score >= 0 &&
      results.score <= 100 &&
      typeof results.healthStatus === 'string' &&
      Array.isArray(results.eventsChecked) &&
      typeof results.totalTests === 'number' &&
      typeof results.successfulTests === 'number' &&
      typeof results.failedTests === 'number'
    );
  },

  // Validate API response
  isValidAPIResponse(response) {
    return (
      response &&
      typeof response === 'object' &&
      (response.success === true || response.error)
    );
  },

  // Sanitize event name
  sanitizeEventName(eventName) {
    if (typeof eventName !== 'string') return '';
    return eventName.trim().toLowerCase();
  },

  // Validate weight value
  isValidWeight(weight) {
    return (
      typeof weight === 'number' &&
      !isNaN(weight) &&
      weight >= 0 &&
      weight <= 100
    );
  },

  // Validate score
  isValidScore(score) {
    return (
      typeof score === 'number' &&
      !isNaN(score) &&
      score >= 0 &&
      score <= 100
    );
  },

  // Check if data contains PII
  containsPII(data) {
    if (!data || typeof data !== 'object') return false;

    const piiFields = [
      'email', 'phone', 'name', 'firstname', 'lastname',
      'address', 'creditcard', 'password', 'ssn',
      'userid', 'customerid', 'ipaddress'
    ];

    const checkObject = (obj) => {
      for (const key in obj) {
        const lowerKey = key.toLowerCase();
        
        // Check if key contains PII field name
        if (piiFields.some(pii => lowerKey.includes(pii))) {
          return true;
        }

        // Recursively check nested objects
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          if (checkObject(obj[key])) return true;
        }
      }
      return false;
    };

    return checkObject(data);
  }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Validators;
}
