import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import Campaign from "../models/campaignModel.js";
import JournalArticle, { JOURNAL_CATEGORIES } from "../models/journalArticleModel.js";
import { createAuditLog } from "../utils/auditLogger.js";

const ARTICLE_STATUSES = ["draft", "published", "archived"];
const ALL_CATEGORY_LABEL = "全部";

const throwHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
};

const normalizeText = (value) => String(value || "").trim();

const normalizeSlug = (value) =>
  normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

const fallbackSlug = () => `journal-${Date.now()}`;

const normalizeTags = (tags) => {
  if (tags === undefined) {
    return undefined;
  }

  if (!Array.isArray(tags)) {
    throwHttpError(400, "Tags must be an array.");
  }

  const normalized = [];
  const seen = new Set();

  tags.forEach((tag) => {
    const text = normalizeText(tag);
    if (!text) {
      return;
    }
    if (text.length > 40) {
      throwHttpError(400, "Each tag must be 40 characters or fewer.");
    }
    if (!seen.has(text)) {
      seen.add(text);
      normalized.push(text);
    }
  });

  if (normalized.length > 20) {
    throwHttpError(400, "A journal article can have at most 20 tags.");
  }

  return normalized;
};

const normalizeSections = (sections) => {
  if (sections === undefined) {
    return undefined;
  }

  if (!Array.isArray(sections)) {
    throwHttpError(400, "Sections must be an array.");
  }

  if (sections.length > 30) {
    throwHttpError(400, "A journal article can have at most 30 sections.");
  }

  return sections.map((section) => {
    const body = Array.isArray(section?.body)
      ? section.body.map(normalizeText).filter(Boolean)
      : [];

    if (body.length > 20) {
      throwHttpError(400, "Each section can have at most 20 paragraphs.");
    }

    return {
      heading: normalizeText(section?.heading),
      body,
      image: normalizeText(section?.image),
      imageAlt: normalizeText(section?.imageAlt),
    };
  });
};

const normalizePublishDate = (value) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throwHttpError(400, "Publish date is invalid.");
  }

  return date;
};

const normalizeArticlePayload = (body, { isCreate = false, currentArticle } = {}) => {
  const payload = {};
  const title = body.title !== undefined ? normalizeText(body.title) : undefined;

  if (title !== undefined) {
    payload.title = title;
  }

  if (body.slug !== undefined || isCreate) {
    const candidateSlug = normalizeSlug(body.slug) || normalizeSlug(title);
    payload.slug = candidateSlug || (isCreate ? fallbackSlug() : currentArticle?.slug);
  }

  [
    "subtitle",
    "excerpt",
    "readTime",
    "heroLabel",
    "coverTone",
    "coverImage",
    "emailIntro",
    "relatedProductHint",
  ].forEach((field) => {
    if (body[field] !== undefined) {
      payload[field] = normalizeText(body[field]);
    }
  });

  if (body.category !== undefined) {
    const category = normalizeText(body.category);
    if (category && !JOURNAL_CATEGORIES.includes(category)) {
      throwHttpError(400, "Journal category is invalid.");
    }
    payload.category = category || undefined;
  }

  const tags = normalizeTags(body.tags);
  if (tags !== undefined) {
    payload.tags = tags;
  }

  const sections = normalizeSections(body.sections);
  if (sections !== undefined) {
    payload.sections = sections;
  }

  const publishDate = normalizePublishDate(body.publishDate);
  if (publishDate !== undefined || body.publishDate === "") {
    payload.publishDate = publishDate;
  }

  return payload;
};

const compactJournalAuditSnapshot = (article) => ({
  slug: article?.slug || "",
  title: article?.title || "",
  category: article?.category || "",
  status: article?.status || "",
  newsletterStatus: article?.newsletterStatus || "",
  publishDate: article?.publishDate || "",
  tagCount: Array.isArray(article?.tags) ? article.tags.length : 0,
  sectionCount: Array.isArray(article?.sections) ? article.sections.length : 0,
});

const validateObjectId = (id) => {
  if (!mongoose.isValidObjectId(id)) {
    throwHttpError(400, "Journal article id is invalid.");
  }
};

