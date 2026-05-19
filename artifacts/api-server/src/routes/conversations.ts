import { Router, type IRouter } from "express";
import { db, conversationsTable, messagesTable } from "@workspace/db";
import { eq, and, count } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { CreateConversationBody, DeleteConversationParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/conversations", requireAuth, async (req, res): Promise<void> => {
  const userId = req.session.userId!;

  const conversations = await db
    .select({
      id: conversationsTable.id,
      title: conversationsTable.title,
      createdAt: conversationsTable.createdAt,
      updatedAt: conversationsTable.updatedAt,
      messageCount: count(messagesTable.id),
    })
    .from(conversationsTable)
    .leftJoin(messagesTable, eq(messagesTable.conversationId, conversationsTable.id))
    .where(eq(conversationsTable.userId, userId))
    .groupBy(conversationsTable.id)
    .orderBy(conversationsTable.updatedAt);

  res.json(conversations.reverse());
});

router.post("/conversations", requireAuth, async (req, res): Promise<void> => {
  const userId = req.session.userId!;

  const parsed = CreateConversationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [conversation] = await db
    .insert(conversationsTable)
    .values({
      userId,
      title: parsed.data.title,
    })
    .returning();

  if (!conversation) {
    res.status(500).json({ error: "Failed to create conversation" });
    return;
  }

  res.status(201).json({
    id: conversation.id,
    title: conversation.title,
    messageCount: 0,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
  });
});

router.delete("/conversations/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = req.session.userId!;

  const params = DeleteConversationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(conversationsTable)
    .where(and(eq(conversationsTable.id, params.data.id), eq(conversationsTable.userId, userId)))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
