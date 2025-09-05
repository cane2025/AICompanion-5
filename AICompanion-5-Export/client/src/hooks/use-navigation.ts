import { useState, useEffect, useCallback, useRef } from 'react';
import { safeLog } from '@/lib/security';

interface NavigationState {
  activeView: string;
  activeStaffId: string | null;
  searchTerm: string;
  lastValidState?: NavigationState;
}

interface UseNavigationOptions {
  defaultView?: string;
  onStateChange?: (state: NavigationState) => void;
  enableHistory?: boolean;
}

/**
 * Safe navigation hook that handles browser back/forward events
 * Prevents crashes and maintains consistent application state
 */
export function useNavigation(options: UseNavigationOptions = {}) {
  const {
    defaultView = 'dashboard',
    onStateChange,
    enableHistory = true,
  } = options;

  const [navigationState, setNavigationState] = useState<NavigationState>({
    activeView: defaultView,
    activeStaffId: null,
    searchTerm: '',
  });

  const lastValidStateRef = useRef<NavigationState>(navigationState);
  const isRestoringRef = useRef(false);

  // Save valid state for recovery
  const saveValidState = useCallback((state: NavigationState) => {
    lastValidStateRef.current = { ...state };
    safeLog('Navigation state saved', { view: state.activeView });
  }, []);

  // Restore to last valid state on error
  const restoreValidState = useCallback(() => {
    const validState = lastValidStateRef.current;
    safeLog('Restoring navigation to valid state', { view: validState.activeView });
    
    isRestoringRef.current = true;
    setNavigationState(validState);
    
    // Update browser history to match restored state
    if (enableHistory) {
      try {
        const stateUrl = createStateUrl(validState);
        window.history.replaceState(validState, '', stateUrl);
      } catch (error) {
        safeLog('Failed to update history during restore', { error });
      }
    }
    
    setTimeout(() => {
      isRestoringRef.current = false;
    }, 100);
  }, [enableHistory]);

  // Create URL from state
  const createStateUrl = useCallback((state: NavigationState): string => {
    const params = new URLSearchParams();
    
    if (state.activeView !== defaultView) {
      params.set('view', state.activeView);
    }
    
    if (state.activeStaffId) {
      params.set('staff', state.activeStaffId);
    }
    
    if (state.searchTerm) {
      params.set('search', state.searchTerm);
    }

    const queryString = params.toString();
    return queryString ? `/?${queryString}` : '/';
  }, [defaultView]);

  // Parse URL to state
  const parseUrlToState = useCallback((url: string): NavigationState | null => {
    try {
      const urlObj = new URL(url, window.location.origin);
      const params = urlObj.searchParams;

      return {
        activeView: params.get('view') || defaultView,
        activeStaffId: params.get('staff'),
        searchTerm: params.get('search') || '',
      };
    } catch (error) {
      safeLog('Failed to parse URL to state', { url, error });
      return null;
    }
  }, [defaultView]);

  // Validate navigation state
  const validateState = useCallback((state: NavigationState): boolean => {
    // Basic validation - extend as needed
    if (!state.activeView || typeof state.activeView !== 'string') {
      return false;
    }

    if (state.activeStaffId && typeof state.activeStaffId !== 'string') {
      return false;
    }

    if (typeof state.searchTerm !== 'string') {
      return false;
    }

    return true;
  }, []);

  // Safe state update
  const updateNavigationState = useCallback((
    updates: Partial<NavigationState>,
    options: { pushHistory?: boolean; skipValidation?: boolean } = {}
  ) => {
    const { pushHistory = true, skipValidation = false } = options;

    setNavigationState(prevState => {
      const newState = { ...prevState, ...updates };

      // Validate new state
      if (!skipValidation && !validateState(newState)) {
        safeLog('Invalid navigation state detected, restoring valid state', { 
          attempted: newState,
          valid: lastValidStateRef.current 
        });
        restoreValidState();
        return prevState;
      }

      // Save as valid state
      saveValidState(newState);

      // Update browser history
      if (enableHistory && pushHistory && !isRestoringRef.current) {
        try {
          const stateUrl = createStateUrl(newState);
          window.history.pushState(newState, '', stateUrl);
        } catch (error) {
          safeLog('Failed to update browser history', { error });
        }
      }

      // Notify listeners
      if (onStateChange) {
        onStateChange(newState);
      }

      return newState;
    });
  }, [
    validateState,
    saveValidState,
    restoreValidState,
    enableHistory,
    createStateUrl,
    onStateChange,
  ]);

  // Handle browser back/forward
  useEffect(() => {
    if (!enableHistory) return;

    const handlePopState = (event: PopStateEvent) => {
      try {
        let targetState: NavigationState | null = null;

        // Try to get state from event
        if (event.state && typeof event.state === 'object') {
          targetState = event.state as NavigationState;
        } else {
          // Parse from URL as fallback
          targetState = parseUrlToState(window.location.href);
        }

        if (targetState && validateState(targetState)) {
          safeLog('Navigating to state from history', { state: targetState });
          updateNavigationState(targetState, { 
            pushHistory: false,
            skipValidation: true 
          });
        } else {
          safeLog('Invalid state in history, restoring valid state');
          restoreValidState();
        }
      } catch (error) {
        safeLog('Error handling popstate, restoring valid state', { error });
        restoreValidState();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [
    enableHistory,
    parseUrlToState,
    validateState,
    updateNavigationState,
    restoreValidState,
  ]);

  // Initialize from URL on mount
  useEffect(() => {
    if (!enableHistory) return;

    const initialState = parseUrlToState(window.location.href);
    if (initialState && validateState(initialState)) {
      updateNavigationState(initialState, { pushHistory: false });
    }
  }, [enableHistory, parseUrlToState, validateState, updateNavigationState]);

  // Navigation helpers
  const navigateToView = useCallback((view: string, staffId?: string) => {
    updateNavigationState({
      activeView: view,
      activeStaffId: staffId || null,
    });
  }, [updateNavigationState]);

  const navigateToStaff = useCallback((staffId: string) => {
    updateNavigationState({
      activeView: `staff-${staffId}`,
      activeStaffId: staffId,
    });
  }, [updateNavigationState]);

  const updateSearch = useCallback((searchTerm: string) => {
    updateNavigationState({
      searchTerm,
    }, { pushHistory: false }); // Don't push history for search updates
  }, [updateNavigationState]);

  const goBack = useCallback(() => {
    try {
      window.history.back();
    } catch (error) {
      safeLog('Failed to go back, restoring valid state', { error });
      restoreValidState();
    }
  }, [restoreValidState]);

  const goForward = useCallback(() => {
    try {
      window.history.forward();
    } catch (error) {
      safeLog('Failed to go forward, restoring valid state', { error });
      restoreValidState();
    }
  }, [restoreValidState]);

  return {
    ...navigationState,
    navigateToView,
    navigateToStaff,
    updateSearch,
    goBack,
    goForward,
    restoreValidState,
    isRestoring: isRestoringRef.current,
  };
}

/**
 * Hook for handling page refresh and tab restoration
 */
export function usePageRestoration() {
  const [isRestored, setIsRestored] = useState(false);

  useEffect(() => {
    // Check if this is a page refresh or new session
    const wasRefreshed = window.performance.navigation.type === 1;
    
    if (wasRefreshed) {
      safeLog('Page was refreshed, attempting to restore state');
      
      // Try to restore from sessionStorage
      try {
        const savedState = sessionStorage.getItem('navigation-state');
        if (savedState) {
          const parsedState = JSON.parse(savedState);
          safeLog('Restored navigation state from session storage', { state: parsedState });
          // State will be restored by useNavigation hook
        }
      } catch (error) {
        safeLog('Failed to restore from session storage', { error });
      }
    }

    setIsRestored(true);
  }, []);

  // Save state to session storage
  const saveToSession = useCallback((state: NavigationState) => {
    try {
      sessionStorage.setItem('navigation-state', JSON.stringify(state));
    } catch (error) {
      safeLog('Failed to save to session storage', { error });
    }
  }, []);

  return {
    isRestored,
    saveToSession,
  };
}
