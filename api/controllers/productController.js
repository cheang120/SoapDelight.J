// productController.js
import asyncHandler from 'express-async-handler';

export const createProduct = asyncHandler(async (req, res, next) => {
  res.send("Correct product");
});