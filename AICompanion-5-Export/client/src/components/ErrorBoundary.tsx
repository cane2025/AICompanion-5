import React from "react";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
    // Här skulle vi skicka till Sentry eller annan error tracking service
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <DefaultErrorFallback
          error={this.state.error!}
          resetError={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}

const DefaultErrorFallback = ({
  error,
  resetError,
}: {
  error: Error;
  resetError: () => void;
}) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
      <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
        <svg
          className="w-6 h-6 text-red-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
      </div>

      <div className="mt-4 text-center">
        <h2 className="text-lg font-semibold text-gray-900">Något gick fel</h2>
        <p className="mt-2 text-sm text-gray-600">
          Ett oväntat fel inträffade i systemet. Inga känsliga data har läckt.
        </p>

        {process.env.NODE_ENV === "development" && (
          <details className="mt-4 text-left">
            <summary className="cursor-pointer text-sm font-medium text-gray-700">
              Utvecklarinformation (döljs i produktion)
            </summary>
            <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono text-gray-800 overflow-auto">
              <div className="mb-2">
                <strong>Fel-ID:</strong> error_{Date.now()}_
                {Math.random().toString(36).substr(2, 9)}
              </div>
              <div className="mb-2">
                <strong>Tid:</strong> {new Date().toLocaleString("sv-SE")}
              </div>
              <div className="mb-2">
                <strong>Typ:</strong> {error.name}
              </div>
              <div>
                <strong>Meddelande:</strong> {error.message}
              </div>
              {error.stack && (
                <div className="mt-2">
                  <strong>Stack:</strong>
                  <pre className="whitespace-pre-wrap">{error.stack}</pre>
                </div>
              )}
            </div>
          </details>
        )}
      </div>

      <div className="mt-6 flex gap-3">
        <button
          onClick={resetError}
          className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Försök igen
        </button>
        <button
          onClick={() => (window.location.href = "/")}
          className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          Startsida
        </button>
      </div>

      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          Om problemet kvarstår, kontakta systemadministratör med fel-ID ovan.
        </p>
      </div>
    </div>
  </div>
);

/**
 * Hook for handling async errors in functional components
 */
export const useErrorHandler = () => {
  const [, setError] = React.useState<Error | null>(null);

  const handleError = React.useCallback((error: Error) => {
    console.error("Async error caught by useErrorHandler:", error);
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

    console.error("Safe async operation failed:", err);

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
