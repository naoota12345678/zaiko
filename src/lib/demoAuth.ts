// ============================================================
// デモ用認証（既存Firebase認証とは別）
// ============================================================

export type DemoRole = "store" | "hq";

export interface DemoUser {
  name: string;
  role: DemoRole;
  storeId: string | null;
  storeName: string | null;
}

const SESSION_KEY = "demo_user";

export function demoSignIn(user: DemoUser): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function demoSignOut(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

export function getDemoUser(): DemoUser | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DemoUser;
  } catch {
    return null;
  }
}
