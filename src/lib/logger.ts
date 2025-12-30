/**
 * Simple logging utility for the TrackCrow application
 * Supports three levels: debug, info, error
 */

const isDevelopment = process.env.NODE_ENV === 'development';
const isDebugEnabled = process.env.LOG_LEVEL === 'debug' || isDevelopment;

function formatLog(level: string, message: string, data?: any): string {
  const timestamp = new Date().toISOString();
  let logMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
  
  if (data) {
    logMessage += ` | ${JSON.stringify(data)}`;
  }
  
  return logMessage;
}

export const logger = {
  debug: (message: string, data?: any) => {
    if (isDebugEnabled) {
      console.log(formatLog('debug', message, data));
    }
  },

  info: (message: string, data?: any) => {
    console.info(formatLog('info', message, data));
  },

  warn: (message: string, data?: any) => {
    console.warn(formatLog("warn", message, data));
  },

  error: (message: string, error?: Error, data?: any) => {
    const errorData = {
      ...data,
      error: error?.message,
      stack: isDevelopment ? error?.stack : undefined
    };
    console.error(formatLog('error', message, errorData));
  }
};
