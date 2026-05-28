import asyncHandler from "express-async-handler";
import CompanyProfile from "../models/companyProfileModel.js";

const PROFILE_KEY = "default";

const normalizeText = (value) => String(value || "").trim();

const buildCompanyProfilePayload = (body = {}) => ({
  businessName: normalizeText(body.businessName) || "SoapDelight.J",
  contactName: normalizeText(body.contactName),
  phone: normalizeText(body.phone),
  email: normalizeText(body.email).toLowerCase(),
  facebookPage: normalizeText(body.facebookPage),
  address: normalizeText(body.address),
  bankName: normalizeText(body.bankName),
  bankAccountName: normalizeText(body.bankAccountName),
  bankAccountNumber: normalizeText(body.bankAccountNumber),
  chequePayableTo: normalizeText(body.chequePayableTo),
  note: normalizeText(body.note),
});

export const getCompanyProfile = asyncHandler(async (req, res) => {
  const profile = await CompanyProfile.findOneAndUpdate(
    { profileKey: PROFILE_KEY },
    { $setOnInsert: { profileKey: PROFILE_KEY, businessName: "SoapDelight.J" } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  res.status(200).json(profile);
});

export const updateCompanyProfile = asyncHandler(async (req, res) => {
  const profile = await CompanyProfile.findOneAndUpdate(
    { profileKey: PROFILE_KEY },
    {
      $set: buildCompanyProfilePayload(req.body),
      $setOnInsert: { profileKey: PROFILE_KEY },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  res.status(200).json(profile);
});
