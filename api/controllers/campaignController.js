import MailGen from "mailgen";
import nodemailer from "nodemailer";
import asyncHandler from "express-async-handler";
import Campaign from "../models/campaignModel.js";
import Subscriber from "../models/subscriberModel.js";
import { campaignEmailTemplate } from "../emailTemplate/campaignTemplate.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeCampaignPayload = (body) => ({
  title: body.title?.trim(),
  subject: body.subject?.trim(),
  message: body.message?.trim(),
  couponCode: body.couponCode?.trim().toUpperCase() || "",
  buttonLabel: body.buttonLabel?.trim() || "",
  buttonLink: body.buttonLink?.trim() || "",
});

const validateCampaignPayload = ({ title, subject, message }) => {
  if (!title || !subject || !message) {
    return "Please fill in campaign title, subject and message.";
  }

  return "";
};

const getFrontendUrl = () =>
  process.env.FRONTEND_URL ||
  process.env.CLIENT_URL ||
  "https://soapdelight-j.onrender.com";

const getApiBaseUrl = (req) =>
  process.env.API_BASE_URL || `${req.protocol}://${req.get("host")}`;

const getUnsubscribeUrl = (req, token) =>
  `${getApiBaseUrl(req)}/api/subscribers/unsubscribe/${token}`;

const createTransporter = () => {
  const user = process.env.EMAIL_USER_G || process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS_G || process.env.EMAIL_PASS;

  if (!user) {
    throw new Error("Email service is not configured (missing EMAIL_USER).");
  }

  if (!pass) {
    throw new Error("Email service is not configured (missing EMAIL_PASS).");
  }

  return nodemailer.createTransport({
    service: "gmail",
    host: process.env.EMAIL_HOST_G || "smtp.gmail.com",
    port: 587,
    auth: {
      user,
      pass,
    },
  });
};

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const buildCampaignHtml = (campaign, unsubscribeUrl) => {
  const mailGenerator = new MailGen({
    theme: "salted",
    product: {
      name: "SoapDelight.J",
      link: getFrontendUrl(),
    },
  });

  const template = campaignEmailTemplate({
    title: campaign.title,
    message: campaign.message,
    couponCode: campaign.couponCode,
    buttonLabel: campaign.buttonLabel,
    buttonLink: campaign.buttonLink,
    unsubscribeUrl,
  });

  const emailHtml = mailGenerator.generate(template);
  const unsubscribeHtml = unsubscribeUrl
    ? `<p style="font-size:12px;color:#71717a;text-align:center;margin-top:24px;">To stop receiving promotional updates, <a href="${escapeHtml(
        unsubscribeUrl
      )}">unsubscribe here</a>.</p>`
    : "";

  return emailHtml.includes("</body>")
    ? emailHtml.replace("</body>", `${unsubscribeHtml}</body>`)
    : `${emailHtml}${unsubscribeHtml}`;
};

const sendCampaignEmail = async ({ req, campaign, email, unsubscribeUrl }) => {
  const transporter = createTransporter();
  const sender = process.env.EMAIL_USER_G || process.env.EMAIL_USER;
  const html = buildCampaignHtml(campaign, unsubscribeUrl);

  await transporter.sendMail({
    from: `SoapDelight.J <${sender}>`,
    to: email,
    replyTo: sender,
    subject: campaign.subject,
    html,
  });
};

const getCampaignById = async (id) => {
  const campaign = await Campaign.findById(id);

  if (!campaign) {
    throw new Error("Campaign not found.");
  }

  return campaign;
};

const eligibleEmailSubscriberQuery = {
  status: "active",
  preferredChannels: "email",
  email: { $exists: true, $ne: "" },
  unsubscribeToken: { $exists: true, $ne: "" },
};

export const getAdminCampaigns = asyncHandler(async (req, res) => {
  const campaigns = await Campaign.find()
    .select("-errors._id")
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json(campaigns);
});

