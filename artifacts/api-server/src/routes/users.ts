import { Router, type IRouter } from "express";
import { db, usersTable, conversationsTable, messagesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, getDailyLimit } from "../lib/auth";

const router: IRouter = Router();

router.get("/users/me", requireAuth, async (req, res): Promise<void> => {
  const userId = req.session.userId!;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  const conversations = await db
    .select({ id: conversationsTable.id })
    .from(conversationsTable)
    .where(eq(conversationsTable.userId, userId));

  const totalConversations = conversations.length;

  let totalMessages = 0;
  for (const conv of conversations) {
    const msgs = await db
      .select({ id: messagesTable.id })
      .from(messagesTable)
      .where(eq(messagesTable.conversationId, conv.id));
    totalMessages += msgs.length;
  }

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    plan: user.plan,
    dailyMessagesUsed: user.dailyMessagesUsed,
    dailyLimit: getDailyLimit(user.plan),
    totalConversations,
    totalMessages,
    createdAt: user.createdAt,
  });
});

export default router;
