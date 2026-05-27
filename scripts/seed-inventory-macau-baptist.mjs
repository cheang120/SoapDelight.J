import dotenv from "dotenv";
import mongoose from "mongoose";
import Product from "../api/models/productModel.js";
import InventoryLocation from "../api/models/inventoryLocationModel.js";
import ProductLocationMapping from "../api/models/productLocationMappingModel.js";
import InventoryBalance from "../api/models/inventoryBalanceModel.js";
import StockMovement from "../api/models/stockMovementModel.js";

dotenv.config({ path: "api/.env" });

const SOURCE_DOCUMENT =
  "D2448_SoapDelight.J_存貨情況_截至_2026.03.31.pdf";
const SOURCE_DATE = new Date("2026-03-31T00:00:00.000Z");
const EXPECTED_TOTAL = 77;

const DEFAULT_LOCATIONS = [
  {
    name: "Central Stock",
    code: "CENTRAL",
    type: "central",
    commissionRate: 0,
  },
  {
    name: "Online Stock",
    code: "ONLINE",
    type: "online",
    commissionRate: 0,
  },
  {
    name: "澳門浸信書局 / Macau Baptist Bookstore",
    code: "MACAU_BAPTIST",
    type: "consignment",
    commissionRate: 30,
  },
];

const STOCK_ROWS = [
  { locationSku: "SDJC01-D2448", name: "油畫蠟燭", unit: "個", quantity: 3 },
  { locationSku: "SDJC02-D2448", name: "手工淘瓷杯 (大)", unit: "個", quantity: 1 },
  { locationSku: "SDJC03-D2448", name: "手工淘瓷杯 (小)", unit: "個", quantity: 2 },
  { locationSku: "SDJC04-D2448", name: "海洋系列杯裝蠟燭 (高腳)", unit: "個", quantity: 2 },
  { locationSku: "SDJC06-D2448", name: "石膏杯裝蠟燭", unit: "個", quantity: 1 },
  { locationSku: "SDJC07-D2448", name: "藤籃杯裝蠟燭", unit: "個", quantity: 1 },
  { locationSku: "SDJC08-D2448", name: "朱古力奶蠟燭", unit: "個", quantity: 2 },
  { locationSku: "SDJC09-D2448", name: "西柚茶蠟燭", unit: "個", quantity: 2 },
  { locationSku: "SDJC10-D2448", name: "雪糕甜品蠟燭", unit: "個", quantity: 2 },
  { locationSku: "SDJC13-D2448", name: "雲朵蠟燭", unit: "個", quantity: 2 },
  { locationSku: "SDJC15-D2448", name: "杯裝油畫蠟燭", unit: "個", quantity: 2 },
  { locationSku: "SDJC16-D2448", name: "國風油畫蠟燭", unit: "個", quantity: 2 },
  { locationSku: "SDJC17-2-D2448", name: "薰衣草甘菊沐浴慕斯 (1套2支)", unit: "套", quantity: 8 },
  { locationSku: "SDJC17-D2448", name: "薰衣草甘菊沐浴慕斯", unit: "樽", quantity: 14 },
  { locationSku: "SDJC19-D2448", name: "熔岩朱古力蛋糕蠟燭", unit: "個", quantity: 1 },
  { locationSku: "SDJC20-D2448", name: "紫色甜品小杯", unit: "個", quantity: 1 },
  { locationSku: "SDJC22A-D2448", name: "牛角包蠟燭", unit: "個", quantity: 1 },
  { locationSku: "SDJL01-D2448", name: "木屋小燈 My grace is sufficient for you", unit: "個", quantity: 2 },
  { locationSku: "SDJL02-D2448", name: "木屋小燈 We love because he first loved", unit: "個", quantity: 2 },
  { locationSku: "SDJL03-D2448", name: "木屋小燈 Faith Hope Love", unit: "個", quantity: 2 },
  { locationSku: "SDJL04-D2448", name: "長形橙箱 The Lord is my Shepherd", unit: "個", quantity: 5 },
  { locationSku: "SDJP01-D2448", name: "香水 (Grateful)", unit: "支", quantity: 12 },
  { locationSku: "SDJP02-D2448", name: "香水 (Joyful)", unit: "支", quantity: 4 },
  { locationSku: "SDJP03-D2448", name: "花果香草無火香薰", unit: "支", quantity: 1 },
  { locationSku: "SDJS04-D2448", name: "多用途石膏盤", unit: "個", quantity: 2 },
];

