/**
 * Feature Flags System
 * Simple client-side feature flag management
 */

export interface FeatureFlags {
  UI_DASHBOARD_V2: boolean;
  // Add more feature flags here as needed
}

// Default feature flags - can be overridden by environment variables or localStorage
const defaultFlags: FeatureFlags = {
  UI_DASHBOARD_V2: false, // Default to false for safety
};

// Get feature flags from various sources
function getFeatureFlagsFromEnv(): Partial<FeatureFlags> {
  const flags: Partial<FeatureFlags> = {};
  
  // Check environment variables (Vite uses VITE_ prefix)
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    if (import.meta.env.VITE_UI_DASHBOARD_V2 === 'true') {
      flags.UI_DASHBOARD_V2 = true;
    }
  }
  
  return flags;
}

function getFeatureFlagsFromLocalStorage(): Partial<FeatureFlags> {
  const flags: Partial<FeatureFlags> = {};
  
  try {
    const storedFlags = localStorage.getItem('featureFlags');
    if (storedFlags) {
      const parsed = JSON.parse(storedFlags);
      Object.keys(defaultFlags).forEach(key => {
        const flagKey = key as keyof FeatureFlags;
        if (typeof parsed[flagKey] === 'boolean') {
          flags[flagKey] = parsed[flagKey];
        }
      });
    }
  } catch (error) {
    console.warn('Failed to parse feature flags from localStorage:', error);
  }
  
  return flags;
}

// Combine all sources with precedence: localStorage > env > defaults
function resolveFeatureFlags(): FeatureFlags {
  return {
    ...defaultFlags,
    ...getFeatureFlagsFromEnv(),
    ...getFeatureFlagsFromLocalStorage(),
  };
}

// Global feature flags instance
let featureFlags: FeatureFlags = resolveFeatureFlags();

// Export functions
export function getFeatureFlag<K extends keyof FeatureFlags>(flag: K): FeatureFlags[K] {
  return featureFlags[flag];
}

export function setFeatureFlag<K extends keyof FeatureFlags>(flag: K, value: FeatureFlags[K]): void {
  featureFlags[flag] = value;
  
  // Persist to localStorage
  try {
    localStorage.setItem('featureFlags', JSON.stringify(featureFlags));
  } catch (error) {
    console.warn('Failed to save feature flags to localStorage:', error);
  }
}

export function getAllFeatureFlags(): FeatureFlags {
  return { ...featureFlags };
}

export function resetFeatureFlags(): void {
  featureFlags = { ...defaultFlags };
  try {
    localStorage.removeItem('featureFlags');
  } catch (error) {
    console.warn('Failed to remove feature flags from localStorage:', error);
  }
}

// Utility hook for React components
export function useFeatureFlag<K extends keyof FeatureFlags>(flag: K): FeatureFlags[K] {
  return getFeatureFlag(flag);
}

// Development helpers
export const featureFlagHelpers = {
  // Enable Dashboard V2
  enableDashboardV2: () => setFeatureFlag('UI_DASHBOARD_V2', true),
  
  // Disable Dashboard V2
  disableDashboardV2: () => setFeatureFlag('UI_DASHBOARD_V2', false),
  
  // Toggle Dashboard V2
  toggleDashboardV2: () => setFeatureFlag('UI_DASHBOARD_V2', !getFeatureFlag('UI_DASHBOARD_V2')),
  
  // Debug: log all flags
  logFlags: () => console.log('Feature Flags:', getAllFeatureFlags()),
};

// Make helpers available globally in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).featureFlags = featureFlagHelpers;
}