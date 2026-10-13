import { Router } from "express";
import { aiSearch, semanticSearch, extractCoupon, askQuestion } from "../controllers/aiController";
import { authenticate } from "../middleware/auth";

const router = Router();

router.use(authenticate);
router.post("/search", aiSearch);
router.post("/semantic-search", semanticSearch);
router.post("/extract", extractCoupon);
router.post("/ask", askQuestion);

export default router;