const inferCategory = (name) => {
  if (name.includes("蠟燭") || name.includes("香薰")) return "香薰蠟";
  if (name.includes("沐浴") || name.includes("香水")) return "個人護理";
  return "精選禮物";
};

const centralSkuFromLocationSku = (locationSku) =>
  locationSku.replace(/-D2448$/i, "");

const ensureDefaultLocations = async () => {
  const locations = {};
  for (const location of DEFAULT_LOCATIONS) {
    const savedLocation = await InventoryLocation.findOneAndUpdate(
      { code: location.code },
      { $set: { ...location, active: true } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    locations[location.code] = savedLocation;
  }
  return locations;
};

const findOrCreateProduct = async (row) => {
  let product = await Product.findOne({ sku: row.locationSku });
  let matched = Boolean(product);

  if (!product) {
    product = await Product.findOne({ name: row.name.trim() });
    matched = Boolean(product);
  }

  if (product) {
    return { product, matched, created: false };
  }

  product = await Product.create({
    name: row.name.trim(),
    sku: centralSkuFromLocationSku(row.locationSku),
    category: inferCategory(row.name),
    brand: "SoapDelight.J",
    color: "As seen",
    quantity: 0,
    price: "0",
    regularPrice: "0",
    description:
      "Imported from Macau Baptist Bookstore stock report. Please update product details.",
    image: [],
  });

  return { product, matched: false, created: true };
};

const upsertBalance = (productId, locationId, quantity) =>
  InventoryBalance.findOneAndUpdate(
    { productId, locationId },
    { $set: { quantity } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

const run = async () => {
  if (!process.env.MONGO) {
    throw new Error("Missing MONGO connection string.");
  }

  await mongoose.connect(process.env.MONGO);

  const locations = await ensureDefaultLocations();
  let matchedProducts = 0;
  let autoCreatedProducts = 0;
  let createdMovements = 0;

  for (const row of STOCK_ROWS) {
    const { product, matched, created } = await findOrCreateProduct(row);
    if (matched) matchedProducts += 1;
    if (created) autoCreatedProducts += 1;

    await ProductLocationMapping.findOneAndUpdate(
      { productId: product._id, locationId: locations.MACAU_BAPTIST._id },
      {
        $set: {
          centralSku: product.sku || "",
          locationSku: row.locationSku,
          locationProductName: row.name,
          commissionRate: 30,
          active: true,
          notes: `Imported unit: ${row.unit}`,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    await Promise.all([
      upsertBalance(product._id, locations.CENTRAL._id, 0),
      upsertBalance(product._id, locations.ONLINE._id, 0),
      upsertBalance(product._id, locations.MACAU_BAPTIST._id, row.quantity),
    ]);

    const existingMovement = await StockMovement.findOne({
      productId: product._id,
      toLocationId: locations.MACAU_BAPTIST._id,
      type: "initial_stock",
      sourceDocument: SOURCE_DOCUMENT,
    });

    if (!existingMovement) {
      await StockMovement.create({
        productId: product._id,
        fromLocationId: null,
        toLocationId: locations.MACAU_BAPTIST._id,
        quantity: row.quantity,
        type: "initial_stock",
        direction: "in",
        note: "Initial Macau Baptist Bookstore stock import.",
        sourceDocument: SOURCE_DOCUMENT,
        sourceDate: SOURCE_DATE,
      });
      createdMovements += 1;
    }
  }

  const totalQuantityImported = STOCK_ROWS.reduce(
    (total, row) => total + row.quantity,
    0
  );

  console.log("Inventory seed complete.");
  console.log(`Matched products: ${matchedProducts}`);
  console.log(`Auto-created products: ${autoCreatedProducts}`);
  console.log(`Created movements: ${createdMovements}`);
  console.log(`Total quantity imported: ${totalQuantityImported}`);
  console.log(`Expected total quantity: ${EXPECTED_TOTAL}`);

  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error(error.message);
  await mongoose.disconnect();
  process.exit(1);
});
