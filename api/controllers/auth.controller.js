import User from '../models/user.model.js';
// import generateToken from '../utils'
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken'

import crypto from 'crypto'
import dotenv from 'dotenv'
import { errorHandler } from '../utils/error.js';

const expiresIn = '1d'


export const signup = async (req, res, next) => {
  const { username, email, password } = req.body;

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

  const hashedPassword = bcryptjs.hashSync(password, 10);

  const newUser = new User({
    username,
    email,
    password: hashedPassword,
  });

  try {
    await newUser.save();
    res.json('Signup successful');
  } catch (error) {
    next(error);
  }
};
