import asyncHandler from "express-async-handler";
import Brand from "../models/brandModel.js";
import Category from "../models/categoryModel.js";
import slugify from "slugify";

export const createBrand = asyncHandler(async (req, res,next) => {
    // res.send("create brand")
  const { name, category } = req.body;
  if (!name || !category) {
    res.status(400);
    throw new Error("Please fill in all fields");
  }
  const categoryExists = await Category.findOne({ name: category });
  if (!categoryExists) {
    res.status(400);
    throw new Error("Parent category not found.");
  }
  const brand = await Brand.create({
    name,
    slug: slugify(name),
    category,
  });
  if (brand) {
    res.status(201).json(brand);
  }
});

export const getBrands = asyncHandler(async (req, res,next) => {
  const brands = await Brand.find().sort("-createdAt");
  res.status(200).json(brands);
});

export const deleteBrand = asyncHandler(async (req, res,next) => {
  const brand = await Brand.findOneAndDelete({ slug: req.params.slug });
  if (!brand) {
    res.status(404);
    throw new Error("Category not found");
  }
  res.status(200).json({ message: "Brand deleted." });
});

