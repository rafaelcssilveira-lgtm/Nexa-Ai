import { Router, type IRouter } from "express";
import { db, paymentsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { CreatePaymentPreferenceBody } from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const PLANS: Record<string, { name: string; price: number; currency: string }> = {
  pro: { name: "Nexa PRO", price: 29.90, currency: "BRL" },
};

router.post("/payments/create-preference", requireAuth, async (req, res): Promise<void> => {
  const userId = req.session.userId!;

  const parsed = CreatePaymentPreferenceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { planId } = parsed.data;
  const plan = PLANS[planId];

  if (!plan) {
    res.status(400).json({ error: "Invalid plan" });
    return;
  }

  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

  if (!accessToken) {
    req.log.warn("MERCADO_PAGO_ACCESS_TOKEN not set — returning sandbox preference");

    const [payment] = await db.insert(paymentsTable).values({
      userId,
      preferenceId: `sandbox_${Date.now()}`,
      status: "pending",
      plan: planId,
      amount: String(plan.price),
    }).returning();

    res.json({
      id: payment?.preferenceId ?? `sandbox_${Date.now()}`,
      initPoint: `https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=sandbox_demo`,
      sandboxInitPoint: `https://sandbox.mercadopago.com.br/checkout/v1/redirect?pref_id=sandbox_demo`,
    });
    return;
  }

  try {
    const domains = process.env.REPLIT_DOMAINS?.split(",")[0] ?? "localhost";
    const baseUrl = `https://${domains}`;

    const preferenceData = {
      items: [
        {
          id: planId,
          title: plan.name,
          quantity: 1,
          unit_price: plan.price,
          currency_id: plan.currency,
        },
      ],
      payer: {
        email: req.session.userId ? undefined : undefined,
      },
      back_urls: {
        success: `${baseUrl}/plans?payment=success`,
        failure: `${baseUrl}/plans?payment=failure`,
        pending: `${baseUrl}/plans?payment=pending`,
      },
      auto_return: "approved",
      notification_url: `${baseUrl}/api/webhook/mercadopago`,
      metadata: {
        user_id: String(userId),
        plan_id: planId,
      },
    };

    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(preferenceData),
    });

    if (!response.ok) {
      const err = await response.text();
      logger.error({ status: response.status, err }, "MercadoPago API error");
      res.status(500).json({ error: "Failed to create payment preference" });
      return;
    }

    const data = (await response.json()) as {
      id: string;
      init_point: string;
      sandbox_init_point: string;
    };

    await db.insert(paymentsTable).values({
      userId,
      preferenceId: data.id,
      status: "pending",
      plan: planId,
      amount: String(plan.price),
    });

    res.json({
      id: data.id,
      initPoint: data.init_point,
      sandboxInitPoint: data.sandbox_init_point,
    });
  } catch (err) {
    logger.error({ err }, "Error creating payment preference");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
