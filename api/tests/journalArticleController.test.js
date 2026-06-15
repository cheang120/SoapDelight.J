import test from "node:test";
import assert from "node:assert/strict";
import {
  createJournalCampaignDraft,
  updateJournalArticle,
} from "../controllers/journalArticleController.js";
import Campaign from "../models/campaignModel.js";
import JournalArticle from "../models/journalArticleModel.js";

const articleId = "64b000000000000000000001";
const campaignId = "64b000000000000000000002";
const newCampaignId = "64b000000000000000000003";

const createResponse = () => {
  const result = {
    statusCode: 200,
    body: undefined,
  };

  return {
    result,
    status(code) {
      result.statusCode = code;
      return this;
    },
    json(body) {
      result.body = body;
      return this;
    },
  };
};

const runHandler = async (handler, req) => {
  const res = createResponse();
  let nextError;

  await handler(req, res, (error) => {
    nextError = error;
  });

  return { res, error: nextError };
};

const patchMethods = (patches) => {
  const originals = [];

  patches.forEach(([target, method, replacement]) => {
    originals.push([target, method, target[method]]);
    target[method] = replacement;
  });

  return () => {
    originals.reverse().forEach(([target, method, original]) => {
      target[method] = original;
    });
  };
};

const createCompleteArticle = (overrides = {}) => ({
  _id: articleId,
  title: "完整文章",
  slug: "complete-article",
  subtitle: "副標題",
  excerpt: "摘要",
  category: "香氣知識",
  publishDate: new Date("2026-06-07T00:00:00+08:00"),
  readTime: "4 分鐘閱讀",
  heroLabel: "Hero",
  emailIntro: "Email intro",
  tags: ["香氣"],
  sections: [
    {
      heading: "段落",
      body: ["內容"],
      image: "",
      imageAlt: "",
    },
  ],
  status: "draft",
  firstPublishedAt: undefined,
  newsletterCampaignId: undefined,
  save: async () => {
    throw new Error("Unexpected save call.");
  },
  ...overrides,
});

const createRequest = ({ body = {}, id = articleId } = {}) => ({
  params: { id },
  body,
  user: { _id: "64b000000000000000000099" },
  get: () => "",
  headers: {},
});

test("published article cannot be updated into incomplete content", async () => {
  let saveCalled = false;
  const article = createCompleteArticle({
    status: "published",
    save: async () => {
      saveCalled = true;
      return article;
    },
  });
  const restore = patchMethods([
    [JournalArticle, "findById", async () => article],
    [JournalArticle, "findOne", () => ({
      select: () => ({
        lean: async () => null,
      }),
    })],
  ]);

  try {
    const { error } = await runHandler(
      updateJournalArticle,
      createRequest({ body: { subtitle: "" } })
    );

    assert.equal(error?.statusCode, 400);
    assert.match(error?.message, /Article is missing required publish fields/);
    assert.equal(saveCalled, false);
  } finally {
    restore();
  }
});

test("previously published article cannot change slug", async () => {
  let findOneCalled = false;
  let saveCalled = false;
  const article = createCompleteArticle({
    status: "draft",
    firstPublishedAt: new Date(),
    save: async () => {
      saveCalled = true;
      return article;
    },
  });
  const restore = patchMethods([
    [JournalArticle, "findById", async () => article],
    [JournalArticle, "findOne", async () => {
      findOneCalled = true;
      return null;
    }],
  ]);

  try {
    const { error } = await runHandler(
      updateJournalArticle,
      createRequest({ body: { slug: "changed-slug" } })
    );

    assert.equal(error?.statusCode, 400);
    assert.equal(
      error?.message,
      "Slug cannot be changed after the article has been published or linked to a campaign."
    );
    assert.equal(findOneCalled, false);
    assert.equal(saveCalled, false);
  } finally {
    restore();
  }
});

test("draft linked to campaign cannot change slug", async () => {
  let findOneCalled = false;
  let saveCalled = false;
  const article = createCompleteArticle({
    status: "draft",
    firstPublishedAt: undefined,
    newsletterCampaignId: campaignId,
    save: async () => {
      saveCalled = true;
      return article;
    },
  });
  const restore = patchMethods([
    [JournalArticle, "findById", async () => article],
    [JournalArticle, "findOne", async () => {
      findOneCalled = true;
      return null;
    }],
  ]);

  try {
    const { error } = await runHandler(
      updateJournalArticle,
      createRequest({ body: { slug: "changed-slug" } })
    );

    assert.equal(error?.statusCode, 400);
    assert.equal(
      error?.message,
      "Slug cannot be changed after the article has been published or linked to a campaign."
    );
    assert.equal(findOneCalled, false);
    assert.equal(saveCalled, false);
  } finally {
    restore();
  }
});

test("never-published unlinked draft can pass slug guard", async () => {
  const article = createCompleteArticle({
    status: "draft",
    firstPublishedAt: undefined,
    newsletterCampaignId: undefined,
    save: async () => {
      throw new Error("SAVE_REACHED");
    },
  });
  const restore = patchMethods([
    [JournalArticle, "findById", async () => article],
    [JournalArticle, "findOne", () => ({
      select: () => ({
        lean: async () => null,
      }),
    })],
  ]);

  try {
    const { error } = await runHandler(
      updateJournalArticle,
      createRequest({ body: { slug: "changed-slug" } })
    );

    assert.equal(error?.message, "SAVE_REACHED");
    assert.equal(article.slug, "changed-slug");
  } finally {
    restore();
  }
});

