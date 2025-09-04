/**
 * Development Helpers
 * 
 * Utility functions for development and testing of Dashboard V2
 */

import { setFeatureFlags, enableAllFlags, disableAllFlags } from './feature-flags';

// Development helper to easily toggle Dashboard V2
export const toggleDashboardV2 = () => {
  const currentFlags = JSON.parse(localStorage.getItem('feature-flags') || '{}');
  const newValue = !currentFlags.UI_DASHBOARD_V2;
  
  setFeatureFlags({ UI_DASHBOARD_V2: newValue });
  
  console.log(`Dashboard V2 ${newValue ? 'aktiverad' : 'inaktiverad'}`);
  return newValue;
};

// Quick access to feature flag controls
export const devControls = {
  enableDashboardV2: () => setFeatureFlags({ UI_DASHBOARD_V2: true }),
  disableDashboardV2: () => setFeatureFlags({ UI_DASHBOARD_V2: false }),
  toggleDashboardV2,
  enableAllFlags,
  disableAllFlags,
  
  // Log current feature flags
  logFlags: () => {
    const flags = JSON.parse(localStorage.getItem('feature-flags') || '{}');
    console.table(flags);
  }
};

// Make dev controls available globally in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).devControls = devControls;
  console.log('🔧 Development controls available: window.devControls');
  console.log('Available commands:');
  console.log('- devControls.enableDashboardV2()');
  console.log('- devControls.disableDashboardV2()');
  console.log('- devControls.toggleDashboardV2()');
  console.log('- devControls.logFlags()');
}