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

const companyProfileAuditFieldLabels = {
  businessName: "商戶名稱",
  contactName: "聯絡人",
  phone: "電話",
  email: "電郵",
  facebookPage: "Facebook 專頁",
  address: "地址",
};

const compactCompanyProfileAuditSnapshot = (profile) => ({
  businessName: profile?.businessName || "",
  contactName: profile?.contactName || "",
  phone: profile?.phone || "",
  email: profile?.email || "",
  facebookPage: profile?.facebookPage || "",
  address: profile?.address || "",
});

const getChangedCompanyProfileFields = (before = {}, after = {}) =>
  Object.keys(companyProfileAuditFieldLabels).filter(
    (field) => String(before?.[field] || "") !== String(after?.[field] || "")
  );

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
  const beforeSnapshot = previousProfile
    ? compactCompanyProfileAuditSnapshot(previousProfile)
    : undefined;
  const profile = await CompanyProfile.findOneAndUpdate(
    { profileKey: PROFILE_KEY },
    {
      $set: buildCompanyProfilePayload(req.body),
      $setOnInsert: { profileKey: PROFILE_KEY },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  const afterSnapshot = compactCompanyProfileAuditSnapshot(profile);
  const changedFields = getChangedCompanyProfileFields(
    beforeSnapshot,
    afterSnapshot
  );

  if (changedFields.length > 0) {
    const changedFieldLabels = changedFields
      .map((field) => companyProfileAuditFieldLabels[field] || field)
      .join("、");

    await createAuditLog({
      req,
      actionType: "company_profile.updated",
      actionLabel: "更新商戶資料",
      targetType: "CompanyProfile",
      targetId: profile._id,
      targetLabel: profile.businessName || "SoapDelight.J",
      summary: `更新商戶資料：${
        profile.businessName || "SoapDelight.J"
      }（已更新：${changedFieldLabels}）`,
      before: beforeSnapshot,
      after: afterSnapshot,
      metadata: {
        changedFields,
      },
    });
  }

  res.status(200).json(profile);
});
