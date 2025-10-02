const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware Security
app.use(helmet());
app.use(express.json({ limit: '10mb' }));

// CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow Chrome extensions and configured origins
    if (!origin || origin.startsWith('chrome-extension://') || 
        process.env.ALLOWED_ORIGINS?.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-API-Key', 'X-Extension-ID']
};

app.use(cors(corsOptions));

// Rate Limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.MAX_REQUESTS_PER_WINDOW) || 10,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// In-memory storage (sostituire con DB in produzione)
const audits = [];
const stats = {
  totalAudits: 0,
  scoreSum: 0,
  scoreDistribution: {
    excellent: 0,  // 80%+
    good: 0,       // 60-79%
    fair: 0,       // 40-59%
    critical: 0    // <40%
  },
  eventFailures: {}
};

// Middleware: API Key Authentication
const authenticateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const expectedKey = process.env.API_KEY;

  if (!expectedKey) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  if (!apiKey || apiKey !== expectedKey) {
    return res.status(401).json({ error: 'Unauthorized: Invalid API Key' });
  }

  next();
};

// Middleware: Validate Extension ID
const validateExtensionId = (req, res, next) => {
  const extensionId = req.headers['x-extension-id'];
  
  if (!extensionId || extensionId.trim() === '') {
    return res.status(400).json({ error: 'Missing X-Extension-ID header' });
  }

  req.extensionId = extensionId;
  next();
};

// Middleware: Sanitize Data (blocca campi sensibili)
const sanitizeData = (req, res, next) => {
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

  const checkForForbiddenFields = (obj, path = '') => {
    for (const key in obj) {
      const currentPath = path ? `${path}.${key}` : key;
      
      // Check if key is forbidden
      if (forbiddenFields.some(forbidden => 
        key.toLowerCase().includes(forbidden.toLowerCase())
      )) {
        return { found: true, field: currentPath };
      }

      // Recursively check nested objects
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        const result = checkForForbiddenFields(obj[key], currentPath);
        if (result.found) return result;
      }
    }
    return { found: false };
  };

  const result = checkForForbiddenFields(req.body);
  
  if (result.found) {
    return res.status(400).json({ 
      error: 'Forbidden field detected',
      field: result.field,
      message: 'This endpoint does not accept personal or sensitive data'
    });
  }

  next();
};

// Middleware: Validate Audit Payload
const validateAuditPayload = (req, res, next) => {
  const { 
    timestamp, 
    extensionVersion, 
    score, 
    healthStatus, 
    eventsChecked,
    totalTests,
    successfulTests,
    failedTests,
    skippedTests
  } = req.body;

  // Required fields
  if (!timestamp || !extensionVersion || score === undefined || 
      !healthStatus || !eventsChecked || !Array.isArray(eventsChecked)) {
    return res.status(400).json({ 
      error: 'Missing required fields',
      required: ['timestamp', 'extensionVersion', 'score', 'healthStatus', 'eventsChecked']
    });
  }

  // Validate score range
  if (typeof score !== 'number' || score < 0 || score > 100) {
    return res.status(400).json({ 
      error: 'Invalid score',
      message: 'Score must be a number between 0 and 100'
    });
  }

  // Validate timestamp
  if (isNaN(Date.parse(timestamp))) {
    return res.status(400).json({ 
      error: 'Invalid timestamp',
      message: 'Timestamp must be a valid ISO-8601 date string'
    });
  }

  // Validate eventsChecked structure
  for (const event of eventsChecked) {
    if (!event.eventType || typeof event.found !== 'boolean' || 
        typeof event.weight !== 'number') {
      return res.status(400).json({ 
        error: 'Invalid eventsChecked structure',
        message: 'Each event must have eventType, found (boolean), and weight (number)'
      });
    }
  }

  // Validate test counts
  if (totalTests !== undefined && 
      (typeof totalTests !== 'number' || totalTests < 0)) {
    return res.status(400).json({ 
      error: 'Invalid totalTests',
      message: 'totalTests must be a non-negative number'
    });
  }

  next();
};

