export const qk = {
  carePlans: (clientId?: string) =>
    clientId ? ["care-plans", clientId] : ["care-plans", "all"],
  gfp: (clientId?: string) =>
    clientId ? ["implementation-plans", clientId] : ["implementation-plans"],
  weeklyDocs: (clientId: string, week?: string) =>
    week ? ["weekly-docs", clientId, week] : ["weekly-docs", clientId],
} as const;
