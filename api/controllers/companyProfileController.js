import asyncHandler from "express-async-handler";
import CompanyProfile from "../models/companyProfileModel.js";
import { createAuditLog } from "../utils/auditLogger.js";

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

const compactCompanyProfileAuditSnapshot = (profile) => ({
  companyName: profile?.businessName || "",
  businessName: profile?.businessName || "",
  phone: profile?.phone || "",
  email: profile?.email || "",
  website: profile?.facebookPage || "",
  facebookPage: profile?.facebookPage || "",
  updatedAt: profile?.updatedAt || "",
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
  const previousProfile = await CompanyProfile.findOne({
    profileKey: PROFILE_KEY,
  }).lean();
  const profile = await CompanyProfile.findOneAndUpdate(
    { profileKey: PROFILE_KEY },
    {
      $set: buildCompanyProfilePayload(req.body),
      $setOnInsert: { profileKey: PROFILE_KEY },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  await createAuditLog({
    req,
    actionType: "company_profile.updated",
    actionLabel: "更新商戶資料",
    targetType: "CompanyProfile",
    targetId: profile._id,
    targetLabel: profile.businessName || "SoapDelight.J",
    summary: `更新商戶資料：${profile.businessName || "SoapDelight.J"}`,
    before: previousProfile
      ? compactCompanyProfileAuditSnapshot(previousProfile)
      : undefined,
    after: compactCompanyProfileAuditSnapshot(profile),
  });

  res.status(200).json(profile);
});
