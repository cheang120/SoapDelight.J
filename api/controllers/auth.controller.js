import User from '../models/user.model.js';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken'
import asyncHandler from 'express-async-handler'
import crypto from 'crypto'
import dotenv from 'dotenv'
import { errorHandler } from '../utils/error.js';
import sendEmail from "../utils/sendEmail.js";
import Token from "../models/token.model.js";
// import {generateToken,hashToken} from '../utils'

const generateToken = (id) => {
  return jwt.sign({id}, process.env.JWT_SECRET, {expiresIn:"1d"})
}

// Hash Token
const hashToken = (token) => {
  return crypto.createHash("sha256").update(token.toString()).digest("hex");
};

// registration
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
  // console.log(newUser);

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



// send Verification Email

export const sendVerificationEmail = async (req, res,next) => {
  // res.send("verify email")
  const { email } = req.body;
  console.log(email);

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  const user = await User.findOne({ email });


  if (!user) {
    res.status(404).json({ message: "User not found" });
  }

  if (user.isVerified) {
    res.status(400).json({ message: "User already verified" });
  }

  console.log(user);

  // Delete Token if it exists in DB
  let token = await Token.findOne({ userId: user._id });

  if (token) {
    await token.deleteOne();
  }

  //   Create Verification Token and Save
  const verificationToken = crypto.randomBytes(32).toString("hex") + user._id;
  // console.log(verificationToken);
  // res.send("Token")

  // Hash token and save
  const hashedToken = hashToken(verificationToken);
  // console.log(hashedToken);
  // res.send('hashedToken')
  await new Token({
    userId: user._id,
    vToken: hashedToken,
    createdAt: Date.now(),
    expiresAt: Date.now() + 60 * (60 * 1000), // 60mins
  }).save();

  // Construct Verification URL
  const verificationUrl = `${process.env.FRONTEND_URL}/verify/${verificationToken}`;
  // console.log(process.env.FRONTEND_URL);
  // res.send('link')
  // Send Email

  const subject = "Verify Your Account - BabyCode";
  const send_to = user.email;
  const sent_from = process.env.EMAIL_USER;
  const reply_to = "noreply@babycode.com";
  const template = "verifyEmail";
  const name = user.name;
  const link = verificationUrl;

  try {
    await sendEmail(
      subject,
      send_to,
      sent_from,
      reply_to,
      template,
      name,
      link
    );
    res.status(200).json({ message: "Verification Email Sent" });
  } catch (error) {
    res.status(500).json({ message: "Email not sent, please try again" });
  }
};

// Verify User
export const verifyUser = async (req, res) => {
  // res.send("verifyUser")
  const { verificationToken } = req.params;
  // console.log(verificationToken);
  // res.send("verificationToken")

  const hashedToken = hashToken(verificationToken);

  const userToken = await Token.findOne({
    vToken: hashedToken,
    expiresAt: { $gt: Date.now() },
  });

  if (!userToken) {
    res.status(404).json({ message: "Invalid or Expired Token" });
  }

  // // Find User
  const user = await User.findOne({ _id: userToken.userId });

  if (user.isVerified) {
    res.status(400).json({ message: "User is already verified" });
  }

  // // Now verify user
  user.isVerified = true;
  await user.save();

  res.status(200).json({ message: "Account Verification Successful" });
};

export const signin = asyncHandler( async (req, res, next) => {
  const { email, password } = req.body;
  // console.log(password);
  // console.log(email);

  if (!email || !password || email === '' || password === '') {
    next(errorHandler(400, 'All fields are required'));
  }

  try {
    const validUser = await User.findOne({ email });
    // console.log(validUser);
    if (!validUser) {
      return next(errorHandler(404, 'User not found'));
    }
    const validPassword = await bcryptjs.compare(password, validUser.password);
    // console.log(password);
    // console.log(validUser.password);
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
});

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

  // Send Automated emails
  export const sendAutomatedEmail = asyncHandler(async (req, res) => {
    const { subject, send_to, reply_to, template, url } = req.body;
    console.log(url);
  
    if (!subject || !send_to || !reply_to || !template) {
      res.status(500);
      throw new Error("Missing email parameter");
    }
  
    // Get user
    const user = await User.findOne({ email: send_to });
    // console.log(user);

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }
  
    const sent_from = process.env.EMAIL_USER;
    const name = user.name;
    const link = `${process.env.FRONTEND_URL}${url}`;
  
    console.log(sent_from);
    // console.log(name);
    try {
        await sendEmail(
          subject,
          send_to,
          sent_from,
          reply_to,
          template,
          name,
          link
        );
        res.status(200).json({ message: "Email Sent" });
    } catch (error) {
        res.status(500);
        throw new Error("Email not sent, please try again");
    }
  });
  

  export const forgotPassword = async (req, res, next) => {
    // res.send("forgot password")

    const { email } = req.body;
    // console.log(email);
    // res.send("email")
  
    const user = await User.findOne({ email });
    // console.log(user);
  
    if (!user) {
      return next(errorHandler(404, 'No user with this email!'));
    }
  
    // Delete Token if it exists in DB
    let token = await Token.findOne({ userId: user._id });
    // console.log(token);
    // res.send("token")
    if (token) {
      await token.deleteOne();
    }
  
    //   Create Verification Token and Save
    const resetToken = crypto.randomBytes(32).toString("hex") + user._id;
    // console.log(resetToken);
  
    // Hash token and save
    const hashedToken = hashToken(resetToken);
    await new Token({
      userId: user._id,
      rToken: hashedToken,
      createdAt: Date.now(),
      expiresAt: Date.now() + 60 * (60 * 1000), // 60mins
    }).save();
    console.log(resetToken);
    

      // Construct Reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/resetPassword/${resetToken}`;
    // console.log(resetUrl);
        // Send Email
    const subject = "Password Reset Request - BabyCode";
    const send_to = user.email;
    const sent_from = process.env.EMAIL_USER;
    const reply_to = "noreply@babycode.com";
    const template = "forgotPassword";
    const name = user.name;
    const link = resetUrl;

    try {
        await sendEmail(
            subject,
            send_to,
            sent_from,
            reply_to,
            template,
            name,
            link
        );
        return next(errorHandler(200, 'Password Reset Email Sent!'));
    } catch (error) {
        return next(errorHandler(500, 'Email not sent, please try again!'));
    }
  }


  export const resetPassword = async (req, res, next) => {
    // res.send("reset password")
    const { resetToken } = req.params;
    const { password } = req.body;
    // console.log(resetToken);
    // console.log(password);
  
    const hashedToken = hashToken(resetToken);
  
    const userToken = await Token.findOne({
      rToken: hashedToken,
      expiresAt: { $gt: Date.now() },
    });
  
    if (!userToken) {
      return next(errorHandler(404, 'Invalid or Expired Token!'));
    }
  
    // // Find User
    const user = await User.findOne({ _id: userToken.userId });
  
    // // Now Reset password
    user.password = password;
    const hashedPassword = bcryptjs.hashSync(password, 10);
    user.password = hashedPassword
    // const newPassword = hashedPassword,

    await user.save();
  
    res.status(200).json({ message: "Password Reset Successful, please login" });

  }