// Health Check Endpoint (Public)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// POST /api/v1/audit-results
app.post('/api/v1/audit-results', 
  limiter,
  authenticateApiKey,
  validateExtensionId,
  sanitizeData,
  validateAuditPayload,
  (req, res) => {
    try {
      const auditData = {
        id: uuidv4(),
        receivedAt: new Date().toISOString(),
        extensionId: req.extensionId,
        ...req.body
      };

      // Store audit
      audits.push(auditData);
      
      // Keep only last 1000 audits in memory
      if (audits.length > 1000) {
        audits.shift();
      }

      // Update statistics
      stats.totalAudits++;
      stats.scoreSum += auditData.score;

      // Update score distribution
      if (auditData.score >= 80) {
        stats.scoreDistribution.excellent++;
      } else if (auditData.score >= 60) {
        stats.scoreDistribution.good++;
      } else if (auditData.score >= 40) {
        stats.scoreDistribution.fair++;
      } else {
        stats.scoreDistribution.critical++;
      }

      // Track failed events
      auditData.eventsChecked.forEach(event => {
        if (!event.found) {
          stats.eventFailures[event.eventType] = 
            (stats.eventFailures[event.eventType] || 0) + 1;
        }
      });

      console.log(`[AUDIT RECEIVED] ID: ${auditData.id}, Score: ${auditData.score}%, Status: ${auditData.healthStatus}`);

      res.status(201).json({ 
        success: true,
        auditId: auditData.id,
        message: 'Audit results received successfully'
      });

    } catch (error) {
      console.error('[ERROR] Processing audit:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: 'Failed to process audit results'
      });
    }
  }
);

// GET /api/v1/stats (Authenticated)
app.get('/api/v1/stats', authenticateApiKey, (req, res) => {
  try {
    const averageScore = stats.totalAudits > 0 
      ? Math.round(stats.scoreSum / stats.totalAudits) 
      : 0;

    // Get top 5 most failed events
    const mostFailedEvents = Object.entries(stats.eventFailures)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([eventType, count]) => ({ eventType, failureCount: count }));

    res.json({
      totalAudits: stats.totalAudits,
      averageScore,
      scoreDistribution: {
        excellent: {
          count: stats.scoreDistribution.excellent,
          percentage: stats.totalAudits > 0 
            ? Math.round((stats.scoreDistribution.excellent / stats.totalAudits) * 100) 
            : 0
        },
        good: {
          count: stats.scoreDistribution.good,
          percentage: stats.totalAudits > 0 
            ? Math.round((stats.scoreDistribution.good / stats.totalAudits) * 100) 
            : 0
        },
        fair: {
          count: stats.scoreDistribution.fair,
          percentage: stats.totalAudits > 0 
            ? Math.round((stats.scoreDistribution.fair / stats.totalAudits) * 100) 
            : 0
        },
        critical: {
          count: stats.scoreDistribution.critical,
          percentage: stats.totalAudits > 0 
            ? Math.round((stats.scoreDistribution.critical / stats.totalAudits) * 100) 
            : 0
        }
      },
      mostFailedEvents
    });

  } catch (error) {
    console.error('[ERROR] Getting stats:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to retrieve statistics'
    });
  }
});

// GET /api/v1/audits (Authenticated) - Get recent audits
app.get('/api/v1/audits', authenticateApiKey, (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const recentAudits = audits.slice(-limit).reverse();

    res.json({
      count: recentAudits.length,
      audits: recentAudits
    });

  } catch (error) {
    console.error('[ERROR] Getting audits:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to retrieve audits'
    });
  }
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not found',
    message: 'The requested endpoint does not exist'
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  res.status(err.status || 500).json({ 
    error: err.message || 'Internal server error'
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`[SERVER] InnexBot API running on port ${PORT}`);
  console.log(`[SERVER] Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`[SERVER] Health check: http://localhost:${PORT}/health`);
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('[SERVER] SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('[SERVER] SIGINT received, shutting down gracefully');
  process.exit(0);
});
