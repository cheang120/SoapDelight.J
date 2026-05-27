import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import Product from "../models/productModel.js";
import InventoryLocation from "../models/inventoryLocationModel.js";
import ProductLocationMapping from "../models/productLocationMappingModel.js";
import InventoryBalance from "../models/inventoryBalanceModel.js";
import StockMovement from "../models/stockMovementModel.js";

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

const normalizeCode = (code) => String(code || "").trim().toUpperCase();
const toObjectIdString = (value) => String(value || "");
const getProductImageStatus = (product) => {
  const image = product?.image;
  const hasImage = Array.isArray(image)
    ? image.some((item) => typeof item === "string" && item.trim())
    : typeof image === "string" && image.trim();
  return hasImage ? "Real photo" : "Placeholder";
};

const toNonNegativeNumber = (value, fieldName) => {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    const error = new Error(`${fieldName} must be zero or greater`);
    error.statusCode = 400;
    throw error;
  }
  return number;
};

const getLocation = async ({ locationId, locationCode }) => {
  if (locationId) {
    const location = await InventoryLocation.findById(locationId);
    if (location) return location;
  }

  const code = normalizeCode(locationCode);
  if (code) {
    const location = await InventoryLocation.findOne({ code });
    if (location) return location;
  }

  const error = new Error("Inventory location not found");
  error.statusCode = 404;
  throw error;
};

const getOrCreateBalance = async (productId, locationId) => {
  const balance = await InventoryBalance.findOne({ productId, locationId });
  if (balance) return balance;

  return InventoryBalance.create({ productId, locationId, quantity: 0 });
};

