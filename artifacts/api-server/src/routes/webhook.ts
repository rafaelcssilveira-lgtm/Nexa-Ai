import { Router, type IRouter } from "express";
import { db, paymentsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.post("/webhook/mercadopago", async (req, res): Promise<void> => {
  const { type, data } = req.body as { type?: string; data?: { id?: string } };

  req.log.info({ type, dataId: data?.id }, "MercadoPago webhook received");

  if (type !== "payment") {
    res.json({ success: true });
    return;
  }

  const paymentId = data?.id;
  if (!paymentId) {
    res.json({ success: true });
    return;
  }

  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!accessToken) {
    req.log.warn("MERCADO_PAGO_ACCESS_TOKEN not set — skipping webhook processing");
    res.json({ success: true });
    return;
  }

  try {
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      req.log.error({ status: response.status, paymentId }, "Failed to fetch payment from MercadoPago");
      res.json({ success: true });
      return;
    }

    const payment = (await response.json()) as {
      status: string;
      external_reference?: string;
      metadata?: { user_id?: string; plan_id?: string };
    };

    req.log.info({ status: payment.status, paymentId }, "Payment status from MercadoPago");

    if (payment.status !== "approved") {
      await db
        .update(paymentsTable)
        .set({ status: payment.status, externalId: paymentId })
        .where(eq(paymentsTable.externalId, paymentId));

      res.json({ success: true });
      return;
    }

    const userId = payment.metadata?.user_id
      ? parseInt(payment.metadata.user_id, 10)
      : null;

    const planId = payment.metadata?.plan_id ?? "pro";

    if (!userId || isNaN(userId)) {
      req.log.error({ paymentId, metadata: payment.metadata }, "Could not extract user_id from payment");
      res.json({ success: true });
      return;
    }

    await db
      .update(usersTable)
      .set({ plan: planId })
      .where(eq(usersTable.id, userId));

    await db
      .update(paymentsTable)
      .set({ status: "approved", externalId: paymentId })
      .where(eq(paymentsTable.externalId, paymentId));

    logger.info({ userId, planId, paymentId }, "User plan upgraded via webhook");

    res.json({ success: true });
  } catch (err) {
    logger.error({ err, paymentId }, "Error processing webhook");
    res.json({ success: true });
  }
});

export default router;
