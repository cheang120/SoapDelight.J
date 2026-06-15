import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import journalService, { JOURNAL_CATEGORIES } from "../../../services/journalService";
import JournalImageUpload from "./JournalImageUpload";
import "./JournalAdmin.scss";

const createEditorKey = () =>
  globalThis.crypto?.randomUUID?.() ||
  `section-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const emptySection = () => ({
  _editorKey: createEditorKey(),
  heading: "",
  body: [""],
  image: "",
  imageAlt: "",
});

const createInitialForm = () => ({
  slug: "",
  title: "",
  subtitle: "",
  excerpt: "",
  category: "",
  tags: "",
  publishDate: "",
  readTime: "",
  heroLabel: "",
  coverTone: "lavender",
  coverImage: "",
  emailIntro: "",
  relatedProductHint: "",
  sections: [emptySection()],
});

const toMacauDateInputValue = (value) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Macau",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );

  return `${values.year}-${values.month}-${values.day}`;
};

const getErrorMessage = (error, fallback) =>
  error.response?.data?.message || error.message || fallback;

const normalizeArticleToForm = (article) => ({
  slug: article.slug || "",
  title: article.title || "",
  subtitle: article.subtitle || "",
  excerpt: article.excerpt || "",
  category: article.category || "",
  tags: (article.tags || []).join(", "),
  publishDate: toMacauDateInputValue(article.publishDate),
  readTime: article.readTime || "",
  heroLabel: article.heroLabel || "",
  coverTone: article.coverTone || "lavender",
  coverImage: article.coverImage || "",
  emailIntro: article.emailIntro || "",
  relatedProductHint: article.relatedProductHint || "",
  sections: (article.sections?.length ? article.sections : [emptySection()]).map((section) => ({
    _editorKey: createEditorKey(),
    heading: section.heading || "",
    body: section.body?.length ? section.body : [""],
    image: section.image || "",
    imageAlt: section.imageAlt || "",
  })),
});

const buildPayload = (form) => ({
  slug: form.slug.trim(),
  title: form.title.trim(),
  subtitle: form.subtitle.trim(),
  excerpt: form.excerpt.trim(),
  category: form.category.trim(),
  tags: form.tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean),
  publishDate: form.publishDate || "",
  readTime: form.readTime.trim(),
  heroLabel: form.heroLabel.trim(),
  coverTone: form.coverTone.trim() || "lavender",
  coverImage: form.coverImage.trim(),
  emailIntro: form.emailIntro.trim(),
  relatedProductHint: form.relatedProductHint.trim(),
  sections: form.sections.map((section) => ({
    heading: section.heading.trim(),
    body: (section.body || []).map((paragraph) => paragraph.trim()).filter(Boolean),
    image: section.image.trim(),
    imageAlt: section.imageAlt.trim(),
  })),
});

const JournalEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id;
  const [form, setForm] = useState(createInitialForm);
  const [article, setArticle] = useState(null);
  const [isLoading, setIsLoading] = useState(!isNew);
  const [loadError, setLoadError] = useState("");
  const [isNotFound, setIsNotFound] = useState(false);
  const [activeUploadKey, setActiveUploadKey] = useState("");
  const [pendingUploadCount, setPendingUploadCount] = useState(0);
  const [operationType, setOperationType] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [savedState, setSavedState] = useState(isNew ? "尚未儲存" : "已儲存");
  const requestIdRef = useRef(0);
  const operationLockRef = useRef(false);
  const activeUploadKeyRef = useRef("");
  const pendingUploadKeysRef = useRef(new Set());

  const slugLocked = Boolean(article?.firstPublishedAt || article?.newsletterCampaignId);
  const status = article?.status || "draft";
  const hasCampaign = article?.newsletterStatus !== "sent" && Boolean(article?.newsletterCampaignId);
  const isImageUploading = Boolean(activeUploadKey);
  const isOperationBusy = Boolean(operationType);
  const isBusy = isImageUploading || isOperationBusy;
  const hasPendingImage = pendingUploadCount > 0;
  const isArticleActionBlocked = isBusy || hasPendingImage;

  const previewTags = useMemo(
    () => form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
    [form.tags]
  );

  const resetNewArticle = () => {
    requestIdRef.current += 1;
    setForm(createInitialForm());
    setArticle(null);
    setIsLoading(false);
    setLoadError("");
    setIsNotFound(false);
    setIsDirty(false);
    setSavedState("尚未儲存");
    pendingUploadKeysRef.current.clear();
    setPendingUploadCount(0);
  };

  const loadArticle = async () => {
    if (isNew) {
      resetNewArticle();
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setIsLoading(true);
    setLoadError("");
    setIsNotFound(false);
    setArticle(null);

    try {
      const data = await journalService.getAdminArticle(id);
      if (requestIdRef.current !== requestId) return;
      setArticle(data);
      setForm(normalizeArticleToForm(data));
      setIsDirty(false);
      setSavedState("已儲存");
    } catch (error) {
      if (requestIdRef.current !== requestId) return;
      if (error.response?.status === 404) {
        setIsNotFound(true);
      } else {
        setLoadError(getErrorMessage(error, "未能載入文章"));
      }
    } finally {
      if (requestIdRef.current === requestId) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    loadArticle();

    return () => {
      requestIdRef.current += 1;
    };
  }, [id]);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (!isDirty && !hasPendingImage) return;
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasPendingImage, isDirty]);

  const runExclusiveOperation = async (type, task) => {
    if (pendingUploadKeysRef.current.size > 0) {
      toast.error("請先上傳或取消所選圖片。");
      return null;
    }

    if (operationLockRef.current || activeUploadKeyRef.current) {
      toast.error(activeUploadKeyRef.current ? "圖片上傳中，請稍候。" : "操作進行中，請稍候。");
      return null;
    }

    operationLockRef.current = true;
    setOperationType(type);

    try {
      return await task();
    } finally {
      operationLockRef.current = false;
      setOperationType("");
    }
  };

  const updateForm = (updater) => {
    setForm((prev) => (typeof updater === "function" ? updater(prev) : { ...prev, ...updater }));
    setIsDirty(true);
    setSavedState("尚未儲存");
  };

  const handleUploadStateChange = (uploadKey, isUploading) => {
    if (isUploading && !activeUploadKeyRef.current) {
      activeUploadKeyRef.current = uploadKey;
    }

    if (!isUploading && activeUploadKeyRef.current === uploadKey) {
      activeUploadKeyRef.current = "";
    }

    setActiveUploadKey((currentKey) => {
      if (isUploading) {
        return currentKey || uploadKey;
      }
      return currentKey === uploadKey ? "" : currentKey;
    });
  };

  const handlePendingStateChange = (uploadKey, isPending) => {
    const nextKeys = new Set(pendingUploadKeysRef.current);
    if (isPending) {
      nextKeys.add(uploadKey);
    } else {
      nextKeys.delete(uploadKey);
    }
    pendingUploadKeysRef.current = nextKeys;
    setPendingUploadCount(nextKeys.size);
  };

  const clearPendingKey = (uploadKey) => {
    if (!pendingUploadKeysRef.current.has(uploadKey)) return;
    const nextKeys = new Set(pendingUploadKeysRef.current);
    nextKeys.delete(uploadKey);
    pendingUploadKeysRef.current = nextKeys;
    setPendingUploadCount(nextKeys.size);
  };

  const handleBackToList = (event) => {
    if (!isDirty && !hasPendingImage) return;
    const message = hasPendingImage
      ? "仍有圖片已選擇但尚未上傳。離開會失去這些選擇，確定返回文章列表？"
      : "文章仍有未儲存修改，確定返回文章列表？";
    if (!window.confirm(message)) {
      event.preventDefault();
    }
  };

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    updateForm({ [name]: value });
  };

  const updateSection = (sectionIndex, patch) => {
    updateForm((prev) => ({
      ...prev,
      sections: prev.sections.map((section, index) =>
        index === sectionIndex ? { ...section, ...patch } : section
      ),
    }));
  };

  const updateParagraph = (sectionIndex, paragraphIndex, value) => {
    updateForm((prev) => ({
      ...prev,
      sections: prev.sections.map((section, index) => {
        if (index !== sectionIndex) return section;
        return {
          ...section,
          body: section.body.map((paragraph, bodyIndex) =>
            bodyIndex === paragraphIndex ? value : paragraph
          ),
        };
      }),
    }));
  };

  const addSection = () => {
    if (isBusy) return;
    updateForm((prev) => ({
      ...prev,
      sections: [...prev.sections, emptySection()],
    }));
  };

  const removeSection = (sectionIndex) => {
    if (isBusy) return;
    const sectionKey = form.sections[sectionIndex]?._editorKey;
    if (sectionKey) {
      clearPendingKey(`section-${sectionKey}`);
    }
    updateForm((prev) => ({
      ...prev,
      sections: prev.sections.length > 1
        ? prev.sections.filter((_, index) => index !== sectionIndex)
        : prev.sections,
    }));
  };

  const moveSection = (sectionIndex, direction) => {
    if (isBusy) return;
    updateForm((prev) => {
      const nextIndex = sectionIndex + direction;
      if (nextIndex < 0 || nextIndex >= prev.sections.length) return prev;
      const sections = [...prev.sections];
      [sections[sectionIndex], sections[nextIndex]] = [sections[nextIndex], sections[sectionIndex]];
      return { ...prev, sections };
    });
  };

  const addParagraph = (sectionIndex) => {
    if (isBusy) return;
    updateForm((prev) => ({
      ...prev,
      sections: prev.sections.map((section, index) =>
        index === sectionIndex ? { ...section, body: [...section.body, ""] } : section
      ),
    }));
  };

  const removeParagraph = (sectionIndex, paragraphIndex) => {
    if (isBusy) return;
    updateForm((prev) => ({
      ...prev,
      sections: prev.sections.map((section, index) => {
        if (index !== sectionIndex || section.body.length <= 1) return section;
        return {
          ...section,
          body: section.body.filter((_, bodyIndex) => bodyIndex !== paragraphIndex),
        };
      }),
    }));
  };

  const persistArticle = async ({ notify = true } = {}) => {
    try {
      const payload = buildPayload(form);
      const savedArticle = isNew
        ? await journalService.createArticle(payload)
        : await journalService.updateArticle(id, payload);

      setArticle(savedArticle);
      setForm(normalizeArticleToForm(savedArticle));
      setIsDirty(false);
      setSavedState("已儲存");

      if (notify) {
        toast.success(isNew ? "文章草稿已建立。" : "文章已儲存。");
      }

      if (isNew) {
        navigate(`/productAdmin/journal/${savedArticle._id}`, { replace: true });
      }

      return savedArticle;
    } catch (error) {
      toast.error(getErrorMessage(error, "未能儲存文章"));
      return null;
    }
  };

  const handleSave = async (event) => {
    event.preventDefault();
    await runExclusiveOperation("save", () => persistArticle());
  };

  const changeStatus = async (nextStatus, label) => {
    if (!article?._id && !isDirty) return;
    if (pendingUploadKeysRef.current.size > 0) {
      toast.error("請先上傳或取消所選圖片。");
      return;
    }

    const confirmed = window.confirm(`${label}「${form.title || article?.title || "此文章"}」？`);
    if (!confirmed) return;

    await runExclusiveOperation(`status-${nextStatus}`, async () => {
      let targetArticle = article;

      if (isDirty) {
        targetArticle = await persistArticle({ notify: false });
        if (!targetArticle?._id) return null;
      }

      const updated = await journalService.updateArticleStatus(targetArticle._id, nextStatus);
      setArticle(updated);
      setForm(normalizeArticleToForm(updated));
      setIsDirty(false);
      setSavedState("已儲存");
      toast.success(`${label}完成。`);
      return updated;
    }).catch((error) => {
      toast.error(getErrorMessage(error, `${label}失敗`));
    });
  };

  const handleCampaignDraft = async () => {
    if (!article?._id && !isDirty) return;
    if (pendingUploadKeysRef.current.size > 0) {
      toast.error("請先上傳或取消所選圖片。");
      return;
    }

    const confirmed = window.confirm(`為「${form.title || article?.title || "此文章"}」建立推廣電郵草稿？`);
    if (!confirmed) return;

    await runExclusiveOperation("campaign", async () => {
      let targetArticle = article;

      if (isDirty) {
        targetArticle = await persistArticle({ notify: false });
        if (!targetArticle?._id) return null;
      }

      const data = await journalService.createCampaignDraft(targetArticle._id);
      if (data.article) {
        setArticle(data.article);
        setForm(normalizeArticleToForm(data.article));
      }
      setIsDirty(false);
      setSavedState("已儲存");
      toast.success("推廣電郵草稿已準備。");
      return data;
    }).catch((error) => {
      toast.error(getErrorMessage(error, "未能建立推廣電郵草稿"));
    });
  };

  const handleGoToCampaigns = async () => {
    if (pendingUploadKeysRef.current.size > 0) {
      toast.error("請先上傳或取消所選圖片。");
      return;
    }

    if (!isDirty) {
      navigate("/productAdmin/campaigns");
      return;
    }

    await runExclusiveOperation("save-before-campaigns", async () => {
      const savedArticle = await persistArticle({ notify: false });
      if (savedArticle?._id) {
        navigate("/productAdmin/campaigns");
      }
      return savedArticle;
    });
  };

  const getActionLabel = (type, fallback) => {
    if (operationType === type) return fallback;
    return "";
  };

  if (isLoading) {
    return <p className="journal-admin-empty">正在載入文章...</p>;
  }

  if (isNotFound) {
    return (
      <section className="journal-admin-page">
        <div className="journal-admin-panel journal-admin-error">
          <h2>找不到這篇文章</h2>
          <p>這篇生活香氣誌文章可能已被移除。</p>
          <Link className="journal-admin-button journal-admin-button--secondary" to="/productAdmin/journal">
            返回文章列表
          </Link>
        </div>
      </section>
    );
  }

  if (loadError) {
    return (
      <section className="journal-admin-page">
        <div className="journal-admin-panel journal-admin-error">
          <h2>未能載入文章</h2>
          <p>{loadError}</p>
          <div className="journal-admin-row-actions">
            <button type="button" className="journal-admin-button journal-admin-button--primary" onClick={loadArticle}>
              重新載入
            </button>
            <Link className="journal-admin-button journal-admin-button--secondary" to="/productAdmin/journal">
              返回文章列表
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="journal-admin-page">
      <header className="journal-admin-header journal-editor-header">
        <div>
          <p className="journal-admin-eyebrow">行銷工具</p>
          <h2 className="journal-admin-title">{isNew ? "新增生活香氣誌文章" : "編輯生活香氣誌文章"}</h2>
          <p className="journal-admin-subtitle">
            編輯文章內容、圖片、段落及推送設定。{isDirty ? " 目前有未儲存修改。" : ""}
          </p>
        </div>
        <div className="journal-editor-status">
          {activeUploadKey ? "圖片上傳中" : operationType ? "操作中" : savedState}
        </div>
      </header>

      <div className="journal-editor-actions">
        <Link className="journal-admin-button journal-admin-button--secondary" to="/productAdmin/journal" onClick={handleBackToList}>
          返回文章列表
        </Link>
        <button type="button" className="journal-admin-button journal-admin-button--primary" onClick={() => runExclusiveOperation("save", () => persistArticle())} disabled={isArticleActionBlocked}>
          {operationType === "save" ? "儲存中..." : isNew ? "儲存草稿" : "儲存修改"}
        </button>
        {!isNew && status === "draft" && (
          <>
            <button type="button" className="journal-admin-button" disabled={isArticleActionBlocked} onClick={() => changeStatus("published", "發布")}>
              {getActionLabel("status-published", "發布中...") || "發布"}
            </button>
            <button type="button" className="journal-admin-button journal-admin-button--danger" disabled={isArticleActionBlocked} onClick={() => changeStatus("archived", "封存")}>
              {getActionLabel("status-archived", "封存中...") || "封存"}
            </button>
          </>
        )}
        {!isNew && status === "published" && (
          <>
            <button type="button" className="journal-admin-button" disabled={isArticleActionBlocked} onClick={() => changeStatus("draft", "取消發布")}>
              {getActionLabel("status-draft", "取消發布中...") || "取消發布"}
            </button>
            <button type="button" className="journal-admin-button journal-admin-button--danger" disabled={isArticleActionBlocked} onClick={() => changeStatus("archived", "封存")}>
              {getActionLabel("status-archived", "封存中...") || "封存"}
            </button>
            <a
              className={`journal-admin-button journal-admin-button--secondary ${isDirty || hasPendingImage ? "is-disabled" : ""}`}
              href={isDirty || hasPendingImage ? undefined : `/journal/${article.slug}`}
              target="_blank"
              rel="noreferrer"
              title={isDirty || hasPendingImage ? "請先儲存文章修改" : undefined}
              onClick={(event) => {
                if (isDirty || hasPendingImage) event.preventDefault();
              }}
            >
              查看公開頁
            </a>
          </>
        )}
        {!isNew && status === "archived" && (
          <button type="button" className="journal-admin-button" disabled={isArticleActionBlocked} onClick={() => changeStatus("draft", "恢復為草稿")}>
            {getActionLabel("status-draft", "恢復中...") || "恢復為草稿"}
          </button>
        )}
        {!isNew && status !== "archived" && (
          hasCampaign ? (
            <button type="button" className="journal-admin-button journal-admin-button--secondary" disabled={isArticleActionBlocked} onClick={handleGoToCampaigns}>
              前往推廣電郵
            </button>
          ) : (
            <button type="button" className="journal-admin-button" disabled={isArticleActionBlocked} onClick={handleCampaignDraft}>
              {operationType === "campaign" ? "建立中..." : article?.newsletterStatus === "sent" ? "建立另一個推送草稿" : "建立推送草稿"}
            </button>
          )
        )}
      </div>

      <div className="journal-editor-grid">
        <form className="journal-admin-panel journal-editor-form" onSubmit={handleSave}>
          <fieldset className="journal-editor-fieldset" disabled={isBusy}>
            <div className="journal-admin-panel-heading">
              <h3>基本資料</h3>
              <p>新文章可留空 slug，由後端產生；文章曾發布或已建立推送後，網址不可再修改。</p>
            </div>

            <label className="journal-editor-field">
              <span>標題</span>
              <input name="title" value={form.title} onChange={handleFieldChange} required />
            </label>
            <label className="journal-editor-field">
              <span>Slug</span>
              <input name="slug" value={form.slug} onChange={handleFieldChange} disabled={isBusy || slugLocked} placeholder="my-journal-article" />
              {slugLocked && <small>文章曾發布或已建立推送後，網址不可再修改。</small>}
            </label>
            <label className="journal-editor-field journal-editor-field--full">
              <span>副標題</span>
              <textarea name="subtitle" value={form.subtitle} onChange={handleFieldChange} />
            </label>
            <label className="journal-editor-field journal-editor-field--full">
              <span>摘要</span>
              <textarea name="excerpt" value={form.excerpt} onChange={handleFieldChange} />
            </label>
            <label className="journal-editor-field">
              <span>分類</span>
              <select name="category" value={form.category} onChange={handleFieldChange}>
                <option value="">選擇分類</option>
                {JOURNAL_CATEGORIES.filter((item) => item !== "全部").map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>
            <label className="journal-editor-field">
              <span>標籤</span>
              <input name="tags" value={form.tags} onChange={handleFieldChange} placeholder="香氣, 生活儀式, 空間氛圍" />
            </label>
            <label className="journal-editor-field">
              <span>發布日期</span>
              <input type="date" name="publishDate" value={form.publishDate} onChange={handleFieldChange} />
            </label>
            <label className="journal-editor-field">
              <span>閱讀時間</span>
              <input name="readTime" value={form.readTime} onChange={handleFieldChange} placeholder="4 分鐘閱讀" />
            </label>
            <label className="journal-editor-field">
              <span>Hero Label</span>
              <input name="heroLabel" value={form.heroLabel} onChange={handleFieldChange} />
            </label>
            <label className="journal-editor-field">
              <span>Cover Tone</span>
              <input name="coverTone" value={form.coverTone} onChange={handleFieldChange} placeholder="lavender" />
            </label>
            <div className="journal-editor-field journal-editor-field--full">
              <JournalImageUpload
                label="文章封面圖片"
                value={form.coverImage}
                alt={form.title || "文章封面"}
                uploadKey="cover"
                disabled={isBusy}
                onChange={(url) => updateForm({ coverImage: url })}
                onUploadStateChange={handleUploadStateChange}
                onPendingStateChange={handlePendingStateChange}
                canStartUpload={() => !operationLockRef.current}
              />
            </div>
            <label className="journal-editor-field journal-editor-field--full">
              <span>Email Intro</span>
              <textarea name="emailIntro" value={form.emailIntro} onChange={handleFieldChange} />
            </label>
            <label className="journal-editor-field journal-editor-field--full">
              <span>產品提示</span>
              <textarea name="relatedProductHint" value={form.relatedProductHint} onChange={handleFieldChange} />
            </label>

            <div className="journal-editor-sections journal-editor-field--full">
              <div className="journal-admin-panel-heading">
                <h3>文章段落</h3>
                <p>每個 Section 可上傳一張圖片，並可填寫圖片說明。</p>
              </div>
              {form.sections.map((section, sectionIndex) => (
                <div className="journal-editor-section" key={section._editorKey}>
                  <div className="journal-editor-section-header">
                    <strong>Section {sectionIndex + 1}</strong>
                    <div>
                      <button type="button" onClick={() => moveSection(sectionIndex, -1)} disabled={isBusy || sectionIndex === 0}>上移</button>
                      <button type="button" onClick={() => moveSection(sectionIndex, 1)} disabled={isBusy || sectionIndex === form.sections.length - 1}>下移</button>
                      <button type="button" onClick={() => removeSection(sectionIndex)} disabled={isBusy || form.sections.length <= 1}>刪除</button>
                    </div>
                  </div>
                  <label className="journal-editor-field journal-editor-field--full">
                    <span>小標題</span>
                    <input value={section.heading} onChange={(event) => updateSection(sectionIndex, { heading: event.target.value })} />
                  </label>
                  {(section.body || [""]).map((paragraph, paragraphIndex) => (
                    <label className="journal-editor-field journal-editor-field--full" key={`paragraph-${sectionIndex}-${paragraphIndex}`}>
                      <span>段落 {paragraphIndex + 1}</span>
                      <textarea value={paragraph} onChange={(event) => updateParagraph(sectionIndex, paragraphIndex, event.target.value)} />
                      <button type="button" className="journal-editor-inline-button" onClick={() => removeParagraph(sectionIndex, paragraphIndex)} disabled={isBusy || section.body.length <= 1}>
                        刪除段落
                      </button>
                    </label>
                  ))}
                  <button type="button" className="journal-admin-button journal-admin-button--secondary" disabled={isBusy} onClick={() => addParagraph(sectionIndex)}>
                    新增 paragraph
                  </button>
                  <div className="journal-editor-field journal-editor-field--full">
                    <JournalImageUpload
                      label={`Section ${sectionIndex + 1} 圖片`}
                      value={section.image}
                      alt={section.imageAlt || section.heading || form.title}
                      disabled={isBusy}
                      onChange={(url) => updateSection(sectionIndex, { image: url })}
                      onUploadStateChange={handleUploadStateChange}
                      onPendingStateChange={handlePendingStateChange}
                      canStartUpload={() => !operationLockRef.current}
                      uploadKey={`section-${section._editorKey}`}
                    />
                  </div>
                  <label className="journal-editor-field journal-editor-field--full">
                    <span>圖片說明</span>
                    <input value={section.imageAlt} onChange={(event) => updateSection(sectionIndex, { imageAlt: event.target.value })} />
                  </label>
                </div>
              ))}
              <button type="button" className="journal-admin-button" disabled={isBusy} onClick={addSection}>
                新增 section
              </button>
            </div>

            <button type="submit" className="journal-admin-button journal-admin-button--primary" disabled={isArticleActionBlocked}>
              {operationType === "save" ? "儲存中..." : "儲存"}
            </button>
          </fieldset>
        </form>

        <aside className="journal-admin-panel journal-editor-preview">
          <p className="journal-admin-eyebrow">{form.category || "分類"}</p>
          <div className={`journal-editor-preview-cover tone-${form.coverTone || "lavender"}`}>
            {form.coverImage.trim() ? (
              <img src={form.coverImage.trim()} alt={form.title || "文章封面"} />
            ) : (
              <span>{form.heroLabel || "Hero Label"}</span>
            )}
          </div>
          <div className="journal-editor-preview-meta">
            <span>{form.publishDate || "發布日期"}</span>
            <span>{form.readTime || "閱讀時間"}</span>
          </div>
          <h3>{form.title || "文章標題"}</h3>
          <p>{form.subtitle || "副標題會顯示在這裡。"}</p>
          <div className="journal-editor-preview-tags">
            {previewTags.map((tag) => <span key={tag}>{tag}</span>)}
          </div>
          {form.sections.map((section, sectionIndex) => (
            <section key={`preview-${sectionIndex}`}>
              <h4>{section.heading || `Section ${sectionIndex + 1}`}</h4>
              {section.image.trim() && (
                <img src={section.image.trim()} alt={section.imageAlt || section.heading || form.title} />
              )}
              {(section.body || []).filter(Boolean).map((paragraph, paragraphIndex) => (
                <p key={`preview-${sectionIndex}-${paragraphIndex}`}>{paragraph}</p>
              ))}
            </section>
          ))}
        </aside>
      </div>
    </section>
  );
};

export default JournalEditor;
