// Storage utility for Chrome extension

const StorageManager = {
  // Get data from chrome.storage.local
  async get(keys) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(keys, (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(result);
        }
      });
    });
  },

  // Set data in chrome.storage.local
  async set(data) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set(data, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  },

  // Remove data from chrome.storage.local
  async remove(keys) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.remove(keys, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  },

  // Clear all data
  async clear() {
    return new Promise((resolve, reject) => {
      chrome.storage.local.clear(() => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  },

  // Get data sharing preference
  async getDataSharing() {
    const result = await this.get(['dataSharing']);
    return result.dataSharing;
  },

  // Set data sharing preference
  async setDataSharing(enabled) {
    await this.set({ dataSharing: enabled });
  },

  // Get audit configuration
  async getAuditConfig() {
    const result = await this.get(['auditConfig']);
    return result.auditConfig || [];
  },

  // Set audit configuration
  async setAuditConfig(config) {
    await this.set({ auditConfig: config });
  },

  // Get retry queue
  async getRetryQueue() {
    const result = await this.get(['retryQueue']);
    return result.retryQueue || [];
  },

  // Set retry queue
  async setRetryQueue(queue) {
    await this.set({ retryQueue: queue });
  },

  // Get last audit sent timestamp
  async getLastAuditSent() {
    const result = await this.get(['lastAuditSent']);
    return result.lastAuditSent;
  },

  // Get install date
  async getInstallDate() {
    const result = await this.get(['installDate']);
    return result.installDate;
  }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StorageManager;
}
