import User from '../models/user.model.js';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken'
import asyncHandler from 'express-async-handler'

import crypto from 'crypto'
import dotenv from 'dotenv'
import { errorHandler } from '../utils/error.js';

const generateToken = (id) => {
  return jwt.sign({id}, process.env.JWT_SECRET, {expiresIn:"1d"})
}


export const signup = async (req, res, next) => {
  const { username, email, password } = req.body;
  // console.log(username);

  if (
    !username ||
    !email ||
    !password ||
    username === '' ||
    email === '' ||
    password === ''
  ) {
    next(errorHandler(400, 'All fields are required'));
  }

    if (password.length <6) {
        next(errorHandler(400,"Passwrod must be up to 6 characters."))
    }

  const userExists = await User.findOne({email})

  if (userExists) {
    next(errorHandler(500,"Email already in used."))
  }

  const hashedPassword = bcryptjs.hashSync(password, 10);

  const newUser = new User({
    username,
    email,
    password: hashedPassword,
  });

  // Generate Token
  const token = generateToken(newUser._id)
  // console.log(token);
  
  // Send HTTP-only cookie
  res.cookie("token", token, {
    path:"/",
    httpOnly:true,
    expires: new Date(Date.now() + 1000 * 86400),
    sameSite:"none",
    secure:true,
  })
  
  // console.log(token);

  try {
    await newUser.save();
    res.json('Signup successful');
  } catch (error) {
    next(error);
  }
};


export const signin = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password || email === '' || password === '') {
    next(errorHandler(400, 'All fields are required'));
  }

  try {
    const validUser = await User.findOne({ email });
    if (!validUser) {
      return next(errorHandler(404, 'User not found'));
    }
    const validPassword = bcryptjs.compareSync(password, validUser.password);
    if (!validPassword) {
      return next(errorHandler(400, 'Invalid password'));
    }
    const token = jwt.sign(
      { id: validUser._id, isAdmin: validUser.isAdmin },
      process.env.JWT_SECRET
    );

    const { password: pass, ...rest } = validUser._doc;

    res
      .status(200)
      .cookie('access_token', token, {
        httpOnly: true,
      })
      .json(rest);
  } catch (error) {
    next(error);
  }
};

export const google = async (req, res, next) => {
  const { email, name, googlePhotoUrl } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user) {
      const token = jwt.sign(
        { id: user._id, isAdmin: user.isAdmin },
        process.env.JWT_SECRET
      );
      const { password, ...rest } = user._doc;
      res
        .status(200)
        .cookie('access_token', token, {
          httpOnly: true,
        })
        .json(rest);
    } else {
      const generatedPassword =
        Math.random().toString(36).slice(-8) +
        Math.random().toString(36).slice(-8);
      const hashedPassword = bcryptjs.hashSync(generatedPassword, 10);
      const newUser = new User({
        username:
          name.toLowerCase().split(' ').join('') +
          Math.random().toString(9).slice(-4),
        email,
        password: hashedPassword,
        profilePicture: googlePhotoUrl,
      });
      await newUser.save();
      const token = jwt.sign(
        { id: newUser._id, isAdmin: newUser.isAdmin },
        process.env.JWT_SECRET
      );
      const { password, ...rest } = newUser._doc;
      res
        .status(200)
        .cookie('access_token', token, {
          httpOnly: true,
        })
        .json(rest);
    }
  } catch (error) {
    next(error);
  }
};

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


// get user 
export const getUser = async (req, res, next) => {
  const user = await User.findById(req.user._id)
  // console.log(user);
  try {
    // res.send("get user")
    if (user) {
      const {_id,username,email,password,photo,phone,bio,role,isVerified} = user
      console.log(user);
      res.status(200).json({_id,username,email,password,photo,phone,bio,role,isVerified})
    }else {
      return next(errorHandler(404, 'User not found!'));

    }
  } catch (error) {
    next(error);
  }
}

// get users 
export const getUsers = async (req, res, next) => {
  // res.send('get users')
  const users = await User.find().sort("-createdAt").select("-password")
  if(!users) {
    return next(errorHandler(500, 'Something went wrong!'));
  }
  res.status(200).json(users)

}

// get login status
export const loginStatus = async (req, res, next) => {
  // res.send("get login status")
  const token = req.cookies.access_token
  if(!token){
    return res.json(false)
  }

  // Verify Token
  const verified = jwt.verify(token, process.env.JWT_SECRET);

  if(verified ){
    return res.json(true)
  }
  return res.json(false)
}

// upgrade User
export const upgradeUser = async (req, res, next) => {
  // res.send("Upgrade User")
  const {role, id} = req.body
  const user = await User.findById(id)
  if(!user) {
    return next(errorHandler(500, 'User not found!'));
  }
  user.role = role
  await user.save()
  res.status(200).json({
    message:`User role updated to ${role}`
  })

}