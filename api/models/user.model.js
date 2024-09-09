

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
      default:"https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"
    },
    // photo: {
    //     type: String,
    //     // required:[true,"Please add a photo"],
    //     default:"https://i.ibb.co/4pDNDk1/avatar.png"
    // },
    phone: {
        type: String,
        default:"+853"
    },
    balance: {
      type: Number,
      default:"0"
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
    address: {
      type: Object,
      // address, state, country
    },
    // wishlist: [{ type: ObjectId, ref: "Product" }],
    // balance: {
    //   type: Number,
    //   default: 0,
    // },
    cartItems: {
      type: [Object],
    },
    stripeCustomerId: {
      type: String,
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