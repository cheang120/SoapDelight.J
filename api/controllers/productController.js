// productController.js
import asyncHandler from 'express-async-handler';
import Product from '../models/productModel.js'
import InventoryLocation from "../models/inventoryLocationModel.js";
import InventoryBalance from "../models/inventoryBalanceModel.js";
import StockMovement from "../models/stockMovementModel.js";
import mongoose from "mongoose";
const { ObjectId } = mongoose.Schema;

const PRODUCT_STATUS_VALUES = ["active", "out_of_stock", "discontinued"];

const normalizeProductImages = (image) => {
  if (Array.isArray(image)) {
    return image.filter((item) => typeof item === "string" && item.trim());
  }
  return typeof image === "string" && image.trim() ? [image.trim()] : [];
};

const normalizeProductStatus = (status) =>
  PRODUCT_STATUS_VALUES.includes(status) ? status : "active";

const shouldIncludeDiscontinued = (query) =>
  String(query?.includeDiscontinued || "").toLowerCase() === "true";

const getOrCreateCentralInventoryLocation = async (session) =>
  InventoryLocation.findOneAndUpdate(
    { code: "CENTRAL" },
    {
      $setOnInsert: {
        name: "Central Stock",
        code: "CENTRAL",
        type: "central",
        commissionRate: 0,
        active: true,
      },
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      session,
    }
  );

const createInitialCentralStockForProduct = async ({
  product,
  quantity,
  createdBy,
  session,
}) => {
  const initialQuantity = Number(quantity || 0);

  if (!Number.isFinite(initialQuantity) || initialQuantity <= 0) {
    return null;
  }

  const centralLocation = await getOrCreateCentralInventoryLocation(session);

  const balance = await InventoryBalance.findOneAndUpdate(
    {
      productId: product._id,
      locationId: centralLocation._id,
    },
    {
      $set: {
        quantity: initialQuantity,
      },
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      session,
    }
  );

  const [movement] = await StockMovement.create(
    [
      {
        productId: product._id,
        fromLocationId: null,
        toLocationId: centralLocation._id,
        quantity: initialQuantity,
        type: "initial_stock",
        direction: "in",
        note: "Initial central stock from product creation",
        sourceDocument: product.sku
          ? `Product creation - ${product.sku}`
          : `Product creation - ${product._id}`,
        createdBy,
      },
    ],
    { session }
  );

  return { balance, movement };
};

const syncCentralStockForProduct = async ({
  product,
  quantity,
  createdBy,
  session,
}) => {
  const nextQuantity = Number(quantity || 0);

  if (!Number.isFinite(nextQuantity) || nextQuantity < 0) {
    throw new Error("Quantity must be zero or greater");
  }

  const centralLocation = await getOrCreateCentralInventoryLocation(session);

  const existingBalance = await InventoryBalance.findOne({
    productId: product._id,
    locationId: centralLocation._id,
  }).session(session);

  const previousQuantity = Number(existingBalance?.quantity || 0);

  const balance = await InventoryBalance.findOneAndUpdate(
    {
      productId: product._id,
      locationId: centralLocation._id,
    },
    {
      $set: {
        quantity: nextQuantity,
      },
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      session,
    }
  );

  const diff = nextQuantity - previousQuantity;
  let movement = null;

  if (diff !== 0) {
    const [createdMovement] = await StockMovement.create(
      [
        {
          productId: product._id,
          fromLocationId: null,
          toLocationId: centralLocation._id,
          quantity: Math.abs(diff),
          type: "adjustment",
          direction: "adjustment",
          note: `Central stock synced from product edit (${previousQuantity} -> ${nextQuantity})`,
          sourceDocument: product.sku
            ? `Product edit - ${product.sku}`
            : `Product edit - ${product._id}`,
          createdBy,
        },
      ],
      { session }
    );

    movement = createdMovement;
  }

  return { balance, movement };
};

export const createProduct = asyncHandler(async (req, res, next) => {
    const {
        name,
        sku,
        category,
        brand,
        quantity,
        price,
        description,
        image,
        regularPrice,
        color,
        productStatus,
        isFeatured,
        featuredOrder,
    } = req.body;

  const hasQuantity =
    quantity !== undefined && quantity !== null && String(quantity).trim() !== "";

  if (!name || !category || !brand || !hasQuantity || !price || !description) {
    res.status(400);
    throw new Error("Please fill in all fields");
  }

  const initialQuantity = Number(quantity);

  if (!Number.isFinite(initialQuantity) || initialQuantity < 0) {
    res.status(400);
    throw new Error("Quantity must be zero or greater");
  }

  let product;
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const createdProducts = await Product.create(
        [
          {
            name,
            sku,
            category,
            quantity: initialQuantity,
            brand,
            price,
            description,
            image: normalizeProductImages(image),
            regularPrice,
            color,
            productStatus: normalizeProductStatus(productStatus),
            isFeatured: Boolean(isFeatured),
            featuredOrder: Number(featuredOrder || 0),
          },
        ],
        { session }
      );

      product = createdProducts[0];

      await createInitialCentralStockForProduct({
        product,
        quantity: initialQuantity,
        createdBy: req.user?._id,
        session,
      });
    });
  } finally {
    await session.endSession();
  }

  res.status(201).json(product);
});


