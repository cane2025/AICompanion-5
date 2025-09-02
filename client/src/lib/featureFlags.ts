// Lightweight feature flag helper. Reads from import.meta.env and localStorage override.
export function isFeatureEnabled(flagName: string): boolean {
  try {
    const ls = localStorage.getItem(flagName);
    if (ls === "1" || ls === "true") return true;
    if (ls === "0" || ls === "false") return false;
  } catch {}
  // Vite exposes env as import.meta.env
  const env = (import.meta as any)?.env || {};
  const envVal = env?.[flagName] ?? env?.[`VITE_${flagName}`];
  if (typeof envVal === "string") {
    return envVal === "1" || envVal.toLowerCase() === "true";
  }
  return false;
}

export function enableFlag(flagName: string, enabled: boolean) {
  try {
    localStorage.setItem(flagName, enabled ? "1" : "0");
  } catch {}
}

export const UI_CAREPLAN_COMPACT_FLAG = "UI_CAREPLAN_COMPACT";
