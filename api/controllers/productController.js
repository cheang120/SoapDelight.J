// productController.js
import asyncHandler from 'express-async-handler';
import Product from '../models/productModel.js'

export const createProduct = asyncHandler(async (req, res, next) => {
//   res.send("Correct product");
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
    } = req.body;

      //   Validation
  if (!name || !category || !brand || !quantity || !price || !description) {
    res.status(400);
    throw new Error("Please fill in all fields");
  }

    // Create Product
    const product = await Product.create({
        // user: req.user.id,
        name,
        sku,
        category,
        quantity,
        brand,
        price,
        description,
        image,
        regularPrice,
        color,
    });

    res.status(201).json(product);

});