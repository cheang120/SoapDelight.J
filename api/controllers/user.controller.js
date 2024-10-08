import { errorHandler } from "../utils/error.js";
import asyncHandler from "express-async-handler";
import bcryptjs from 'bcryptjs'
import User from '../models/user.model.js';


export const test = (req,res) => {
    res.json({message:'API is working'})

}

// Logout User 
export const signout = (req, res, next) => {
    try {
      res
        .clearCookie('access_token')
        .status(200)
        .json('User has been signed out');
    } catch (error) {
      next(error);
    }
  };

  export const updateUser = async (req, res, next) => {
    if (req.user.id !== req.params.userId) {
      return next(errorHandler(403, 'You are not allowed to update this user'));
    }
    if (req.body.password) {
      if (req.body.password.length < 6) {
        return next(errorHandler(400, 'Password must be at least 6 characters'));
      }
      req.body.password = bcryptjs.hashSync(req.body.password, 10);
    }
    if (req.body.username) {
      if (req.body.username.length < 7 || req.body.username.length > 20) {
        return next(
          errorHandler(400, 'Username must be between 7 and 20 characters')
        );
      }
      if (req.body.username.includes(' ')) {
        return next(errorHandler(400, 'Username cannot contain spaces'));
      }
      if (req.body.username !== req.body.username.toLowerCase()) {
        return next(errorHandler(400, 'Username must be lowercase'));
      }
      if (!req.body.username.match(/^[a-zA-Z0-9]+$/)) {
        return next(
          errorHandler(400, 'Username can only contain letters and numbers')
        );
      }
    }
    try {
      const updatedUser = await User.findByIdAndUpdate(
        req.params.userId,
        {
          $set: {
            username: req.body.username,
            email: req.body.email,
            profilePicture: req.body.profilePicture,
            password: req.body.password,
            phone:req.body.phone
          },
        },
        { new: true }
      );
      const { password, ...rest } = updatedUser._doc;
      res.status(200).json(rest);
    } catch (error) {
      next(error);
    }
  };

  export const deleteUser = async (req, res, next) => {
    if (req.user.id !== req.params.userId) {
      return next(errorHandler(403, 'You are not allowed to delete this user'));
    }
    try {
      await User.findByIdAndDelete(req.params.userId)
      res.status(200).json('User has been deleted!')
    } catch (error) {
      next(error)
    }
  }

  export const saveCart = asyncHandler(async(req,res) => {
    // res.send("Correct")
    const {cartItems} = req.body

    const user = await User.findById(req.user._id)

    if (user) {
      user.cartItems = cartItems
      user.save()
      res.status(200).json({message: "Cart Saved"})
    }else {
      res.status(404)
      throw new Error("User not found!")
    }
  })

  export const getCart = asyncHandler(async(req,res)=>{
    // res.send("..")

    const user = await User.findById(req.user._id)

    if (user) {
      res.status(200).json(user.cartItems)
    }else {
      res.status(404)
      throw new Error("User not found!")
    }
  })

  export const getUsers = async (req, res, next) => {
    res.send("get users")
  }

  export const loginStatus = async (req,res,next) => {
    res.send("get login status")
  }

