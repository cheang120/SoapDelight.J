// productController.js
import asyncHandler from 'express-async-handler';
import Product from '../models/productModel.js'
import mongoose from "mongoose";
const { ObjectId } = mongoose.Schema;

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
    name: req.user.name,
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
      }
    );
    console.log(updateReview);
  
    if (updatedReview) {
      res.status(200).json({ message: "Product review updated." });
    } else {
      res.status(400).json({ message: "Product review NOT updated." });
    }
  });