const upsertMapping = async ({
  product,
  location,
  locationSku,
  locationProductName,
  commissionRate,
  notes,
}) => {
  const setFields = {
    centralSku: product?.sku || "",
    locationProductName: locationProductName?.trim() || product?.name || "",
    commissionRate: Number.isFinite(Number(commissionRate))
      ? Number(commissionRate)
      : Number(location?.commissionRate || 0),
    active: true,
    notes: notes?.trim() || "",
  };

  const normalizedLocationSku = locationSku?.trim();
  const update = { $set: setFields };
  if (normalizedLocationSku) {
    setFields.locationSku = normalizedLocationSku;
  } else {
    update.$unset = { locationSku: "" };
  }

  return ProductLocationMapping.findOneAndUpdate(
    { productId: product._id, locationId: location._id },
    update,
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
};

const ensureDefaultLocationRecords = async () => {
  const locations = [];

  for (const location of DEFAULT_LOCATIONS) {
    const savedLocation = await InventoryLocation.findOneAndUpdate(
      { code: location.code },
      {
        $set: {
          name: location.name,
          type: location.type,
          commissionRate: location.commissionRate,
          active: true,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    locations.push(savedLocation);
  }

  return locations;
};

export const ensureDefaultInventoryLocations = asyncHandler(async (req, res) => {
  const locations = await ensureDefaultLocationRecords();
  res.status(200).json({ message: "Default inventory locations ensured", locations });
});

export const getInventoryLocations = asyncHandler(async (req, res) => {
  const locations = await InventoryLocation.find().sort({ type: 1, name: 1 });
  res.status(200).json(locations);
});

const LOCATION_TYPES = ["central", "online", "consignment", "other"];

const normalizeLocationText = (value) => String(value || "").trim();

const normalizeActiveValue = (value, fallback = true) => {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
};

const buildLocationPayload = (body = {}, { isUpdate = false } = {}) => {
  const payload = {};

  if (!isUpdate || body.name !== undefined) {
    const name = normalizeLocationText(body.name);
    if (!name) {
      const error = new Error("Location name is required");
      error.statusCode = 400;
      throw error;
    }
    payload.name = name;
  }

  if (!isUpdate || body.code !== undefined) {
    const code = normalizeCode(body.code);
    if (!code) {
      const error = new Error("Location code is required");
      error.statusCode = 400;
      throw error;
    }
    payload.code = code;
  }

  if (!isUpdate || body.type !== undefined) {
    const type = normalizeLocationText(body.type).toLowerCase();
    if (!LOCATION_TYPES.includes(type)) {
      const error = new Error("Location type is invalid");
      error.statusCode = 400;
      throw error;
    }
    payload.type = type;
  }

  if (!isUpdate || body.commissionRate !== undefined) {
    payload.commissionRate = toNonNegativeNumber(
      body.commissionRate ?? 0,
      "Commission rate"
    );
  }

  if (!isUpdate || body.contactPerson !== undefined) {
    payload.contactPerson = normalizeLocationText(body.contactPerson);
  }
  if (!isUpdate || body.phone !== undefined) {
    payload.phone = normalizeLocationText(body.phone);
  }
  if (!isUpdate || body.address !== undefined) {
    payload.address = normalizeLocationText(body.address);
  }
  if (!isUpdate || body.notes !== undefined) {
    payload.notes = normalizeLocationText(body.notes);
  }
  if (!isUpdate || body.active !== undefined) {
    payload.active = normalizeActiveValue(body.active, true);
  }

  return payload;
};

export const createInventoryLocation = asyncHandler(async (req, res) => {
  const payload = buildLocationPayload(req.body);

  const existing = await InventoryLocation.findOne({ code: payload.code });
  if (existing) {
    res.status(400);
    throw new Error("Location code already exists");
  }

  const location = await InventoryLocation.create(payload);
  res.status(201).json(location);
});

export const updateInventoryLocation = asyncHandler(async (req, res) => {
  const location = await InventoryLocation.findById(req.params.id);

  if (!location) {
    res.status(404);
    throw new Error("Inventory location not found");
  }

  const payload = buildLocationPayload(req.body, { isUpdate: true });

  if (payload.code && payload.code !== location.code) {
    const duplicate = await InventoryLocation.findOne({
      code: payload.code,
      _id: { $ne: location._id },
    });

    if (duplicate) {
      res.status(400);
      throw new Error("Location code already exists");
    }
  }

  Object.assign(location, payload);
  const savedLocation = await location.save();

  res.status(200).json(savedLocation);
});

const buildInventoryRows = async (products) => {
  const productIds = products.map((product) => product._id);

  const [locations, balances, mappings] = await Promise.all([
    InventoryLocation.find().sort({ type: 1, name: 1 }).lean(),
    InventoryBalance.find({ productId: { $in: productIds } }).lean(),
    ProductLocationMapping.find({ productId: { $in: productIds } }).lean(),
  ]);

  const balanceByProductLocation = new Map(
    balances.map((balance) => [
      `${toObjectIdString(balance.productId)}:${toObjectIdString(balance.locationId)}`,
      balance,
    ])
  );
  const mappingByProductLocation = new Map(
    mappings.map((mapping) => [
      `${toObjectIdString(mapping.productId)}:${toObjectIdString(mapping.locationId)}`,
      mapping,
    ])
  );

  const rows = products.map((product) => {
    const publicPrice = Number(product.price || 0);
    const productId = toObjectIdString(product._id);
    const locationRows = locations.map((location) => {
      const locationId = toObjectIdString(location._id);
      const key = `${productId}:${locationId}`;
      const balance = balanceByProductLocation.get(key);
      const mapping = mappingByProductLocation.get(key);
      const commissionRate = Number(
        mapping?.commissionRate ?? location?.commissionRate ?? 0
      );
      const quantity = Number(balance?.quantity || 0);

      return {
        locationId,
        locationName: location.name,
        locationCode: location.code,
        locationType: location.type,
        quantity,
        locationSku: mapping?.locationSku || "",
        locationProductName: mapping?.locationProductName || "",
        commissionRate,
        internalNetPrice: publicPrice * (1 - commissionRate / 100),
      };
    });

    const getQuantityByCode = (code) =>
      locationRows.find((location) => location.locationCode === code)?.quantity || 0;
    const getMappingByCode = (code) => {
      const location = locations.find((item) => item.code === code);
      if (!location) return null;
      return mappingByProductLocation.get(`${productId}:${toObjectIdString(location._id)}`);
    };
    const macauMapping = getMappingByCode("MACAU_BAPTIST");
    const macauLocation = locations.find((location) => location.code === "MACAU_BAPTIST");
    const macauCommissionRate = Number(
      macauMapping?.commissionRate ?? macauLocation?.commissionRate ?? 30
    );
    const consignmentTotal = locationRows
      .filter((location) => location.locationType === "consignment")
      .reduce((total, location) => total + Number(location.quantity || 0), 0);
    const totalStock = locationRows.reduce(
      (total, location) => total + Number(location.quantity || 0),
      0
    );

    return {
      productId,
      name: product.name,
      centralSku: product.sku || "",
      category: product.category,
      brand: product.brand,
      publicPrice,
      image: product.image || [],
      centralStock: getQuantityByCode("CENTRAL"),
      onlineStock: getQuantityByCode("ONLINE"),
      consignmentTotal,
      macauBaptistStock: getQuantityByCode("MACAU_BAPTIST"),
      macauBaptistSku: macauMapping?.locationSku || "",
      macauBaptistCommissionRate: macauCommissionRate,
      macauBaptistInternalNetPrice:
        publicPrice * (1 - macauCommissionRate / 100),
      totalStock,
      imageStatus: getProductImageStatus(product),
      locations: locationRows,
    };
  });

  return rows;
};

export const getInventoryOverview = asyncHandler(async (req, res) => {
  const products = await Product.find().sort("-createdAt").lean();
  const rows = await buildInventoryRows(products);

  res.status(200).json(rows);
});

export const getProductInventory = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.productId).lean();

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  const [row] = await buildInventoryRows([product]);
  res.status(200).json(row);
});

export const updateProductLocationMapping = asyncHandler(async (req, res) => {
  const {
    locationCode,
    locationId,
    locationSku,
    locationProductName,
    commissionRate,
  } = req.body;

  const product = await Product.findById(req.params.productId);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  let location;
  try {
    location = await getLocation({ locationId, locationCode });
  } catch (error) {
    const requestedCode = normalizeCode(locationCode);
    const isDefaultLocation = DEFAULT_LOCATIONS.some(
      (defaultLocation) => defaultLocation.code === requestedCode
    );

    if (!locationId && requestedCode && isDefaultLocation) {
      await ensureDefaultLocationRecords();
      location = await getLocation({ locationCode: requestedCode });
    } else {
      throw error;
    }
  }

  const nextCommissionRate =
    commissionRate === "" || commissionRate === undefined || commissionRate === null
      ? Number(location.commissionRate || 0)
      : Number(commissionRate);

  if (!Number.isFinite(nextCommissionRate) || nextCommissionRate < 0) {
    res.status(400);
    throw new Error("Commission rate must be zero or greater");
  }

  const mapping = await upsertMapping({
    product,
    location,
    locationSku,
    locationProductName,
    commissionRate: nextCommissionRate,
  });

  const [row] = await buildInventoryRows([product.toObject()]);

  res.status(200).json({ mapping, inventory: row });
});

export const setInitialInventoryBalance = asyncHandler(async (req, res) => {
  const {
    productId,
    locationCode,
    locationId,
    quantity,
    locationSku,
    locationProductName,
    note,
    sourceDocument,
    sourceDate,
  } = req.body;

  const initialQuantity = toNonNegativeNumber(quantity, "Quantity");
  const [product, location] = await Promise.all([
    Product.findById(productId),
    getLocation({ locationId, locationCode }),
  ]);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  const mapping = await upsertMapping({
    product,
    location,
    locationSku,
    locationProductName,
    commissionRate: location.commissionRate,
    notes: note,
  });

  const balance = await InventoryBalance.findOneAndUpdate(
    { productId: product._id, locationId: location._id },
    { $set: { quantity: initialQuantity } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  const duplicateQuery = {
    productId: product._id,
    toLocationId: location._id,
    type: "initial_stock",
  };

  if (sourceDocument?.trim()) {
    duplicateQuery.sourceDocument = sourceDocument.trim();
  }

  const existingMovement = sourceDocument?.trim()
    ? await StockMovement.findOne(duplicateQuery)
    : null;

  const movement =
    existingMovement ||
    (await StockMovement.create({
      productId: product._id,
      fromLocationId: null,
      toLocationId: location._id,
      quantity: initialQuantity,
      type: "initial_stock",
      direction: "in",
      note: note?.trim() || "",
      sourceDocument: sourceDocument?.trim() || "",
      sourceDate: sourceDate ? new Date(sourceDate) : undefined,
      createdBy: req.user?._id,
    }));

  res.status(200).json({ balance, mapping, movement });
});

export const adjustInventoryMovement = asyncHandler(async (req, res) => {
  const {
    productId,
    locationCode,
    locationId,
    newQuantity,
    adjustmentQuantity,
    note,
  } = req.body;

  const [product, location] = await Promise.all([
    Product.findById(productId),
    getLocation({ locationId, locationCode }),
  ]);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  const balance = await getOrCreateBalance(product._id, location._id);
  const currentQuantity = Number(balance.quantity || 0);
  const targetQuantity =
    newQuantity !== undefined
      ? toNonNegativeNumber(newQuantity, "New quantity")
      : currentQuantity + Number(adjustmentQuantity || 0);

  if (!Number.isFinite(targetQuantity) || targetQuantity < 0) {
    res.status(400);
    throw new Error("Adjusted quantity cannot be negative");
  }

  const delta = targetQuantity - currentQuantity;
  balance.quantity = targetQuantity;
  await balance.save();

  const movement = await StockMovement.create({
    productId: product._id,
    fromLocationId: delta < 0 ? location._id : null,
    toLocationId: delta >= 0 ? location._id : null,
    quantity: Math.abs(delta),
    type: "adjustment",
    direction: "adjustment",
    note: note?.trim() || "",
    createdBy: req.user?._id,
  });

  res.status(200).json({ balance, movement });
});

export const createProductionInMovement = asyncHandler(async (req, res) => {
  const { productId, toLocationId, toLocationCode = "CENTRAL", quantity, note } = req.body;

  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  const toLocation = await getLocation({
    locationId: toLocationId,
    locationCode: toLocationCode,
  });

  const movementQuantity = Number(quantity);
  if (!Number.isFinite(movementQuantity) || movementQuantity <= 0) {
    res.status(400);
    throw new Error("Quantity must be greater than zero");
  }

  const balance = await getOrCreateBalance(product._id, toLocation._id);
  balance.quantity = Number(balance.quantity || 0) + movementQuantity;
  await balance.save();

  const movement = await StockMovement.create({
    productId: product._id,
    fromLocationId: null,
    toLocationId: toLocation._id,
    quantity: movementQuantity,
    type: "production_in",
    direction: "in",
    note: note?.trim() || "",
    createdBy: req.user?._id,
  });

  res.status(201).json({
    message: "Stock added successfully",
    movement,
    balance,
  });
});

export const transferInventoryMovement = asyncHandler(async (req, res) => {
  const {
    productId,
    fromLocationCode,
    fromLocationId,
    toLocationCode,
    toLocationId,
    quantity,
    note,
  } = req.body;

  const transferQuantity = toNonNegativeNumber(quantity, "Quantity");
  if (transferQuantity <= 0) {
    res.status(400);
    throw new Error("Transfer quantity must be greater than zero");
  }

  const [product, fromLocation, toLocation] = await Promise.all([
    Product.findById(productId),
    getLocation({ locationId: fromLocationId, locationCode: fromLocationCode }),
    getLocation({ locationId: toLocationId, locationCode: toLocationCode }),
  ]);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  if (String(fromLocation._id) === String(toLocation._id)) {
    res.status(400);
    throw new Error("Transfer locations must be different");
  }

  const [fromBalance, toBalance] = await Promise.all([
    getOrCreateBalance(product._id, fromLocation._id),
    getOrCreateBalance(product._id, toLocation._id),
  ]);

  if (Number(fromBalance.quantity || 0) < transferQuantity) {
    res.status(400);
    throw new Error("Not enough stock at source location");
  }

  fromBalance.quantity = Number(fromBalance.quantity || 0) - transferQuantity;
  toBalance.quantity = Number(toBalance.quantity || 0) + transferQuantity;
  await Promise.all([fromBalance.save(), toBalance.save()]);

  const movement = await StockMovement.create({
    productId: product._id,
    fromLocationId: fromLocation._id,
    toLocationId: toLocation._id,
    quantity: transferQuantity,
    type: "transfer",
    direction: "transfer",
    note: note?.trim() || "",
    createdBy: req.user?._id,
  });

  res.status(200).json({ fromBalance, toBalance, movement });
});

export const getStockMovements = asyncHandler(async (req, res) => {
  const { productId, locationId, type } = req.query;
  const limit = Math.min(Number(req.query.limit || 100), 500);
  const query = {};

  if (productId && mongoose.Types.ObjectId.isValid(productId)) {
    query.productId = productId;
  }

  if (locationId && mongoose.Types.ObjectId.isValid(locationId)) {
    query.$or = [{ fromLocationId: locationId }, { toLocationId: locationId }];
  }

  if (type) {
    query.type = type;
  }

  const movements = await StockMovement.find(query)
    .populate("productId", "name sku")
    .populate("fromLocationId", "name code")
    .populate("toLocationId", "name code")
    .populate("createdBy", "username email")
    .sort("-createdAt")
    .limit(limit);

  res.status(200).json(movements);
});
