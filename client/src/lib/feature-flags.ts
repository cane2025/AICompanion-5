/**
 * Feature Flag System
 * 
 * Centralized feature flag management for the application.
 * This allows for safe rollouts and easy rollbacks of new features.
 */

export interface FeatureFlags {
  UI_DASHBOARD_V2: boolean;
  // Add more feature flags here as needed
}

// Default feature flags - can be overridden by environment variables or API
const defaultFlags: FeatureFlags = {
  UI_DASHBOARD_V2: false, // Start disabled for safety
};

// Get feature flags from environment variables
const getEnvFlags = (): Partial<FeatureFlags> => {
  const flags: Partial<FeatureFlags> = {};
  
  if (typeof window !== 'undefined') {
    // Client-side: check for flags in localStorage or URL params
    const urlParams = new URLSearchParams(window.location.search);
    const localStorageFlags = localStorage.getItem('feature-flags');
    
    if (localStorageFlags) {
      try {
        const parsed = JSON.parse(localStorageFlags);
        Object.assign(flags, parsed);
      } catch (e) {
        console.warn('Failed to parse feature flags from localStorage:', e);
      }
    }
    
    // URL params override localStorage
    if (urlParams.has('ui_dashboard_v2')) {
      flags.UI_DASHBOARD_V2 = urlParams.get('ui_dashboard_v2') === 'true';
    }
  }
  
  return flags;
};

// Get current feature flags
export const getFeatureFlags = (): FeatureFlags => {
  const envFlags = getEnvFlags();
  return { ...defaultFlags, ...envFlags };
};

// Check if a specific feature is enabled
export const isFeatureEnabled = (flag: keyof FeatureFlags): boolean => {
  const flags = getFeatureFlags();
  return flags[flag] === true;
};

// Set feature flags (for development/testing)
export const setFeatureFlags = (flags: Partial<FeatureFlags>): void => {
  if (typeof window !== 'undefined') {
    const currentFlags = getFeatureFlags();
    const newFlags = { ...currentFlags, ...flags };
    localStorage.setItem('feature-flags', JSON.stringify(newFlags));
    
    // Reload page to apply changes
    window.location.reload();
  }
};

// Clear all feature flags
export const clearFeatureFlags = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('feature-flags');
    window.location.reload();
  }
};

// Development helper to enable all flags
export const enableAllFlags = (): void => {
  setFeatureFlags({
    UI_DASHBOARD_V2: true,
  });
};

// Development helper to disable all flags
export const disableAllFlags = (): void => {
  setFeatureFlags({
    UI_DASHBOARD_V2: false,
  });
};