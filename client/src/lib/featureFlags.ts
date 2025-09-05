export type FeatureFlag = "UI_DASHBOARD_V2";

const LOCAL_STORAGE_KEY = "featureFlags";

function getStoredFlags(): Record<FeatureFlag, boolean> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // ignore
  }
  return { UI_DASHBOARD_V2: false } as Record<FeatureFlag, boolean>;
}

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  // Prefer env variable if provided
  if (typeof process !== "undefined" && process.env?.[flag] !== undefined) {
    return process.env[flag] === "true";
  }
  const stored = getStoredFlags();
  return stored[flag] ?? false;
}

export function setFeatureEnabled(flag: FeatureFlag, value: boolean) {
  const stored = getStoredFlags();
  stored[flag] = value;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stored));
  } catch (e) {
    // ignore
  }
}