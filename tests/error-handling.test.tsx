import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  ErrorBoundary,
  useErrorHandler,
  safeAsync,
} from "../client/src/components/ErrorBoundary";
import { useErrorHandling } from "../client/src/hooks/use-error-handling";
import { renderHook, act } from "@testing-library/react";

// Mock useToast hook
const mockToast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Mock console methods
const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

describe("ErrorBoundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    consoleSpy.mockClear();
  });

  it("should render children when no error", () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText("Test content")).toBeInTheDocument();
  });

  it("should catch and display error", () => {
    const ThrowError = () => {
      throw new Error("Test error");
    };

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText("Något gick fel")).toBeInTheDocument();
    expect(screen.getByText(/Systemfel upptäckt/)).toBeInTheDocument();
  });

  it("should show retry and home buttons", () => {
    const ThrowError = () => {
      throw new Error("Test error");
    };

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText("Försök igen")).toBeInTheDocument();
    expect(screen.getByText("Startsida")).toBeInTheDocument();
  });

  it("should log errors safely", () => {
    const ThrowError = () => {
      throw new Error("Test error message");
    };

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(consoleSpy).toHaveBeenCalledWith(
      "React Error Boundary caught error",
      expect.objectContaining({
        message: "Test error message",
      })
    );
  });

  it("should reset error state on retry", () => {
    let shouldThrow = true;
    const ConditionalThrow = () => {
      if (shouldThrow) {
        throw new Error("Test error");
      }
      return <div>Success content</div>;
    };

    render(
      <ErrorBoundary>
        <ConditionalThrow />
      </ErrorBoundary>
    );

    expect(screen.getByText("Något gick fel")).toBeInTheDocument();

    // Change condition and retry
    shouldThrow = false;
    fireEvent.click(screen.getByText("Försök igen"));

    expect(screen.getByText("Success content")).toBeInTheDocument();
  });
});

describe("useErrorHandler", () => {
  it("should throw error to trigger boundary", () => {
    const TestComponent = () => {
      const handleError = useErrorHandler();

      const throwError = () => {
        handleError(new Error("Test async error"));
      };

      return (
        <button type="button" onClick={throwError}>
          Trigger Error
        </button>
      );
    };

    expect(() => {
      render(
        <ErrorBoundary>
          <TestComponent />
        </ErrorBoundary>
      );
    }).not.toThrow();
  });
});

describe("safeAsync", () => {
  it("should return result on success", async () => {
    const successOperation = async () => "success result";

    const result = await safeAsync(successOperation);

    expect(result).toBe("success result");
  });

  it("should return null on error", async () => {
    const failOperation = async () => {
      throw new Error("Operation failed");
    };

    const result = await safeAsync(failOperation);

    expect(result).toBeNull();
  });

  it("should call error handler on error", async () => {
    const errorHandler = vi.fn();
    const failOperation = async () => {
      throw new Error("Operation failed");
    };

    await safeAsync(failOperation, errorHandler);

    expect(errorHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Operation failed",
      })
    );
  });

  it("should log errors safely", async () => {
    const failOperation = async () => {
      throw new Error("Test error");
    };

    await safeAsync(failOperation);

    expect(consoleSpy).toHaveBeenCalledWith(
      "Safe async operation failed",
      expect.objectContaining({
        message: "Test error",
      })
    );
  });
});

describe("useErrorHandling", () => {
  beforeEach(() => {
    mockToast.mockClear();
  });

  it("should handle errors and show toast", () => {
    const { result } = renderHook(() => useErrorHandling());

    act(() => {
      result.current.handleError("Test error message");
    });

    expect(result.current.hasError).toBe(true);
    expect(result.current.error?.message).toBe("Test error message");
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "⚠️ Fel inträffade",
        description: "Test error message",
        variant: "destructive",
      })
    );
  });

  it("should clear errors", () => {
    const { result } = renderHook(() => useErrorHandling());

    act(() => {
      result.current.handleError("Test error");
    });

    expect(result.current.hasError).toBe(true);

    act(() => {
      result.current.clearError();
    });

    expect(result.current.hasError).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("should handle async operations safely", async () => {
    const { result } = renderHook(() => useErrorHandling());

    const failingOperation = async () => {
      throw new Error("Async error");
    };

    let asyncResult: any;
    await act(async () => {
      asyncResult = await result.current.handleAsyncError(failingOperation);
    });

    expect(asyncResult).toBeNull();
    expect(result.current.hasError).toBe(true);
    expect(result.current.error?.message).toBe("Async error");
  });

  it("should handle form errors with field context", () => {
    const { result } = renderHook(() => useErrorHandling());

    act(() => {
      result.current.handleFormError("Invalid email", "email");
    });

    expect(result.current.error?.field).toBe("email");
    expect(result.current.error?.message).toBe("Invalid email");
  });

  it("should handle API errors with endpoint context", () => {
    const { result } = renderHook(() => useErrorHandling());

    act(() => {
      result.current.handleApiError("Network error", "/api/users");
    });

    expect(result.current.hasError).toBe(true);
    expect(consoleSpy).toHaveBeenCalledWith(
      "Error handled by useErrorHandling",
      expect.objectContaining({
        message: "Network error",
        operation: "api_call_/api/users",
      })
    );
  });

  it("should not show toast when disabled", () => {
    const { result } = renderHook(() => useErrorHandling({ showToast: false }));

    act(() => {
      result.current.handleError("Test error");
    });

    expect(mockToast).not.toHaveBeenCalled();
  });
});

// Simulate browser back/forward navigation errors
describe("Navigation Error Handling", () => {
  it("should handle popstate events safely", () => {
    const mockHistory = {
      pushState: vi.fn(),
      replaceState: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
    };

    Object.defineProperty(window, "history", {
      value: mockHistory,
      writable: true,
    });

    // Simulate navigation error
    const errorEvent = new PopStateEvent("popstate", {
      state: { invalidData: true },
    });

    expect(() => {
      window.dispatchEvent(errorEvent);
    }).not.toThrow();
  });
});
