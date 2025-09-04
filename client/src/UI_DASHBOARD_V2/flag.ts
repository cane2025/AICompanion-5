// Simple feature flag gate for UI_DASHBOARD_V2
// Can be overridden via ?v2=1 or localStorage('UI_DASHBOARD_V2') === '1'

const FLAG_KEY = "UI_DASHBOARD_V2";

export function isDashboardV2Enabled(): boolean {
  try {
    const url = new URL(window.location.href);
    const v2Param = url.searchParams.get("v2");
    if (v2Param === "1") return true;
    if (v2Param === "0") return false;
  } catch {}

  try {
    const stored = localStorage.getItem(FLAG_KEY);
    if (stored === "1") return true;
    if (stored === "0") return false;
  } catch {}

  return false; // default off
}

export function setDashboardV2Enabled(enabled: boolean) {
  try {
    localStorage.setItem(FLAG_KEY, enabled ? "1" : "0");
  } catch {}
}

export const FEATURE_FLAG_NAME = FLAG_KEY;

