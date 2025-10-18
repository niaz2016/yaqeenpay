// src/hooks/useErrorHandler.ts
import { useCallback } from 'react';
import { useError } from '../context/ErrorContext';
import logger from '../utils/logger';

/**
 * Custom hook for handling errors with user feedback
 * Combines error logging with toast notifications
 */
export const useErrorHandler = () => {
  const { showError, showSuccess, showWarning, showInfo } = useError();

  /**
   * Handle API errors with automatic logging and user notification
   */
  const handleError = useCallback((error: unknown, context?: string, userMessage?: string) => {
    // Log to console/monitoring service
    logger.error(`Error in ${context || 'application'}`, error instanceof Error ? error : new Error(String(error)));

    // Extract meaningful message
    let message = userMessage || 'An error occurred. Please try again.';
    
    if (error instanceof Error) {
      // Check for common error patterns
      if (error.message.includes('Network Error') || error.message.includes('fetch')) {
        message = 'Network error. Please check your connection.';
      } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        message = 'Session expired. Please login again.';
      } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
        message = 'You do not have permission to perform this action.';
      } else if (error.message.includes('404')) {
        message = 'Resource not found.';
      } else if (error.message.includes('500')) {
        message = 'Server error. Please try again later.';
      } else if (!userMessage) {
        // Use error message if no custom message provided
        message = error.message;
      }
    }

    // Show toast to user
    showError(message);
  }, [showError]);

  /**
   * Handle success with optional logging
   */
  const handleSuccess = useCallback((message: string, context?: string) => {
    if (context) {
      logger.info(`Success in ${context}`, { message });
    }
    showSuccess(message);
  }, [showSuccess]);

  /**
   * Handle warnings
   */
  const handleWarning = useCallback((message: string, context?: string) => {
    if (context) {
      logger.warn(`Warning in ${context}`, { message });
    }
    showWarning(message);
  }, [showWarning]);

  /**
   * Handle info messages
   */
  const handleInfo = useCallback((message: string, context?: string) => {
    if (context) {
      logger.info(`Info in ${context}`, { message });
    }
    showInfo(message);
  }, [showInfo]);

  return {
    handleError,
    handleSuccess,
    handleWarning,
    handleInfo,
    showError,
    showSuccess,
    showWarning,
    showInfo,
  };
};
