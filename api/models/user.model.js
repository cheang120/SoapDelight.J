

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim:true,
      match: [
          /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
          "Please enter a valid email",
        ]
    },
    password: {
        type: String,
        required:[true,"Please add a password"]
    },
    profilePicture:{
      type:String,
      default:"https://i.ibb.co/4pDNDk1/avatar.png"
    },
    photo: {
        type: String,
        // required:[true,"Please add a photo"],
        default:"https://i.ibb.co/4pDNDk1/avatar.png"
    },
    phone: {
        type: String,
        default:"+853"
    },
    bio: {
        type: String,
        default: "bio",
    },
    role: {
        type: String,
        // required: true,
        default: "subscriber",
        // subscriber, author, and admin (suspended)
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
  },
  { timestamps: true }
);

// Encrypt password before saving to DB
// userSchema.pre("save", async function (next) {
//     if (!this.isModified("password")) {
//       return next();
//     }
  
//     // Hash password
//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(this.password, salt);
//     this.password = hashedPassword;
//     next();
//   });

const User = mongoose.model('User', userSchema);

export default User;