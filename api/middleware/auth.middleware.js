import asyncHandler from "express-async-handler";
import User from '../models/user.model.js';

import jwt from "jsonwebtoken";
import { errorHandler } from '../utils/error.js';

export const protect  = async (req, res, next) => {
  const token = req.cookies.access_token
  console.log(token);
  // res.send("token")

  
  try {
    const token = req.cookies.access_token;
    if (!token) {
      // res.status(401);
      // throw new Error("Not authorized, please login");
      
      return next(errorHandler(401, 'Not authorized, please login'));
    }

    // Verify token
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    // Get user id from token
    const user = await User.findById(verified.id).select("-password");

    if (!user) {
      // res.status(404);
      // throw new Error("User not found");
      return next(errorHandler(404, 'User not found'));
    }
    if (user.role === "suspended") {
      // res.status(400);
      // throw new Error("User suspended, please contact support");
      return next(errorHandler(400, 'User suspended, please contact support'));
    }

    req.user = user;
    // console.log(req.user);
    next();
  } catch (error) {
    // res.status(401);
    // throw new Error("Not authorized, please login");
    return next(errorHandler(401, 'Not authorized, please login'));
  }
}


export const verifiedOnly  = async (req, res, next) => {

  // console.log(req.user);
    if (req.user && req.user.isVerified) {
    next();
  } else {
    // res.status(401);
    // throw new Error("Not authorized, account not verified");
    return next(errorHandler(401, 'Not authorized, account not verified'));
  }
}


export const authorOnly  = async (req, res, next) => {
  // console.log(req.user);
  // res.send('user')
  if (req.user && req.user.role === "author" || req.user && req.user.role === "admin") {
    next();
  } else {

    return next(errorHandler(401, 'Not authorized as an author'));
  }
};

export const adminOnly = async (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return next(errorHandler(401, 'Not authorized as an admin'));
  }
};