const ensureUniqueSlug = async (slug, articleId) => {
  if (!slug) {
    return;
  }

  const existing = await JournalArticle.findOne({ slug }).select("_id").lean();
  if (existing && String(existing._id) !== String(articleId || "")) {
    throwHttpError(409, "Journal article slug already exists.");
  }
};

const validateDraftArticle = (article) => {
  if (!normalizeText(article.title) || !normalizeText(article.slug)) {
    throwHttpError(400, "Draft article requires title and slug.");
  }
};

const validatePublishableArticle = (article) => {
  validateDraftArticle(article);

  const missing = [];
  ["subtitle", "excerpt", "category", "publishDate", "readTime", "heroLabel"].forEach((field) => {
    if (!article[field]) {
      missing.push(field);
    }
  });

  if (!Array.isArray(article.sections) || article.sections.length < 1) {
    missing.push("sections");
  }

  article.sections?.forEach((section, index) => {
    if (!normalizeText(section.heading) || !Array.isArray(section.body) || section.body.length < 1) {
      missing.push(`sections.${index + 1}`);
    }
  });

  if (missing.length > 0) {
    throwHttpError(400, `Article is missing required publish fields: ${missing.join(", ")}`);
  }
};

const getFrontendUrl = () =>
  process.env.FRONTEND_URL ||
  process.env.CLIENT_URL ||
  "https://soapdelight-j.onrender.com";

const getAdminArticleById = async (id) => {
  validateObjectId(id);
  const article = await JournalArticle.findById(id);
  if (!article) {
    throwHttpError(404, "Journal article not found.");
  }
  return article;
};

const handleDuplicateKey = (error) => {
  if (error?.code === 11000) {
    throwHttpError(409, "Journal article slug already exists.");
  }
  throw error;
};

export const getPublishedJournalArticles = asyncHandler(async (req, res) => {
  const category = normalizeText(req.query.category);
  const query = {
    status: "published",
    publishedAt: { $lte: new Date() },
  };

  if (category && category !== ALL_CATEGORY_LABEL) {
    if (!JOURNAL_CATEGORIES.includes(category)) {
      throwHttpError(400, "Journal category is invalid.");
    }
    query.category = category;
  }

  const articles = await JournalArticle.find(query)
    .sort({ publishDate: -1, publishedAt: -1, createdAt: -1 })
    .lean();

  res.status(200).json(articles);
});

export const getPublishedJournalArticleBySlug = asyncHandler(async (req, res) => {
  const slug = normalizeSlug(req.params.slug);
  if (!slug) {
    throwHttpError(404, "Journal article not found.");
  }

  const article = await JournalArticle.findOne({
    slug,
    status: "published",
    publishedAt: { $lte: new Date() },
  }).lean();

  if (!article) {
    throwHttpError(404, "Journal article not found.");
  }

  res.status(200).json(article);
});

export const getAdminJournalArticles = asyncHandler(async (req, res) => {
  const status = normalizeText(req.query.status);
  const category = normalizeText(req.query.category);
  const query = {};

  if (status) {
    if (!ARTICLE_STATUSES.includes(status)) {
      throwHttpError(400, "Journal article status is invalid.");
    }
    query.status = status;
  }

  if (category && category !== ALL_CATEGORY_LABEL) {
    if (!JOURNAL_CATEGORIES.includes(category)) {
      throwHttpError(400, "Journal category is invalid.");
    }
    query.category = category;
  }

  const articles = await JournalArticle.find(query).sort({ updatedAt: -1 }).lean();

  res.status(200).json(articles);
});

export const getAdminJournalArticleById = asyncHandler(async (req, res) => {
  const article = await getAdminArticleById(req.params.id);
  res.status(200).json(article);
});

export const createJournalArticle = asyncHandler(async (req, res) => {
  const payload = normalizeArticlePayload(req.body, { isCreate: true });
  validateDraftArticle(payload);
  await ensureUniqueSlug(payload.slug);

  try {
    const article = await JournalArticle.create({
      ...payload,
      status: "draft",
      createdBy: req.user?._id,
      updatedBy: req.user?._id,
    });

    await createAuditLog({
      req,
      actionType: "journal.created",
      actionLabel: "新增生活香氣誌文章",
      targetType: "JournalArticle",
      targetId: article._id,
      targetLabel: article.title,
      summary: `新增生活香氣誌文章：${article.title}`,
      after: compactJournalAuditSnapshot(article),
    });

    res.status(201).json(article);
  } catch (error) {
    handleDuplicateKey(error);
  }
});

