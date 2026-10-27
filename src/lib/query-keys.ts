export const queryKeys = {
  providers: {
    all: ["providers"] as const,
  },
  appSettings: {
    all: ["app-settings"] as const,
  },
  accounts: {
    all: ["accounts"] as const,
    detail: (id: string) => ["accounts", id] as const,
  },
  transactions: {
    all: ["transactions"] as const,
    list: (filters: { date?: string }) => ["transactions", filters] as const,
  },
};
