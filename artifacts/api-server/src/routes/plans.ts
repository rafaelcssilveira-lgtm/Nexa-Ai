import { Router, type IRouter } from "express";
import { FREE_DAILY_LIMIT, PRO_DAILY_LIMIT } from "../lib/auth";

const router: IRouter = Router();

router.get("/plans", (_req, res): void => {
  res.json([
    {
      id: "free",
      name: "Free",
      price: 0,
      currency: "BRL",
      features: [
        `${FREE_DAILY_LIMIT} messages per day`,
        "Standard AI responses",
        "Conversation history",
        "Basic support",
      ],
      dailyLimit: FREE_DAILY_LIMIT,
      recommended: false,
    },
    {
      id: "pro",
      name: "Pro",
      price: 29.90,
      currency: "BRL",
      features: [
        "Unlimited messages",
        "Priority AI responses",
        "Advanced AI model",
        "Conversation history",
        "PRO badge",
        "Priority support",
        "Faster responses",
      ],
      dailyLimit: PRO_DAILY_LIMIT,
      recommended: true,
    },
  ]);
});

export default router;
