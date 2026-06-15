import dotenv from "dotenv";
import mongoose from "mongoose";
import JournalArticle from "../models/journalArticleModel.js";
import { journalArticles } from "../../SoapDelight.J/src/data/journalArticles.js";

dotenv.config();

const toMacauPublishDate = (publishDate) => new Date(`${publishDate}T00:00:00+08:00`);

const run = async () => {
  if (!process.env.MONGO) {
    throw new Error("MONGO connection string is missing.");
  }

  await mongoose.connect(process.env.MONGO);

  let inserted = 0;
  let skipped = 0;

  for (const article of journalArticles) {
    const publishDate = toMacauPublishDate(article.publishDate);
    const result = await JournalArticle.updateOne(
      { slug: article.slug },
      {
        $setOnInsert: {
          ...article,
          publishDate,
          status: "published",
          publishedAt: publishDate,
          firstPublishedAt: publishDate,
          newsletterStatus: "not_prepared",
        },
      },
      { upsert: true }
    );

    if (result.upsertedCount > 0) {
      inserted += 1;
    } else {
      skipped += 1;
    }
  }

  console.log(`Journal seed complete. Inserted: ${inserted}. Existing/skipped: ${skipped}.`);
  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
