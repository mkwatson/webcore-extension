/**
 * Simple logger for debugging Chrome extensions
 * Works in both content script and service worker contexts
 */

// Types for logging
type LogType = 'info' | 'warn' | 'error';

// Simple logger implementation
const DebugLogger = {
  info: function(component: string, message: string, data?: any): void {
    console.info(`[${component}] ${message}`, data || '');
  },
  
  warn: function(component: string, message: string, data?: any): void {
    console.warn(`[${component}] ${message}`, data || '');
  },
  
  error: function(component: string, message: string, data?: any): void {
    console.error(`[${component}] ${message}`, data || '');
  }
};

export default DebugLogger; 