test("existing newsletterCampaignId draft returns without creating campaign", async () => {
  let findOneCalled = false;
  let createCalled = false;
  let saveCalled = false;
  const article = createCompleteArticle({
    newsletterCampaignId: campaignId,
    save: async () => {
      saveCalled = true;
      return article;
    },
  });
  const campaign = { _id: campaignId, status: "draft", title: "Existing draft" };
  const restore = patchMethods([
    [JournalArticle, "findById", async () => article],
    [Campaign, "findById", async () => campaign],
    [Campaign, "findOne", () => {
      findOneCalled = true;
      return { sort: async () => null };
    }],
    [Campaign, "create", async () => {
      createCalled = true;
      return {};
    }],
  ]);

  try {
    const { res, error } = await runHandler(
      createJournalCampaignDraft,
      createRequest()
    );

    assert.equal(error, undefined);
    assert.equal(res.result.statusCode, 200);
    assert.equal(res.result.body.campaign, campaign);
    assert.equal(findOneCalled, false);
    assert.equal(createCalled, false);
    assert.equal(saveCalled, false);
  } finally {
    restore();
  }
});

test("missing article link relinks existing draft campaign", async () => {
  let saveCount = 0;
  let createCalled = false;
  const article = createCompleteArticle({
    newsletterCampaignId: undefined,
    save: async () => {
      saveCount += 1;
      return article;
    },
  });
  const campaign = { _id: campaignId, status: "draft", title: "Orphan draft" };
  const restore = patchMethods([
    [JournalArticle, "findById", async () => article],
    [Campaign, "findOne", () => ({ sort: async () => campaign })],
    [Campaign, "create", async () => {
      createCalled = true;
      return {};
    }],
  ]);

  try {
    const { res, error } = await runHandler(
      createJournalCampaignDraft,
      createRequest()
    );

    assert.equal(error, undefined);
    assert.equal(res.result.statusCode, 200);
    assert.equal(res.result.body.message, "Existing journal campaign draft was relinked.");
    assert.equal(article.newsletterStatus, "draft_created");
    assert.equal(article.newsletterCampaignId, campaignId);
    assert.equal(saveCount, 1);
    assert.equal(createCalled, false);
  } finally {
    restore();
  }
});

test("new campaign draft is rolled back when article save fails", async () => {
  let deleteQuery;
  const article = createCompleteArticle({
    save: async () => {
      throw new Error("ARTICLE_SAVE_FAILED");
    },
  });
  const restore = patchMethods([
    [JournalArticle, "findById", async () => article],
    [Campaign, "findOne", () => ({ sort: async () => null })],
    [Campaign, "create", async () => ({ _id: newCampaignId, status: "draft" })],
    [Campaign, "deleteOne", async (query) => {
      deleteQuery = query;
      return { deletedCount: 1 };
    }],
  ]);

  try {
    const { error } = await runHandler(
      createJournalCampaignDraft,
      createRequest()
    );

    assert.equal(error?.message, "ARTICLE_SAVE_FAILED");
    assert.deepEqual(deleteQuery, {
      _id: newCampaignId,
      status: "draft",
    });
  } finally {
    restore();
  }
});

test("rollback cleanup failure preserves original article save error", async () => {
  const originalConsoleError = console.error;
  console.error = () => {};

  const article = createCompleteArticle({
    save: async () => {
      throw new Error("ARTICLE_SAVE_FAILED");
    },
  });
  const restore = patchMethods([
    [JournalArticle, "findById", async () => article],
    [Campaign, "findOne", () => ({ sort: async () => null })],
    [Campaign, "create", async () => ({ _id: newCampaignId, status: "draft" })],
    [Campaign, "deleteOne", async () => {
      throw new Error("CLEANUP_FAILED");
    }],
  ]);

  try {
    const { error } = await runHandler(
      createJournalCampaignDraft,
      createRequest()
    );

    assert.equal(error?.message, "ARTICLE_SAVE_FAILED");
  } finally {
    restore();
    console.error = originalConsoleError;
  }
});

test("post-save failure does not roll back an already linked campaign", async () => {
  let tagReadCount = 0;
  let deleteCalled = false;
  const article = createCompleteArticle({
    save: async () => article,
  });

  Object.defineProperty(article, "tags", {
    configurable: true,
    get() {
      tagReadCount += 1;
      // compactJournalAuditSnapshot reads tags twice per snapshot:
      // once for Array.isArray() and once for .length.
      if (tagReadCount > 2) {
        throw new Error("POST_SAVE_FAILURE");
      }
      return ["香氣"];
    },
  });

  const restore = patchMethods([
    [JournalArticle, "findById", async () => article],
    [Campaign, "findOne", () => ({ sort: async () => null })],
    [Campaign, "create", async () => ({ _id: newCampaignId, status: "draft" })],
    [Campaign, "deleteOne", async () => {
      deleteCalled = true;
      return { deletedCount: 1 };
    }],
  ]);

  try {
    const { error } = await runHandler(
      createJournalCampaignDraft,
      createRequest()
    );

    assert.equal(error?.message, "POST_SAVE_FAILURE");
    assert.equal(deleteCalled, false);
    assert.equal(article.newsletterStatus, "draft_created");
    assert.equal(article.newsletterCampaignId, newCampaignId);
  } finally {
    restore();
  }
});
