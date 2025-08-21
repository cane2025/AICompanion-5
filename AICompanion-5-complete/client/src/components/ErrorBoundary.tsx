import React, { Component, ErrorInfo, ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { safeLog } from "@/lib/security";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
}

/**
 * Global Error Boundary for catching unhandled React errors
 * Provides user-friendly error UI and safe error reporting
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state to show error UI
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Safe error logging without sensitive data
    safeLog("React Error Boundary caught error", {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
    });

    this.setState({
      error,
      errorInfo,
    });

    // Report to error tracking service (if available)
    this.reportError(error, errorInfo);
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    try {
      // In production, this would send to error tracking service
      // For now, we just log safely
      const errorReport = {
        message: error.message,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        errorId: this.state.errorId,
        // Don't include full stack traces in reports to avoid data leakage
      };

      safeLog("Error report generated", errorReport);
    } catch (reportingError) {
      safeLog("Failed to report error", { originalError: error.message });
    }
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorId: undefined,
    });
  };

  private handleGoHome = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorId: undefined,
    });

    // Navigate to home - safe navigation
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI can be provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md border-red-200">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <AlertTriangle className="h-12 w-12 text-red-500" />
              </div>
              <CardTitle className="text-red-800">Något gick fel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Systemfel upptäckt</AlertTitle>
                <AlertDescription>
                  Ett oväntat fel inträffade i systemet. Inga känsliga data har
                  läckt.
                </AlertDescription>
              </Alert>

              <div className="text-sm text-gray-600 space-y-2">
                <p>
                  <strong>Fel-ID:</strong> {this.state.errorId}
                </p>
                <p>
                  <strong>Tid:</strong> {new Date().toLocaleString("sv-SE")}
                </p>
                {this.state.error && (
                  <p>
                    <strong>Typ:</strong> {this.state.error.name}
                  </p>
                )}
              </div>

              {/* Development mode - show more details */}
              {process.env.NODE_ENV === "development" && this.state.error && (
                <details className="text-xs bg-gray-100 p-3 rounded">
                  <summary className="cursor-pointer font-medium">
                    Utvecklarinformation (döljs i produktion)
                  </summary>
                  <pre className="mt-2 whitespace-pre-wrap text-red-700">
                    {this.state.error.message}
                  </pre>
                  {this.state.errorInfo && (
                    <pre className="mt-2 whitespace-pre-wrap text-gray-600">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </details>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={this.handleRetry}
                  className="flex-1"
                  variant="outline"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Försök igen
                </Button>
                <Button onClick={this.handleGoHome} className="flex-1">
                  <Home className="h-4 w-4 mr-2" />
                  Startsida
                </Button>
              </div>

              <div className="text-xs text-gray-500 text-center">
                Om problemet kvarstår, kontakta systemadministratör med fel-ID
                ovan.
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook for handling async errors in functional components
 */
export const useErrorHandler = () => {
  const [, setError] = React.useState<Error | null>(null);

  const handleError = React.useCallback((error: Error) => {
    safeLog("Async error caught by useErrorHandler", {
      message: error.message,
      stack: error.stack,
    });

    // Trigger error boundary by throwing in render
    setError(() => {
      throw error;
    });
  }, []);

  return handleError;
};

/**
 * Safe async wrapper that catches errors and reports them
 */
export const safeAsync = async function <T>(
  operation: () => Promise<T>,
  errorHandler?: (error: Error) => void
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));

    safeLog("Safe async operation failed", {
      message: err.message,
      operation: operation.name || "anonymous",
    });

    if (errorHandler) {
      errorHandler(err);
    }

    return null;
  }
};

/**
 * Safe component wrapper for function components
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<{ error: Error }>
) {
  const WrappedComponent: React.FC<P> = (props) => (
    <ErrorBoundary
      fallback={
        fallback
          ? React.createElement(fallback, {
              error: new Error("Component error"),
            })
          : undefined
      }
    >
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${
    Component.displayName || Component.name
  })`;

  return WrappedComponent;
}
