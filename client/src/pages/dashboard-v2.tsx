/**
 * Dashboard V2 Page
 * 
 * This is the main page component that conditionally renders either
 * Dashboard V1 or Dashboard V2 based on the UI_DASHBOARD_V2 feature flag.
 */

import React from 'react';
import { Dashboard } from './dashboard';
import { DashboardV2 } from '@/components/dashboard-v2';
import { isFeatureEnabled } from '@/lib/feature-flags';

export function DashboardV2Page() {
  // Check if Dashboard V2 feature is enabled
  const isDashboardV2Enabled = isFeatureEnabled('UI_DASHBOARD_V2');

  if (isDashboardV2Enabled) {
    return <DashboardV2 />;
  }

  // Fallback to original dashboard
  return <Dashboard />;
}