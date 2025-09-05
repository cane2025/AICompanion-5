import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { safeLog } from '@/lib/security';

interface ErrorState {
  hasError: boolean;
  message: string;
  field?: string;
  code?: string;
}

interface UseErrorHandlingOptions {
  showToast?: boolean;
  logErrors?: boolean;
  defaultMessage?: string;
}

/**
 * Centralized error handling hook for forms and async operations
 * Provides consistent error reporting and user feedback
 */
export function useErrorHandling(options: UseErrorHandlingOptions = {}) {
  const {
    showToast = true,
    logErrors = true,
    defaultMessage = 'Ett oväntat fel inträffade'
  } = options;

  const { toast } = useToast();
  const [error, setError] = useState<ErrorState | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleError = useCallback((
    error: Error | string,
    context?: {
      field?: string;
      operation?: string;
      showToast?: boolean;
    }
  ) => {
    const errorMessage = error instanceof Error ? error.message : error;
    const errorObj: ErrorState = {
      hasError: true,
      message: errorMessage || defaultMessage,
      field: context?.field,
    };

    setError(errorObj);

    // Safe logging without sensitive data
    if (logErrors) {
      safeLog('Error handled by useErrorHandling', {
        message: errorMessage,
        field: context?.field,
        operation: context?.operation,
        url: window.location.pathname,
      });
    }

    // Show toast notification
    if (showToast && (context?.showToast !== false)) {
      toast({
        title: '⚠️ Fel inträffade',
        description: errorMessage || defaultMessage,
        variant: 'destructive',
        duration: 5000,
      });
    }
  }, [toast, showToast, logErrors, defaultMessage]);

  const handleAsyncError = useCallback(async <T>(
    operation: () => Promise<T>,
    context?: {
      operation?: string;
      fallbackValue?: T;
      showToast?: boolean;
    }
  ): Promise<T | null> => {
    try {
      return await operation();
    } catch (error) {
      handleError(
        error instanceof Error ? error : new Error(String(error)),
        {
          operation: context?.operation,
          showToast: context?.showToast,
        }
      );
      return context?.fallbackValue ?? null;
    }
  }, [handleError]);

  const handleFormError = useCallback((
    error: Error | string,
    field?: string
  ) => {
    handleError(error, {
      field,
      operation: 'form_validation',
    });
  }, [handleError]);

  const handleApiError = useCallback((
    error: Error | string,
    endpoint?: string
  ) => {
    handleError(error, {
      operation: `api_call_${endpoint}`,
    });
  }, [handleError]);

  return {
    error,
    hasError: error?.hasError ?? false,
    clearError,
    handleError,
    handleAsyncError,
    handleFormError,
    handleApiError,
  };
}

/**
 * Specific hook for handling form validation errors
 */
export function useFormErrorHandling() {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const { handleFormError } = useErrorHandling({ showToast: false });

  const setFieldError = useCallback((field: string, message: string) => {
    setFieldErrors(prev => ({
      ...prev,
      [field]: message,
    }));
    handleFormError(message, field);
  }, [handleFormError]);

  const clearFieldError = useCallback((field: string) => {
    setFieldErrors(prev => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setFieldErrors({});
  }, []);

  const hasFieldError = useCallback((field: string) => {
    return Boolean(fieldErrors[field]);
  }, [fieldErrors]);

  const getFieldError = useCallback((field: string) => {
    return fieldErrors[field] || '';
  }, [fieldErrors]);

  return {
    fieldErrors,
    setFieldError,
    clearFieldError,
    clearAllErrors,
    hasFieldError,
    getFieldError,
    hasAnyError: Object.keys(fieldErrors).length > 0,
  };
}

/**
 * Safe wrapper for API calls with automatic error handling
 */
export function useSafeApiCall() {
  const { handleApiError } = useErrorHandling();

  const safeCall = useCallback(async <T>(
    apiCall: () => Promise<T>,
    options?: {
      endpoint?: string;
      fallback?: T;
      retries?: number;
    }
  ): Promise<T | null> => {
    const { endpoint, fallback, retries = 0 } = options || {};
    
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await apiCall();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Log attempt
        safeLog(`API call attempt ${attempt + 1} failed`, {
          endpoint,
          error: lastError.message,
          attempt: attempt + 1,
          totalRetries: retries,
        });

        // If this is the last attempt, handle the error
        if (attempt === retries) {
          handleApiError(lastError, endpoint);
          return fallback ?? null;
        }

        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    return fallback ?? null;
  }, [handleApiError]);

  return { safeCall };
}
