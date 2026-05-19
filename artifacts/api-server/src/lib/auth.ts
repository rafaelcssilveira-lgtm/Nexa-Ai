import { Request, Response, NextFunction } from "express";

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.session?.userId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  next();
}

export const FREE_DAILY_LIMIT = 54;
export const PRO_DAILY_LIMIT = 9999;

export function getDailyLimit(plan: string): number {
  return plan === "pro" ? PRO_DAILY_LIMIT : FREE_DAILY_LIMIT;
}

export function shouldResetDailyMessages(resetAt: Date): boolean {
  const now = new Date();
  const resetDate = new Date(resetAt);
  const diffMs = now.getTime() - resetDate.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  return diffHours >= 24;
}
