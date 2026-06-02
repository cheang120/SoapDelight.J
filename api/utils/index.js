import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import Stripe from "stripe"
import Product from '../models/productModel.js'
import InventoryLocation from "../models/inventoryLocationModel.js";
import InventoryBalance from "../models/inventoryBalanceModel.js";
import StockMovement from "../models/stockMovementModel.js";
// import Product from '../models/productModel'
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)


export const generateToken = (id) => {
    return jwt.sign({id}, process.env.JWT_SECRET, {expiresIn:"1d"})
}

// Hash Token
export const hashToken = (token) => {
    return crypto.createHash("sha256").update(token.toString()).digest("hex");
};

// function calculateTotalPrice(products, cartItems) {
//     let totalPrice = 0;
  
//     cartItems.forEach(function (cartItem) {
//       const product = products.find(function (product) {
//         return product._id?.toString() === cartItem._id;
//       });
  
//       if (product) {
//         const quantity = cartItem.cartQuantity;
//         const price = parseFloat(product.price);
//         totalPrice += quantity * price;
//       }
//     });
  
//     return totalPrice;
//   }

export const calculateTotalPrice = (products, cartItems) => {
        let totalPrice = 0;
  
        cartItems.forEach(function (cartItem) {
            const product = products.find(function (product) {
            return product._id?.toString() === cartItem._id;
        });
  
            if (product) {
                const quantity = cartItem.cartQuantity;
                const price = parseFloat(product.price);
                totalPrice += quantity * price;
            }
        });
  
    return totalPrice;
}


const throwStockError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
};

export const updateProductQuantity = async (
  cartItems,
  { orderId, createdBy, session } = {}
) => {
  const productItems = (Array.isArray(cartItems) ? cartItems : []).filter(
    (item) => item?.category !== "Shipping"
  );
  const requiredByProduct = new Map();

  for (const item of productItems) {
    const productId = String(item?._id || "").trim();
    const quantity = Number(item?.cartQuantity || 0);

    if (!productId) {
      throwStockError("購物車商品資料不完整");
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      throwStockError("購物車商品數量必須大於 0");
    }

    requiredByProduct.set(
      productId,
      Number(requiredByProduct.get(productId) || 0) + quantity
    );
  }

  if (requiredByProduct.size === 0) {
    throwStockError("購物車沒有可建立訂單的商品");
  }

  const onlineLocation = await InventoryLocation.findOne({
    code: "ONLINE",
    active: { $ne: false },
  }).session(session);

  if (!onlineLocation) {
    throwStockError("找不到可用的 ONLINE 網店存貨地點");
  }

  const productIds = Array.from(requiredByProduct.keys());
  const [products, balances] = await Promise.all([
    Product.find({ _id: { $in: productIds } }).session(session),
    InventoryBalance.find({
      productId: { $in: productIds },
      locationId: onlineLocation._id,
    }).session(session),
  ]);

  const productById = new Map(
    products.map((product) => [String(product._id), product])
  );
  const balanceByProductId = new Map(
    balances.map((balance) => [String(balance.productId), balance])
  );

  for (const [productId, requiredQuantity] of requiredByProduct.entries()) {
    const product = productById.get(productId);

    if (!product) {
      throwStockError("購物車內有找不到的商品");
    }

    if ((product.productStatus || "active") !== "active") {
      throwStockError(`商品暫未能於網店購買：${product.name}`);
    }

    const availableQuantity = Number(
      balanceByProductId.get(productId)?.quantity || 0
    );

    if (availableQuantity < requiredQuantity) {
      throwStockError(
        `網店庫存不足：${product.name}，可用 ${availableQuantity}，需要 ${requiredQuantity}`
      );
    }
  }

  const movements = [];
  const productUpdates = [];

  for (const [productId, requiredQuantity] of requiredByProduct.entries()) {
    const product = productById.get(productId);
    const updatedBalance = await InventoryBalance.findOneAndUpdate(
      {
        productId,
        locationId: onlineLocation._id,
        quantity: { $gte: requiredQuantity },
      },
      {
        $inc: {
          quantity: -requiredQuantity,
        },
      },
      {
        new: true,
        session,
      }
    );

    if (!updatedBalance) {
      const latestBalance = await InventoryBalance.findOne({
        productId,
        locationId: onlineLocation._id,
      }).session(session);
      const availableQuantity = Number(latestBalance?.quantity || 0);

      throwStockError(
        `網店庫存不足：${product.name}，可用 ${availableQuantity}，需要 ${requiredQuantity}`
      );
    }

    productUpdates.push({
      updateOne: {
        filter: { _id: productId },
        update: {
          $inc: {
            sold: requiredQuantity,
          },
        },
      },
    });

    movements.push({
      productId,
      fromLocationId: onlineLocation._id,
      toLocationId: null,
      quantity: requiredQuantity,
      type: "online_sold",
      direction: "out",
      referenceType: "Order",
      referenceId: orderId,
      sourceDocument: String(orderId || ""),
      note: "Online order stock deducted from ONLINE inventory",
      createdBy,
    });
  }

  if (productUpdates.length > 0) {
    await Product.bulkWrite(productUpdates, { session });
  }

  if (movements.length > 0) {
    await StockMovement.create(movements, { session });
  }
};

export const restoreOnlineStockForCancelledOrder = async (
  order,
  { createdBy, stripeRefundId, session } = {}
) => {
  if (!order?._id) {
    throwStockError("找不到需要補回庫存的訂單");
  }

  if (order.stockRestoreStatus === "restored") {
    return { restored: false };
  }

  const productItems = (Array.isArray(order.cartItems) ? order.cartItems : []).filter(
    (item) => item?.category !== "Shipping"
  );
  const restoreByProduct = new Map();

  for (const item of productItems) {
    const productId = String(item?._id || "").trim();
    const quantity = Number(item?.cartQuantity || 0);

    if (!productId || !Number.isFinite(quantity) || quantity <= 0) {
      throwStockError("訂單商品資料不完整，未能補回網店庫存");
    }

    restoreByProduct.set(
      productId,
      Number(restoreByProduct.get(productId) || 0) + quantity
    );
  }

  if (restoreByProduct.size === 0) {
    throwStockError("訂單沒有可補回網店庫存的商品");
  }

  const onlineLocation = await InventoryLocation.findOne({
    code: "ONLINE",
  }).session(session);

  if (!onlineLocation) {
    throwStockError("找不到 ONLINE 網店存貨地點");
  }

  const movements = [];

  for (const [productId, quantity] of restoreByProduct.entries()) {
    await InventoryBalance.findOneAndUpdate(
      {
        productId,
        locationId: onlineLocation._id,
      },
      {
        $inc: {
          quantity,
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
        session,
      }
    );

    movements.push({
      productId,
      fromLocationId: null,
      toLocationId: onlineLocation._id,
      quantity,
      type: "order_cancel_restore",
      direction: "in",
      referenceType: "Order",
      referenceId: order._id,
      sourceDocument: stripeRefundId || String(order._id),
      note: "Refund succeeded; restored cancelled online order stock to ONLINE inventory",
      createdBy,
    });
  }

  await StockMovement.create(movements, { session });

  return { restored: true };
};