export const getEligibleRecipientCount = asyncHandler(async (req, res) => {
  const count = await Subscriber.countDocuments(eligibleEmailSubscriberQuery);

  res.status(200).json({ count });
});

export const createCampaign = asyncHandler(async (req, res) => {
  const payload = normalizeCampaignPayload(req.body);
  const validationError = validateCampaignPayload(payload);

  if (validationError) {
    res.status(400);
    throw new Error(validationError);
  }

  const campaign = await Campaign.create({
    ...payload,
    status: "draft",
    channel: "email",
    createdBy: req.user?._id,
  });

  res.status(201).json(campaign);
});

export const updateDraftCampaign = asyncHandler(async (req, res) => {
  const campaign = await getCampaignById(req.params.id);

  if (campaign.status !== "draft") {
    res.status(400);
    throw new Error("Only draft campaigns can be edited.");
  }

  const payload = normalizeCampaignPayload(req.body);
  const validationError = validateCampaignPayload(payload);

  if (validationError) {
    res.status(400);
    throw new Error(validationError);
  }

  Object.assign(campaign, payload);
  const updatedCampaign = await campaign.save();

  res.status(200).json(updatedCampaign);
});

export const sendTestCampaign = asyncHandler(async (req, res) => {
  const campaign = await getCampaignById(req.params.id);
  const testEmail = req.body.email?.trim().toLowerCase();

  if (!testEmail || !EMAIL_PATTERN.test(testEmail)) {
    res.status(400);
    throw new Error("Please enter a valid test email address.");
  }

  await sendCampaignEmail({
    req,
    campaign,
    email: testEmail,
    unsubscribeUrl: `${getFrontendUrl()}/subscribe`,
  });

  campaign.testSentTo = testEmail;
  await campaign.save();

  res.status(200).json({ message: "Test email sent.", campaign });
});

export const sendCampaignToSubscribers = asyncHandler(async (req, res) => {
  const campaign = await getCampaignById(req.params.id);

  if (campaign.status === "sent") {
    res.status(400);
    throw new Error("This campaign has already been sent.");
  }

  const subscribers = await Subscriber.find(eligibleEmailSubscriberQuery)
    .select("email unsubscribeToken")
    .lean();

  const errors = [];
  let sentCount = 0;
  const transporter = createTransporter();
  const sender = process.env.EMAIL_USER_G || process.env.EMAIL_USER;

  for (const subscriber of subscribers) {
    try {
      const unsubscribeUrl = getUnsubscribeUrl(req, subscriber.unsubscribeToken);
      const html = buildCampaignHtml(campaign, unsubscribeUrl);

      await transporter.sendMail({
        from: `SoapDelight.J <${sender}>`,
        to: subscriber.email,
        replyTo: sender,
        subject: campaign.subject,
        html,
      });
      sentCount += 1;
    } catch (error) {
      errors.push({
        email: subscriber.email,
        message: error.message || "Unable to send email.",
      });
    }
  }

  campaign.recipientQuery = {
    status: "active",
    preferredChannels: "email",
    email: "exists",
    unsubscribeToken: "exists",
  };
  campaign.sentCount = sentCount;
  campaign.failedCount = errors.length;
  campaign.errors = errors;
  campaign.sentAt = new Date();
  campaign.status = errors.length > 0 && sentCount === 0 ? "failed" : "sent";

  const updatedCampaign = await campaign.save();

  res.status(200).json({
    message: "Campaign send completed.",
    sentCount,
    failedCount: errors.length,
    campaign: updatedCampaign,
  });
});

export const deleteDraftCampaign = asyncHandler(async (req, res) => {
  const campaign = await getCampaignById(req.params.id);

  if (campaign.status !== "draft") {
    res.status(400);
    throw new Error("Only draft campaigns can be deleted.");
  }

  await campaign.deleteOne();

  res.status(200).json({ message: "Draft campaign deleted." });
});