export const getProducts = asyncHandler(async (req, res, next) => {
    // res.send("get product")
    const includeDiscontinued = shouldIncludeDiscontinued(req.query);
    const query = includeDiscontinued
      ? {}
      : {
          $or: [
            { productStatus: { $exists: false } },
            { productStatus: { $ne: "discontinued" } },
          ],
        };
    const products = await Product.find(query).sort("-createdAt");
    res.status(200).json(products);
})

export const getProduct = asyncHandler(async (req, res, next) => {
    const includeDiscontinued = shouldIncludeDiscontinued(req.query);
    const product = await Product.findById(req.params.id);
    // if product doesnt exist
    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }

    const productStatus = product?.productStatus || "active";
    if (!includeDiscontinued && productStatus === "discontinued") {
      res.status(404);
      throw new Error("Product not found");
    }
  
    res.status(200).json(product);
})

// Delete Product
export const deleteProduct = asyncHandler(async (req, res, next) => {
    const product = await Product.findById(req.params.id);
    // if product doesnt exist
    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }
  
    await Product.findByIdAndDelete(req.params.id)
    res.status(200).json({ message: "Product deleted." });
});

  // Update Product
export const updateProduct = asyncHandler(async(req,res,next) => {
    // res.send("update")
    const {
        name,
        sku,
        category,
        brand,
        quantity,
        price,
        description,
        image,
        regularPrice,
        color,
        productStatus,
        isFeatured,
        featuredOrder,
      }= req.body;

      const product = await Product.findById(req.params.id);
      // if product doesnt exist
      if (!product) {
        res.status(404);
        throw new Error("Product not found");
      }

      const hasQuantity = Object.prototype.hasOwnProperty.call(req.body, "quantity");
      const nextQuantity = hasQuantity ? Number(quantity) : Number(product.quantity || 0);

      if (hasQuantity && (!Number.isFinite(nextQuantity) || nextQuantity < 0)) {
        res.status(400);
        throw new Error("Quantity must be zero or greater");
      }

      // update product
      const nextImages = Object.prototype.hasOwnProperty.call(req.body, "image")
        ? normalizeProductImages(image)
        : product.image;

      let updatedProduct;
      const session = await mongoose.startSession();

      try {
        await session.withTransaction(async () => {
          updatedProduct = await Product.findByIdAndUpdate(
            { _id: req.params.id },
            {
              name,
              sku,
              category,
              brand,
              quantity: hasQuantity ? nextQuantity : product.quantity,
              price,
              description,
              image: nextImages,
              regularPrice,
              color,
              productStatus: normalizeProductStatus(productStatus),
              isFeatured: Boolean(isFeatured),
              featuredOrder: Number(featuredOrder || 0),
            },
            {
              new: true,
              runValidators: true,
              session,
            }
          );

          if (hasQuantity) {
            await syncCentralStockForProduct({
              product: updatedProduct,
              quantity: nextQuantity,
              createdBy: req.user?._id,
              session,
            });
          }
        });
      } finally {
        await session.endSession();
      }
    
      res.status(200).json(updatedProduct);

})


export const reviewProduct = asyncHandler(async(req,res,next) => {
    // res.send("review")
      // star, review
  const { star, review, reviewDate } = req.body;
  const { id } = req.params;

  // validation
  if (star < 1 || !review) {
    res.status(400);
    throw new Error("Please add star and review");
  }

  const product = await Product.findById(id);

  // if product doesnt exist
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  // Update Product
  product.ratings.push({
    star,
    review,
    reviewDate,
    name: req.user.username,
    userID: req.user._id,
  });
  product.save();

  res.status(200).json({ message: "Product review added." });
})

// Delete Product
export const deleteReview = asyncHandler(async(req,res,next) => {
    const { userID } = req.body;
    // console.log(userID);
  
    const product = await Product.findById(req.params.id);
    // if product doesnt exist
    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }
  
    const newRatings = product.ratings.filter((rating) => {
      return rating.userID.toString() !== userID.toString();
    });
    console.log(newRatings);
    product.ratings = newRatings;
    product.save();
    res.status(200).json({ message: "Product rating deleted!!!." });

  });


  // Edit Review
export const updateReview = asyncHandler(async (req, res) => {

    const { star, review, reviewDate, userID } = req.body;
    // console.log(userID);

    const { id } = req.params;
  
    // validation
    if (star < 1 || !review) {
      res.status(400);
      throw new Error("Please add star and review");
    }
  
    const product = await Product.findById(id);
  
    // if product doesnt exist
    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }
    // console.log(product);
    // Match user to review
    if (req.user._id.toString() !== userID) {
      res.status(401);
      throw new Error("User not authorized");
    }

  
    // // Update Product review
    const updatedReview = await Product.findOneAndUpdate(
      { _id: product._id, "ratings.userID": new mongoose.Types.ObjectId(userID) },
      {
        $set: {
          "ratings.$.star": Number(star),
          "ratings.$.review": review,
          "ratings.$.reviewDate": reviewDate,
        },
      },
      { new: true } 
    );
    console.log(updateReview);
  
    if (updatedReview) {
      res.status(200).json({ message: "Product review updated." });
    } else {
      res.status(400).json({ message: "Product review NOT updated." });
    }
  });
