import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import Brand from "../models/brandModel.js";
import Category from "../models/categoryModel.js";
import slugify from "slugify";

const createBrandSlug = (name) => {
  const trimmedName = String(name || "").trim();
  const latinSlug = slugify(trimmedName, {
    lower: true,
    strict: true,
    trim: true,
  });

  return latinSlug || trimmedName;
};

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
  const brandName = String(name || "").trim();
  const slug = createBrandSlug(brandName);

  const brand = await Brand.create({
    name: brandName,
    slug,
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
  const identifier = decodeURIComponent(String(req.params.slug || "")).trim();

  if (!identifier) {
    res.status(400);
    throw new Error("Missing brand identifier");
  }

  const brand = mongoose.Types.ObjectId.isValid(identifier)
    ? await Brand.findByIdAndDelete(identifier)
    : await Brand.findOneAndDelete({ slug: identifier });

  if (!brand) {
    res.status(404);
    throw new Error("Brand not found");
  }

  res.status(200).json({ message: `Brand "${brand.name}" deleted.` });
});

