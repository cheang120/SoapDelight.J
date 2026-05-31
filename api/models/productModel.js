import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    // user: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   required: true,
    //   ref: "User",
    // },
    name: {
      type: String,
      required: [true, "Please add a name"],
      trim: true,
    },
    sku: {
      type: String,
      default: "",
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Please add a category"],
      trim: true,
    },
    brand: {
      type: String,
      required: [true, "Please add a brand"],
      trim: true,
    },
    color: {
      type: String,
      default: "",
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, "Please add a quantity"],
      trim: true,
    },
    productStatus: {
      type: String,
      enum: ["active", "out_of_stock", "discontinued"],
      default: "active",
      trim: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    featuredOrder: {
      type: Number,
      default: 0,
      min: 0,
    },
    sold: {
      type: Number,
      default: 0,
      trim: true,
    },
    price: {
      type: String,
      required: [true, "Please add a price"],
      trim: true,
    },
    regularPrice: {
      type: String,
      // required: [true, "Please add a price"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Please add a description"],
      trim: true,
    },
    image: {
      type: [String],
      default: [],
    },
    ratings: {
      type: [Object],
    },
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.model("Product", productSchema);

export default Product;
