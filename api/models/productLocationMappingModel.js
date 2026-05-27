import mongoose from "mongoose";

const productLocationMappingSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InventoryLocation",
      required: true,
    },
    centralSku: {
      type: String,
      trim: true,
      default: "",
    },
    locationSku: {
      type: String,
      trim: true,
    },
    locationProductName: {
      type: String,
      trim: true,
      default: "",
    },
    commissionRate: {
      type: Number,
      default: 0,
      min: 0,
    },
    active: {
      type: Boolean,
      default: true,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

productLocationMappingSchema.index(
  { productId: 1, locationId: 1 },
  { unique: true }
);
productLocationMappingSchema.index(
  { locationId: 1, locationSku: 1 },
  {
    unique: true,
    partialFilterExpression: { locationSku: { $type: "string" } },
  }
);

const ProductLocationMapping = mongoose.model(
  "ProductLocationMapping",
  productLocationMappingSchema
);

export default ProductLocationMapping;
