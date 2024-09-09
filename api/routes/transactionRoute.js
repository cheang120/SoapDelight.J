import express from "express";
// import { protect } from "../middleware/auth.middleware.js";
import { 
    depositFundFLW,
    depositFundStripe,
    getUserTransactions,
  transferFund, 
  verifyAccount,
  webhook, 
//   depositFundStripe, 
//   webhook, 
//   depositFundFLW 
} from "../controllers/transactionController.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// router.post("/transferFund", express.json(), protect, transferFund);
// router.post("/verifyAccount", express.json(), protect, verifyAccount);
// router.get(
//   "/getUserTransactions",
//   express.json(),
//   protect,
//   getUserTransactions
// );
// router.post("/depositFundStripe", express.json(), protect, depositFundStripe);
// router.post("/webhook", express.raw({ type: "application/json" }), webhook);

// router.get("/depositFundFLW", express.json(), depositFundFLW);

export default router