import mongoose from "mongoose";

const companyProfileSchema = new mongoose.Schema(
  {
    profileKey: {
      type: String,
      trim: true,
      unique: true,
      default: "default",
    },
    businessName: {
      type: String,
      trim: true,
      default: "SoapDelight.J",
    },
    contactName: {
      type: String,
      trim: true,
      default: "",
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    facebookPage: {
      type: String,
      trim: true,
      default: "",
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    bankName: {
      type: String,
      trim: true,
      default: "",
    },
    bankAccountName: {
      type: String,
      trim: true,
      default: "",
    },
    bankAccountNumber: {
      type: String,
      trim: true,
      default: "",
    },
    chequePayableTo: {
      type: String,
      trim: true,
      default: "",
    },
    note: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

const CompanyProfile = mongoose.model("CompanyProfile", companyProfileSchema);

export default CompanyProfile;
