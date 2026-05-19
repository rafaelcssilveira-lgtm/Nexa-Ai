import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, getDailyLimit } from "../lib/auth";
import {
  RegisterUserBody,
  LoginUserBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { name, email, password } = parsed.data;

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existing.length > 0) {
    res.status(409).json({ error: "Email already in use" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const [user] = await db.insert(usersTable).values({
    name,
    email,
    passwordHash,
    plan: "free",
    dailyMessagesUsed: 0,
    dailyResetAt: new Date(),
  }).returning();

  if (!user) {
    res.status(500).json({ error: "Failed to create user" });
    return;
  }

  req.session.userId = user.id;

  res.status(201).json({
    id: user.id,
    name: user.name,
    email: user.email,
    plan: user.plan,
    dailyMessagesUsed: user.dailyMessagesUsed,
    dailyLimit: getDailyLimit(user.plan),
    createdAt: user.createdAt,
  });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, password } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user) {
    res.status(400).json({ error: "Invalid email or password" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(400).json({ error: "Invalid email or password" });
    return;
  }

  req.session.userId = user.id;

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    plan: user.plan,
    dailyMessagesUsed: user.dailyMessagesUsed,
    dailyLimit: getDailyLimit(user.plan),
    createdAt: user.createdAt,
  });
});

router.post("/auth/logout", (req, res): void => {
  req.session.destroy(() => {
    res.json({ success: true, message: "Logged out" });
  });
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId!));
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    plan: user.plan,
    dailyMessagesUsed: user.dailyMessagesUsed,
    dailyLimit: getDailyLimit(user.plan),
    createdAt: user.createdAt,
  });
});

export default router;
