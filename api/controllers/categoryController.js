import asyncHandler from "express-async-handler";
import mongoose from "mongoose";

import slugify from "slugify";
import Category from "../models/categoryModel.js";

const createCategorySlug = (name) => {
  const trimmedName = String(name || "").trim();
  const latinSlug = slugify(trimmedName, {
    lower: true,
    strict: true,
    trim: true,
  });

  return latinSlug || trimmedName;
};




// // Create Category
export const createCategory = asyncHandler(async (req, res,next) => {
    // res.send("create category")
    // console.log(req.body);
    console.log('Request body:', req.body);
  const categoryName = String(req.body?.name || "").trim();
  
  if (!categoryName) {
    res.status(400);
    throw new Error("Please fill in category name");
  }

  const slug = createCategorySlug(categoryName);

  const categoryExists = await Category.findOne({
    $or: [{ name: categoryName }, { slug }],
  });

  if (categoryExists) {
    res.status(400);
    throw new Error("Category name already exists.");
  }

  const category = await Category.create({
    name: categoryName,
    slug,
  });
  if (category) {
    res.status(201).json(category);
  }
});

export const getCategories = asyncHandler(async (req, res,next) => {
  const categories = await Category.find().sort("-createdAt");
  res.status(200).json(categories);
});

export const deleteCategory = asyncHandler(async (req, res,next) => {
  const identifier = decodeURIComponent(String(req.params.slug || "")).trim();

  if (!identifier) {
    res.status(400);
    throw new Error("Missing category identifier");
  }

  const category = mongoose.Types.ObjectId.isValid(identifier)
    ? await Category.findByIdAndDelete(identifier)
    : await Category.findOneAndDelete({ slug: identifier });

  if (!category) {
    res.status(404);
    throw new Error("Category not found");
  }

  res.status(200).json({ message: `Category "${category.name}" deleted.` });
});