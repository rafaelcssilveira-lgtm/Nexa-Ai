import { Router, type IRouter } from "express";
import { db, messagesTable, conversationsTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, getDailyLimit, shouldResetDailyMessages } from "../lib/auth";
import { generateAiResponse } from "../lib/ai";
import { SendMessageBody, SendMessageParams, ListMessagesParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/conversations/:id/messages", requireAuth, async (req, res): Promise<void> => {
  const userId = req.session.userId!;

  const params = ListMessagesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [conversation] = await db
    .select()
    .from(conversationsTable)
    .where(and(eq(conversationsTable.id, params.data.id), eq(conversationsTable.userId, userId)));

  if (!conversation) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  const messages = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.conversationId, params.data.id))
    .orderBy(messagesTable.createdAt);

  res.json(messages);
});

router.post("/conversations/:id/messages", requireAuth, async (req, res): Promise<void> => {
  const userId = req.session.userId!;

  const params = SendMessageParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = SendMessageBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [conversation] = await db
    .select()
    .from(conversationsTable)
    .where(and(eq(conversationsTable.id, params.data.id), eq(conversationsTable.userId, userId)));

  if (!conversation) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  let { dailyMessagesUsed, dailyResetAt } = user;

  if (shouldResetDailyMessages(dailyResetAt)) {
    dailyMessagesUsed = 0;
    await db
      .update(usersTable)
      .set({ dailyMessagesUsed: 0, dailyResetAt: new Date() })
      .where(eq(usersTable.id, userId));
  }

  const dailyLimit = getDailyLimit(user.plan);

  if (dailyMessagesUsed >= dailyLimit) {
    res.status(429).json({ error: `Daily message limit reached (${dailyLimit} messages). Upgrade to PRO for unlimited messages.` });
    return;
  }

  const [userMessage] = await db
    .insert(messagesTable)
    .values({
      conversationId: params.data.id,
      role: "user",
      content: body.data.content,
    })
    .returning();

  if (!userMessage) {
    res.status(500).json({ error: "Failed to save message" });
    return;
  }

  const history = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.conversationId, params.data.id))
    .orderBy(messagesTable.createdAt);

  const aiMessages = history.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  const aiContent = await generateAiResponse(aiMessages, user.plan === "pro");

  const [assistantMessage] = await db
    .insert(messagesTable)
    .values({
      conversationId: params.data.id,
      role: "assistant",
      content: aiContent,
    })
    .returning();

  if (!assistantMessage) {
    res.status(500).json({ error: "Failed to save AI response" });
    return;
  }

  const newDailyCount = dailyMessagesUsed + 1;
  await db
    .update(usersTable)
    .set({ dailyMessagesUsed: newDailyCount })
    .where(eq(usersTable.id, userId));

  await db
    .update(conversationsTable)
    .set({ updatedAt: new Date() })
    .where(eq(conversationsTable.id, params.data.id));

  res.status(201).json({
    userMessage,
    assistantMessage,
    dailyMessagesUsed: newDailyCount,
    dailyLimit,
  });
});

export default router;