export const updateJournalArticle = asyncHandler(async (req, res) => {
  const article = await getAdminArticleById(req.params.id);
  const payload = normalizeArticlePayload(req.body, {
    currentArticle: article,
  });
  const isChangingSlug = payload.slug && payload.slug !== article.slug;

  if (isChangingSlug && (article.firstPublishedAt || article.newsletterCampaignId)) {
    throwHttpError(
      400,
      "Slug cannot be changed after the article has been published or linked to a campaign."
    );
  }

  if (isChangingSlug) {
    await ensureUniqueSlug(payload.slug, article._id);
  }

  const before = compactJournalAuditSnapshot(article);
  Object.assign(article, payload, { updatedBy: req.user?._id });
  validateDraftArticle(article);
  if (article.status === "published") {
    validatePublishableArticle(article);
  }

  try {
    const updatedArticle = await article.save();

    await createAuditLog({
      req,
      actionType: "journal.updated",
      actionLabel: "編輯生活香氣誌文章",
      targetType: "JournalArticle",
      targetId: updatedArticle._id,
      targetLabel: updatedArticle.title,
      summary: `編輯生活香氣誌文章：${updatedArticle.title}`,
      before,
      after: compactJournalAuditSnapshot(updatedArticle),
    });

    res.status(200).json(updatedArticle);
  } catch (error) {
    handleDuplicateKey(error);
  }
});

export const updateJournalArticleStatus = asyncHandler(async (req, res) => {
  const article = await getAdminArticleById(req.params.id);
  const nextStatus = normalizeText(req.body.status);

  if (!ARTICLE_STATUSES.includes(nextStatus)) {
    throwHttpError(400, "Journal article status is invalid.");
  }

  if (article.status === nextStatus) {
    res.status(200).json(article);
    return;
  }

  const before = compactJournalAuditSnapshot(article);
  const now = new Date();
  let actionType = "journal.updated";
  let actionLabel = "更新生活香氣誌文章狀態";
  let summary = `更新生活香氣誌文章狀態：${article.title}`;
  const metadata = {};

  if (nextStatus === "published") {
    validatePublishableArticle(article);
    article.status = "published";
    article.publishedAt = now;
    article.firstPublishedAt = article.firstPublishedAt || now;
    article.publishedBy = req.user?._id;
    article.archivedAt = undefined;
    article.archivedBy = undefined;
    actionType = "journal.published";
    actionLabel = "發佈生活香氣誌文章";
    summary = `發佈生活香氣誌文章：${article.title}`;
  } else if (nextStatus === "archived") {
    article.status = "archived";
    article.archivedAt = now;
    article.archivedBy = req.user?._id;
    article.publishedAt = undefined;
    article.publishedBy = undefined;
    actionType = "journal.archived";
    actionLabel = "封存生活香氣誌文章";
    summary = `封存生活香氣誌文章：${article.title}`;
  } else if (article.status === "published") {
    article.status = "draft";
    article.publishedAt = undefined;
    article.publishedBy = undefined;
    article.archivedAt = undefined;
    article.archivedBy = undefined;
    if (article.newsletterSentAt) {
      metadata.newsletterPreviouslySent = true;
    }
    actionType = "journal.unpublished";
    actionLabel = "取消發佈生活香氣誌文章";
    summary = `取消發佈生活香氣誌文章：${article.title}`;
  } else {
    article.status = "draft";
    article.archivedAt = undefined;
    article.archivedBy = undefined;
    actionType = "journal.restored";
    actionLabel = "還原生活香氣誌文章";
    summary = `還原生活香氣誌文章：${article.title}`;
  }

  article.updatedBy = req.user?._id;
  const updatedArticle = await article.save();

  await createAuditLog({
    req,
    actionType,
    actionLabel,
    targetType: "JournalArticle",
    targetId: updatedArticle._id,
    targetLabel: updatedArticle.title,
    summary,
    before,
    after: compactJournalAuditSnapshot(updatedArticle),
    metadata,
  });

  res.status(200).json(updatedArticle);
});

