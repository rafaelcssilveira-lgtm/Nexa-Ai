import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import conversationsRouter from "./conversations";
import messagesRouter from "./messages";
import plansRouter from "./plans";
import usersRouter from "./users";
import paymentsRouter from "./payments";
import webhookRouter from "./webhook";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(conversationsRouter);
router.use(messagesRouter);
router.use(plansRouter);
router.use(usersRouter);
router.use(paymentsRouter);
router.use(webhookRouter);

export default router;
