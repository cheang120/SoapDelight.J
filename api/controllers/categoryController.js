import asyncHandler from "express-async-handler";
import mongoose from "mongoose";

import slugify from "slugify";
import Category from "../models/categoryModel.js";



// // Create Category
export const createCategory = asyncHandler(async (req, res,next) => {
    // res.send("create category")
    // console.log(req.body);
    console.log('Request body:', req.body);
  const { name } = req.body;
  
  if (!name) {
    res.status(400);
    throw new Error("Please fill in category name");
  }
  const categoryExists = await Category.findOne({ name: name });
  if (categoryExists) {
    res.status(400);
    throw new Error("Category name already exists.");
  }
  const category = await Category.create({
    name,
    slug: slugify(name),
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
  const slug = req.params.slug.toLowerCase();
  const category = await Category.findOneAndDelete({ slug: slug });
  if (!category) {
    res.status(404);
    throw new Error("Category not found");
  }
  res.status(200).json({ message: "Category deleted." });
});