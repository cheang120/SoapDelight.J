import asyncHandler from "express-async-handler";
import Coupon from "../models/couponMondel.js";

const normalizeExpiryDate = (expiresAt) => {
  const normalized = new Date(expiresAt);
  normalized.setHours(23, 59, 59, 999);
  return normalized;
};



// Create Coupon
export const createCoupon = asyncHandler(async (req, res,next) => {
    const { name, expiresAt, discount } = req.body;
  
    if (!name || !expiresAt || !discount) {
      res.status(400);
      throw new Error("Please fill in all fields");
    }

    const normalizedExpiry = normalizeExpiryDate(expiresAt);
    if (Number.isNaN(normalizedExpiry.getTime()) || normalizedExpiry.getTime() <= Date.now()) {
      res.status(400);
      throw new Error("Expiry date cannot be in the past.");
    }

    const coupon = await Coupon.create({
      name,
      expiresAt: normalizedExpiry,
      discount,
    });
    if (coupon) {
      res.status(201).json(coupon);
    } else {
      res.status(400);
      throw new Error("Something went wrong!!! Please Try again.");
    }
  });

export const getCoupons = asyncHandler(async (req, res,next) => {
    const coupons = await Coupon.find().sort("-createdAt");
    res.status(200).json(coupons);
});
  
  // Get Single Coupon
export const getCoupon = asyncHandler(async (req, res,next) => {
    const coupon = await Coupon.findOne({
      name: req.params.couponName,
      expiresAt: { $gt: Date.now() },
    });
  
    if (!coupon) {
      res.status(404);
      throw new Error("Coupon not found or has expired");
    }
  
    res.status(200).json(coupon);
});

// Delete Coupon
export const deleteCoupon = asyncHandler(async (req, res,next) => {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) {
      res.status(404);
      throw new Error("Coupon not found");
    }
    res.status(200).json({ message: "Coupon deleted." });
  });
