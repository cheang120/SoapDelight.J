import express from "express";
// import { protect } from "../middleware/auth.middleware.js";
import { 
    getUserTransactions,
  transferFund, 
  verifyAccount, 
//   depositFundStripe, 
//   webhook, 
//   depositFundFLW 
} from "../controllers/transactionController.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/transferFund", express.json(), protect, transferFund);
router.post("/verifyAccount", express.json(), protect, verifyAccount);
router.post(
  "/getUserTransactions",
  express.json(),
  protect,
  getUserTransactions
);
// router.post("/depositFundStripe", express.json(), protect, depositFundStripe);
// router.post("/webhook", express.raw({ type: "application/json" }), webhook);

// router.get("/depositFundFLW", express.json(), depositFundFLW);

export default router