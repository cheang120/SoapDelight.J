import express from "express";
import {
  adjustInventoryMovement,
  createInventoryLocation,
  ensureDefaultInventoryLocations,
  getInventoryLocations,
  getInventoryOverview,
  getProductInventory,
  getStockMovements,
  setInitialInventoryBalance,
  transferInventoryMovement,
  updateInventoryLocation,
  updateProductLocationMapping,
} from "../controllers/inventoryController.js";
import { authorOnly, protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect, authorOnly);

router.get("/locations", getInventoryLocations);
router.post("/locations", createInventoryLocation);
router.post("/locations/ensure-defaults", ensureDefaultInventoryLocations);
router.patch("/locations/:id", updateInventoryLocation);
router.get("/overview", getInventoryOverview);
router.get("/products/:productId", getProductInventory);
router.patch("/products/:productId/location-mapping", updateProductLocationMapping);
router.post("/balances/initial", setInitialInventoryBalance);
router.post("/movements/adjust", adjustInventoryMovement);
router.post("/movements/transfer", transferInventoryMovement);
router.get("/movements", getStockMovements);

export default router;
