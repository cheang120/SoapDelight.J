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


export const getProducts = asyncHandler(async (req, res, next) => {
    // res.send("get product")
    const products = await Product.find().sort("-createdAt");
    res.status(200).json(products);
})

export const getProduct = asyncHandler(async (req, res, next) => {
    const product = await Product.findById(req.params.id);
    // if product doesnt exist
    if (!product) {
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
        category,
        brand,
        quantity,
        price,
        description,
        image,
        regularPrice,
        color,
      }= req.body;

      const product = await Product.findById(req.params.id);
      // if product doesnt exist
      if (!product) {
        res.status(404);
        throw new Error("Product not found");
      }

      // update product
      const updatedProduct =  await Product.findByIdAndUpdate(
        { _id: req.params.id },
        {
          name,
          category,
          brand,
          quantity,
          price,
          description,
          image,
          regularPrice,
          color,
        },
        {
          new: true,
          runValidators: true,
        }
      );
    
      res.status(200).json(updatedProduct);

})