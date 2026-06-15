import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import journalService, { JOURNAL_CATEGORIES } from "../../../services/journalService";
import "./JournalAdmin.scss";

const statusFilters = [
  { label: "全部", value: "all" },
  { label: "草稿", value: "draft" },
  { label: "已發布", value: "published" },
  { label: "已封存", value: "archived" },
];

const statusLabels = {
  draft: "草稿",
  published: "已發布",
  archived: "已封存",
};

const newsletterLabels = {
  not_prepared: "未準備",
  draft_created: "推送草稿",
  sent: "已推送",
};

const formatDate = (date, includeTime = false) => {
  if (!date) return "-";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "-";
  const options = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    ...(includeTime ? { hour: "2-digit", minute: "2-digit" } : { timeZone: "Asia/Macau" }),
  };
  return parsed.toLocaleString("zh-HK", options);
};

const getErrorMessage = (error, fallback) =>
  error.response?.data?.message || error.message || fallback;

const JournalAdmin = () => {
  const [articles, setArticles] = useState([]);
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("全部");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [actionKey, setActionKey] = useState("");
  const [campaignLinks, setCampaignLinks] = useState({});
  const requestIdRef = useRef(0);
  const actionLockRef = useRef(false);

  const loadArticles = async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setIsLoading(true);
    setLoadError("");
    try {
      const data = await journalService.getAdminArticles({
        status: status === "all" ? "" : status,
        category: category === "全部" ? "" : category,
      });
      if (requestIdRef.current === requestId) {
        setArticles(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      if (requestIdRef.current === requestId) {
        const message = getErrorMessage(error, "未能載入生活香氣誌文章");
        toast.error(message);
        setLoadError(message);
        setArticles([]);
      }
    } finally {
      if (requestIdRef.current === requestId) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);

    return () => {
      requestIdRef.current += 1;
    };
  }, []);

  useEffect(() => {
    loadArticles();
  }, [status, category]);

  const filteredArticles = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return articles;

    return articles.filter((article) => {
      const fields = [
        article.title,
        article.slug,
        article.category,
        ...(article.tags || []),
      ];
      return fields.some((field) => String(field || "").toLowerCase().includes(keyword));
    });
  }, [articles, searchTerm]);

  const runExclusiveAction = async (key, task) => {
    if (actionLockRef.current) return null;

    actionLockRef.current = true;
    setActionKey(key);

    try {
      return await task();
    } finally {
      actionLockRef.current = false;
      setActionKey("");
    }
  };

  const runStatusAction = async (article, nextStatus, label) => {
    const key = `${article._id}-${nextStatus}`;
    await runExclusiveAction(key, async () => {
      const confirmed = window.confirm(`${label}「${article.title}」？`);
      if (!confirmed) return null;

      await journalService.updateArticleStatus(article._id, nextStatus);
      toast.success(`${label}完成。`);
      await loadArticles();
    }).catch((error) => {
      if (error) toast.error(getErrorMessage(error, `${label}失敗`));
    });
  };

  const handleDelete = async (article) => {
    const key = `${article._id}-delete`;
    await runExclusiveAction(key, async () => {
      const confirmed = window.confirm(`永久刪除草稿「${article.title}」？此操作無法復原。`);
      if (!confirmed) return null;

      await journalService.deleteArticle(article._id);
      toast.success("文章草稿已刪除。");
      await loadArticles();
    }).catch((error) => {
      if (error) toast.error(getErrorMessage(error, "未能刪除文章"));
    });
  };

  const handleCampaignDraft = async (article) => {
    const key = `${article._id}-campaign`;
    await runExclusiveAction(key, async () => {
      const confirmed = window.confirm(`為「${article.title}」建立推廣電郵草稿？`);
      if (!confirmed) return null;

      const data = await journalService.createCampaignDraft(article._id);
      toast.success("推廣電郵草稿已準備。");
      setCampaignLinks((prev) => ({
        ...prev,
        [article._id]: data?.campaign?._id || article.newsletterCampaignId || true,
      }));
      await loadArticles();
    }).catch((error) => {
      if (error) toast.error(getErrorMessage(error, "未能建立推廣電郵草稿"));
    });
  };

  const isBusy = Boolean(actionKey);

  return (
    <section className="journal-admin-page">
      <header className="journal-admin-header">
        <div>
          <p className="journal-admin-eyebrow">行銷工具</p>
          <h2 className="journal-admin-title">生活香氣誌</h2>
          <p className="journal-admin-subtitle">
            建立、發布及管理生活香氣誌文章與訂閱推送。
          </p>
        </div>
        <Link className="journal-admin-button journal-admin-button--primary" to="/productAdmin/journal/new">
          新增文章
        </Link>
      </header>

      <div className="journal-admin-panel">
        <div className="journal-admin-toolbar">
          <div className="journal-admin-filters" aria-label="文章狀態篩選">
            {statusFilters.map((filter) => (
              <button
                key={filter.value}
                type="button"
                className={`journal-admin-filter ${status === filter.value ? "is-active" : ""}`}
                disabled={isBusy}
                onClick={() => setStatus(filter.value)}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="journal-admin-toolbar-fields">
            <label>
              <span className="sr-only">分類</span>
              <select value={category} onChange={(event) => setCategory(event.target.value)} disabled={isBusy}>
                <option value="全部">全部分類</option>
                {JOURNAL_CATEGORIES.filter((item) => item !== "全部").map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="sr-only">搜尋文章</span>
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="搜尋標題、slug、分類或標籤"
                disabled={isBusy}
              />
            </label>
          </div>
        </div>

        <div className="journal-admin-table-wrap">
          {isLoading ? (
            <p className="journal-admin-empty">正在載入文章...</p>
          ) : loadError ? (
            <div className="journal-admin-empty journal-admin-load-error">
              <h3>未能載入生活香氣誌文章</h3>
              <p>{loadError}</p>
              <button type="button" className="journal-admin-button journal-admin-button--primary" onClick={loadArticles}>
                重新載入
              </button>
            </div>
          ) : filteredArticles.length === 0 ? (
            <p className="journal-admin-empty">此條件下暫未有文章。</p>
          ) : (
            <table className="journal-admin-table">
              <thead>
                <tr>
                  <th>文章</th>
                  <th>分類</th>
                  <th>公開狀態</th>
                  <th>推送狀態</th>
                  <th>發布日期</th>
                  <th>最後更新</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredArticles.map((article) => {
                  const campaignReady = article.newsletterStatus !== "sent" && (article.newsletterCampaignId || campaignLinks[article._id]);
                  const canDelete = article.status === "draft" && !article.firstPublishedAt && !article.newsletterCampaignId;
                  const actionDisabled = isBusy || isLoading;

                  return (
                    <tr key={article._id}>
                      <td>
                        <strong className="journal-admin-article-title">{article.title}</strong>
                        <span className="journal-admin-slug">{article.slug}</span>
                      </td>
                      <td>{article.category || "-"}</td>
                      <td>
                        <span className={`journal-admin-badge is-${article.status || "draft"}`}>
                          {statusLabels[article.status] || article.status || "草稿"}
                        </span>
                      </td>
                      <td>
                        <span className={`journal-admin-badge is-newsletter-${article.newsletterStatus || "not_prepared"}`}>
                          {newsletterLabels[article.newsletterStatus] || "未準備"}
                        </span>
                      </td>
                      <td>{formatDate(article.publishDate)}</td>
                      <td>{formatDate(article.updatedAt, true)}</td>
                      <td>
                        <div className="journal-admin-row-actions">
                          <Link className="journal-admin-mini-button" to={`/productAdmin/journal/${article._id}`}>
                            編輯
                          </Link>

                          {article.status === "published" && (
                            <>
                              <a
                                className="journal-admin-mini-button"
                                href={`/journal/${article.slug}`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                查看公開頁
                              </a>
                              <button
                                type="button"
                                className="journal-admin-mini-button"
                                disabled={actionDisabled}
                                onClick={() => runStatusAction(article, "draft", "取消發布")}
                              >
                                取消發布
                              </button>
                              <button
                                type="button"
                                className="journal-admin-mini-button journal-admin-mini-button--danger"
                                disabled={actionDisabled}
                                onClick={() => runStatusAction(article, "archived", "封存")}
                              >
                                封存
                              </button>
                            </>
                          )}

                          {article.status === "draft" && (
                            <>
                              <button
                                type="button"
                                className="journal-admin-mini-button"
                                disabled={actionDisabled}
                                onClick={() => runStatusAction(article, "published", "發布")}
                              >
                                發布
                              </button>
                              <button
                                type="button"
                                className="journal-admin-mini-button"
                                disabled={actionDisabled}
                                onClick={() => runStatusAction(article, "archived", "封存")}
                              >
                                封存
                              </button>
                              {canDelete && (
                                <button
                                  type="button"
                                  className="journal-admin-mini-button journal-admin-mini-button--danger"
                                  disabled={actionDisabled}
                                  onClick={() => handleDelete(article)}
                                >
                                  刪除
                                </button>
                              )}
                            </>
                          )}

                          {article.status === "archived" && (
                            <button
                              type="button"
                              className="journal-admin-mini-button"
                              disabled={actionDisabled}
                              onClick={() => runStatusAction(article, "draft", "恢復為草稿")}
                            >
                              恢復為草稿
                            </button>
                          )}

                          {article.status !== "archived" && (
                            campaignReady ? (
                              <Link className="journal-admin-mini-button" to="/productAdmin/campaigns">
                                前往推廣電郵
                              </Link>
                            ) : (
                              <button
                                type="button"
                                className="journal-admin-mini-button"
                                disabled={actionDisabled}
                                onClick={() => handleCampaignDraft(article)}
                              >
                                {article.newsletterStatus === "sent" ? "建立另一個推送草稿" : "建立推送草稿"}
                              </button>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </section>
  );
};

export default JournalAdmin;
