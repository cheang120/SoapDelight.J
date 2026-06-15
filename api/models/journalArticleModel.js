import mongoose from "mongoose";

const JOURNAL_CATEGORIES = [
  "香氣知識",
  "日常護理",
  "手作理念",
  "生活選物",
  "送禮靈感",
];

const sectionSchema = new mongoose.Schema(
  {
    heading: {
      type: String,
      trim: true,
      default: "",
    },
    body: {
      type: [String],
      default: [],
    },
    image: {
      type: String,
      trim: true,
      default: "",
    },
    imageAlt: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false }
);

const journalArticleSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subtitle: {
      type: String,
      trim: true,
      default: "",
    },
    excerpt: {
      type: String,
      trim: true,
      default: "",
    },
    category: {
      type: String,
      enum: JOURNAL_CATEGORIES,
    },
    tags: {
      type: [String],
      default: [],
    },
    publishDate: {
      type: Date,
    },
    readTime: {
      type: String,
      trim: true,
      default: "",
    },
    heroLabel: {
      type: String,
      trim: true,
      default: "",
    },
    coverTone: {
      type: String,
      trim: true,
      default: "lavender",
    },
    coverImage: {
      type: String,
      trim: true,
      default: "",
    },
    emailIntro: {
      type: String,
      trim: true,
      default: "",
    },
    relatedProductHint: {
      type: String,
      trim: true,
      default: "",
    },
    sections: {
      type: [sectionSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
      index: true,
    },
    publishedAt: {
      type: Date,
    },
    firstPublishedAt: {
      type: Date,
    },
    publishedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    archivedAt: {
      type: Date,
    },
    archivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    newsletterStatus: {
      type: String,
      enum: ["not_prepared", "draft_created", "sent"],
      default: "not_prepared",
    },
    newsletterCampaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
    },
    newsletterSentAt: {
      type: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

journalArticleSchema.index({ status: 1, publishDate: -1 });
journalArticleSchema.index({ category: 1, status: 1, publishDate: -1 });

export { JOURNAL_CATEGORIES };

const JournalArticle = mongoose.model("JournalArticle", journalArticleSchema);

export default JournalArticle;
