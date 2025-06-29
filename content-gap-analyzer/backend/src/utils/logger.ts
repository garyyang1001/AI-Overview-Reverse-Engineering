import winston from 'winston';

// Determine log level based on environment
const getLogLevel = () => {
  if (process.env.DEBUG === 'true' || process.env.DEBUG_LOGGING === 'true') {
    return 'debug';
  }
  return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
};

// Custom format for better readability
const customFormat = winston.format.printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}] ${message}`;
  
  // Add metadata if present
  if (Object.keys(metadata).length > 0) {
    // Filter out default metadata
    const { service, ...relevantMetadata } = metadata;
    if (Object.keys(relevantMetadata).length > 0) {
      msg += ` ${JSON.stringify(relevantMetadata, null, 2)}`;
    }
  }
  
  return msg;
});

const logger = winston.createLogger({
  level: getLogLevel(),
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    process.env.LOG_FORMAT === 'json' 
      ? winston.format.json()
      : customFormat
  ),
  defaultMeta: { service: 'content-gap-analyzer' },
  transports: [
    new winston.transports.Console({
      format: process.env.LOG_FORMAT === 'json'
        ? winston.format.json()
        : winston.format.combine(
            winston.format.colorize(),
            customFormat
          )
    })
  ]
});

// Add file transport in production
if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.File({ 
    filename: 'error.log', 
    level: 'error' 
  }));
  logger.add(new winston.transports.File({ 
    filename: 'combined.log' 
  }));
}

// Add debug file transport if debug logging is enabled
if (process.env.DEBUG === 'true' || process.env.DEBUG_LOGGING === 'true') {
  logger.add(new winston.transports.File({ 
    filename: 'debug.log',
    level: 'debug',
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
      winston.format.json()
    )
  }));
}

// Extend logger with conditional debug methods
const extendedLogger = Object.assign(logger, {
  // Log content flow for debugging "內容未提供" issues
  logContentFlow: (stage: string, data: any) => {
    if (process.env.DEBUG_CONTENT_FLOW === 'true' || process.env.DEBUG === 'true') {
      logger.debug(`[CONTENT_FLOW] ${stage}`, data);
    }
  },
  
  // Log performance metrics
  logPerformance: (operation: string, duration: number, metadata?: any) => {
    if (process.env.DEBUG_PERFORMANCE === 'true' || process.env.DEBUG === 'true') {
      logger.debug(`[PERFORMANCE] ${operation} took ${duration}ms`, metadata || {});
    }
  },
  
  // Log API calls and responses
  logApiCall: (service: string, endpoint: string, data: any) => {
    if (process.env.DEBUG_API === 'true' || process.env.DEBUG === 'true') {
      logger.debug(`[API_CALL] ${service} -> ${endpoint}`, data);
    }
  },
  
  // Log data quality issues
  logDataQuality: (source: string, issue: string, data: any) => {
    logger.warn(`[DATA_QUALITY] ${source}: ${issue}`, data);
  }
});

// Log startup configuration
logger.info('🚀 Logger initialized', {
  level: getLogLevel(),
  debugEnabled: process.env.DEBUG === 'true',
  debugContentFlow: process.env.DEBUG_CONTENT_FLOW === 'true',
  debugPerformance: process.env.DEBUG_PERFORMANCE === 'true',
  debugApi: process.env.DEBUG_API === 'true',
  logFormat: process.env.LOG_FORMAT || 'custom',
  nodeEnv: process.env.NODE_ENV
});

export default extendedLogger;