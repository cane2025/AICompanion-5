import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNavigation, usePageRestoration } from '../client/src/hooks/use-navigation';

// Mock window.history
const mockHistory = {
  pushState: vi.fn(),
  replaceState: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
};

// Mock window.location
const mockLocation = {
  href: 'http://localhost:3001/',
  origin: 'http://localhost:3001',
  pathname: '/',
  search: '',
  hash: '',
};

// Mock console.log from security module
vi.mock('@/lib/security', () => ({
  safeLog: vi.fn(),
}));

describe('useNavigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup DOM mocks
    Object.defineProperty(window, 'history', {
      value: mockHistory,
      writable: true,
    });
    
    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true,
    });

    // Mock performance.navigation for page refresh detection
    Object.defineProperty(window, 'performance', {
      value: {
        navigation: {
          type: 0, // 0 = navigate, 1 = reload, 2 = back_forward
        },
      },
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useNavigation());

    expect(result.current.activeView).toBe('dashboard');
    expect(result.current.activeStaffId).toBeNull();
    expect(result.current.searchTerm).toBe('');
  });

  it('should update navigation state safely', () => {
    const { result } = renderHook(() => useNavigation());

    act(() => {
      result.current.navigateToView('staff', 'staff-123');
    });

    expect(result.current.activeView).toBe('staff');
    expect(result.current.activeStaffId).toBe('staff-123');
  });

  it('should handle staff navigation', () => {
    const { result } = renderHook(() => useNavigation());

    act(() => {
      result.current.navigateToStaff('staff-456');
    });

    expect(result.current.activeView).toBe('staff-staff-456');
    expect(result.current.activeStaffId).toBe('staff-456');
  });

  it('should update search without affecting history', () => {
    const { result } = renderHook(() => useNavigation());

    act(() => {
      result.current.updateSearch('test search');
    });

    expect(result.current.searchTerm).toBe('test search');
    expect(mockHistory.pushState).not.toHaveBeenCalled();
  });

  it('should push to history on view change', () => {
    const { result } = renderHook(() => useNavigation());

    act(() => {
      result.current.navigateToView('settings');
    });

    expect(mockHistory.pushState).toHaveBeenCalledWith(
      expect.objectContaining({
        activeView: 'settings',
      }),
      '',
      '/?view=settings'
    );
  });

  it('should handle popstate events safely', () => {
    const { result } = renderHook(() => useNavigation());

    // Simulate navigation to different view
    act(() => {
      result.current.navigateToView('settings');
    });

    // Simulate browser back button
    const popstateEvent = new PopStateEvent('popstate', {
      state: {
        activeView: 'dashboard',
        activeStaffId: null,
        searchTerm: '',
      },
    });

    act(() => {
      window.dispatchEvent(popstateEvent);
    });

    expect(result.current.activeView).toBe('dashboard');
  });

  it('should handle invalid state gracefully', () => {
    const onStateChange = vi.fn();
    const { result } = renderHook(() => 
      useNavigation({ onStateChange })
    );

    // Try to set invalid state
    const popstateEvent = new PopStateEvent('popstate', {
      state: {
        activeView: null, // invalid
        invalidField: 'test',
      },
    });

    act(() => {
      window.dispatchEvent(popstateEvent);
    });

    // Should restore to valid state (dashboard)
    expect(result.current.activeView).toBe('dashboard');
  });

  it('should parse URL parameters correctly', () => {
    // Mock URL with parameters
    mockLocation.href = 'http://localhost:3001/?view=staff&staff=123&search=test';
    mockLocation.search = '?view=staff&staff=123&search=test';

    const { result } = renderHook(() => useNavigation());

    // Should initialize from URL
    expect(result.current.activeView).toBe('staff');
    expect(result.current.activeStaffId).toBe('123');
    expect(result.current.searchTerm).toBe('test');
  });

  it('should disable history when configured', () => {
    const { result } = renderHook(() => 
      useNavigation({ enableHistory: false })
    );

    act(() => {
      result.current.navigateToView('settings');
    });

    expect(mockHistory.pushState).not.toHaveBeenCalled();
  });

  it('should call onStateChange callback', () => {
    const onStateChange = vi.fn();
    const { result } = renderHook(() => 
      useNavigation({ onStateChange })
    );

    act(() => {
      result.current.navigateToView('settings');
    });

    expect(onStateChange).toHaveBeenCalledWith(
      expect.objectContaining({
        activeView: 'settings',
      })
    );
  });

  it('should handle back/forward navigation safely', () => {
    const { result } = renderHook(() => useNavigation());

    act(() => {
      result.current.goBack();
    });

    expect(mockHistory.back).toHaveBeenCalled();

    act(() => {
      result.current.goForward();
    });

    expect(mockHistory.forward).toHaveBeenCalled();
  });
});

describe('usePageRestoration', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock sessionStorage
    const mockSessionStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };

    Object.defineProperty(window, 'sessionStorage', {
      value: mockSessionStorage,
      writable: true,
    });
  });

  it('should detect page refresh', () => {
    // Mock page refresh
    Object.defineProperty(window, 'performance', {
      value: {
        navigation: {
          type: 1, // reload
        },
      },
      writable: true,
    });

    const { result } = renderHook(() => usePageRestoration());

    expect(result.current.isRestored).toBe(true);
  });

  it('should save state to session storage', () => {
    const { result } = renderHook(() => usePageRestoration());

    const testState = {
      activeView: 'staff',
      activeStaffId: '123',
      searchTerm: 'test',
    };

    act(() => {
      result.current.saveToSession(testState);
    });

    expect(window.sessionStorage.setItem).toHaveBeenCalledWith(
      'navigation-state',
      JSON.stringify(testState)
    );
  });

  it('should handle session storage errors gracefully', () => {
    // Mock sessionStorage error
    (window.sessionStorage.setItem as any).mockImplementation(() => {
      throw new Error('Storage quota exceeded');
    });

    const { result } = renderHook(() => usePageRestoration());

    const testState = {
      activeView: 'staff',
      activeStaffId: '123',
      searchTerm: 'test',
    };

    expect(() => {
      act(() => {
        result.current.saveToSession(testState);
      });
    }).not.toThrow();
  });
});

// Browser compatibility tests
describe('Browser Compatibility', () => {
  it('should handle missing history API', () => {
    // Mock browser without history API
    Object.defineProperty(window, 'history', {
      value: undefined,
      writable: true,
    });

    expect(() => {
      renderHook(() => useNavigation());
    }).not.toThrow();
  });

  it('should handle missing sessionStorage', () => {
    Object.defineProperty(window, 'sessionStorage', {
      value: undefined,
      writable: true,
    });

    expect(() => {
      renderHook(() => usePageRestoration());
    }).not.toThrow();
  });

  it('should handle URL constructor errors', () => {
    // Mock invalid URL scenario
    mockLocation.href = 'invalid-url';

    expect(() => {
      renderHook(() => useNavigation());
    }).not.toThrow();
  });
});