export const createJournalCampaignDraft = asyncHandler(async (req, res) => {
  const article = await getAdminArticleById(req.params.id);

  if (article.status === "archived") {
    throwHttpError(400, "Archived journal articles cannot create campaign drafts.");
  }

  if (!article.title || !article.slug || !(article.emailIntro || article.excerpt)) {
    throwHttpError(400, "Journal article needs title, slug and email intro or excerpt before creating a campaign draft.");
  }

  if (article.newsletterCampaignId) {
    const existingCampaign = await Campaign.findById(article.newsletterCampaignId);
    if (existingCampaign?.status === "draft") {
      res.status(200).json({
        message: "Journal campaign draft already exists.",
        article,
        campaign: existingCampaign,
      });
      return;
    }
  }

  const existingDraftCampaign = await Campaign.findOne({
    journalArticle: article._id,
    status: "draft",
  }).sort({ createdAt: -1 });

  if (existingDraftCampaign) {
    article.newsletterStatus = "draft_created";
    article.newsletterCampaignId = existingDraftCampaign._id;
    article.updatedBy = req.user?._id;
    await article.save();

    res.status(200).json({
      message: "Existing journal campaign draft was relinked.",
      article,
      campaign: existingDraftCampaign,
    });
    return;
  }

  const before = compactJournalAuditSnapshot(article);
  let campaign;
  let updatedArticle;

  try {
    campaign = await Campaign.create({
      title: article.title,
      subject: `SoapDelight.J 生活香氣誌｜${article.title}`,
      message: article.emailIntro || article.excerpt,
      couponCode: "",
      buttonLabel: "閱讀文章",
      buttonLink: `${getFrontendUrl()}/journal/${article.slug}`,
      status: "draft",
      channel: "email",
      source: "journal",
      journalArticle: article._id,
      createdBy: req.user?._id,
    });

    article.newsletterStatus = "draft_created";
    article.newsletterCampaignId = campaign._id;
    article.updatedBy = req.user?._id;
    updatedArticle = await article.save();
  } catch (error) {
    if (campaign?._id) {
      try {
        await Campaign.deleteOne({
          _id: campaign._id,
          status: "draft",
        });
      } catch (cleanupError) {
        console.error(
          "Failed to remove orphaned journal campaign draft:",
          cleanupError?.message || cleanupError
        );
      }
    }

    throw error;
  }

  await createAuditLog({
    req,
    actionType: "journal.newsletter_draft_created",
    actionLabel: "建立生活香氣誌推廣草稿",
    targetType: "JournalArticle",
    targetId: updatedArticle._id,
    targetLabel: updatedArticle.title,
    summary: `建立生活香氣誌推廣草稿：${updatedArticle.title}`,
    before,
    after: compactJournalAuditSnapshot(updatedArticle),
    metadata: {
      campaignId: String(campaign._id),
    },
  });

  res.status(201).json({
    message: "Journal campaign draft created.",
    article: updatedArticle,
    campaign,
  });
});

export const deleteJournalArticle = asyncHandler(async (req, res) => {
  const article = await getAdminArticleById(req.params.id);

  if (article.status !== "draft" || article.firstPublishedAt) {
    throwHttpError(400, "Only never-published draft journal articles can be deleted. Please archive this article instead.");
  }

  if (article.newsletterCampaignId) {
    const linkedCampaign = await Campaign.findById(article.newsletterCampaignId).select("status").lean();
    if (linkedCampaign?.status === "draft") {
      throwHttpError(400, "Please delete the linked campaign draft before deleting this journal article.");
    }
  }

  const before = compactJournalAuditSnapshot(article);
  const articleId = String(article._id);
  const articleTitle = article.title;
  await article.deleteOne();

  await createAuditLog({
    req,
    actionType: "journal.deleted",
    actionLabel: "刪除生活香氣誌文章",
    targetType: "JournalArticle",
    targetId: articleId,
    targetLabel: articleTitle,
    summary: `刪除生活香氣誌文章：${articleTitle}`,
    before,
  });

  res.status(200).json({ message: "Journal article deleted." });
});
