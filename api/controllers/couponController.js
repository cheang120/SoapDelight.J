import asyncHandler from "express-async-handler";
import Coupon from "../models/couponMondel.js";



// Create Coupon
export const createCoupon = asyncHandler(async (req, res,next) => {
    const { name, expiresAt, discount } = req.body;
  
    if (!name || !expiresAt || !discount) {
      res.status(400);
      throw new Error("Please fill in all fields");
    }
    const coupon = await Coupon.create({
      name,
      expiresAt,
      discount,
    });
    if (coupon) {
      res.status(201).json(coupon);
    } else {
      res.status(400);
      throw new Error("Something went wrong!!! Please Try again.");
    }
  });