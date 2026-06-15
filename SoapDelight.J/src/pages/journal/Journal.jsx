import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import journalService, { JOURNAL_CATEGORIES } from "../../services/journalService";
import { journalMediaBySlug } from "../../data/journalArticleMedia";
import "./Journal.scss";

const formatDate = (dateString) => {
  if (!dateString) return "-";
  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) return "-";
  return new Intl.DateTimeFormat("zh-HK", {
    timeZone: "Asia/Macau",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(parsed);
};

const getLocalCoverImage = (slug) => {
  const cover = journalMediaBySlug[slug]?.cover;
  if (typeof cover === "string") return cover;
  if (cover?.showPlaceholder === true) return "";
  return cover?.src || "";
};

export default function Journal() {
  const [selectedCategory, setSelectedCategory] = useState("全部");
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const requestIdRef = useRef(0);

  const loadArticles = async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setLoading(true);
    setError("");

    try {
      const data = await journalService.getPublishedArticles({
        category: selectedCategory === "全部" ? "" : selectedCategory,
      });

      if (requestIdRef.current === requestId) {
        setArticles(Array.isArray(data) ? data : []);
      }
    } catch (loadError) {
      if (requestIdRef.current === requestId) {
        setArticles([]);
        setError(loadError.response?.data?.message || "暫時未能載入生活香氣誌，請稍後再試。");
      }
    } finally {
      if (requestIdRef.current === requestId) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadArticles();

    return () => {
      requestIdRef.current += 1;
    };
  }, [selectedCategory]);

  return (
    <main className="journal-page">
      <section className="journal-hero">
        <p className="journal-eyebrow">SoapDelight.J Journal</p>
        <h1>生活香氣誌</h1>
        <p>
          關於香氣、護理、手作與生活選物的溫柔筆記。由產品背後的理念，
          到日常使用的小知識，讓每一份選物都不只是物件，而是一段更貼近生活的心意。
        </p>
      </section>

      <section className="journal-category-panel" aria-label="文章分類">
        <div className="journal-category-copy">
          <span>探索分類</span>
          <p>從香氣知識、日常護理到手作理念，慢慢了解每件作品背後的生活想像。</p>
        </div>

        <div className="journal-category-chips">
          {JOURNAL_CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              className={selectedCategory === category ? "is-active" : ""}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      <section className="journal-grid" aria-label="生活香氣誌文章">
        {loading ? (
          <div className="journal-state journal-state--wide">正在載入生活香氣誌...</div>
        ) : error ? (
          <div className="journal-state journal-state--wide">
            <p>{error}</p>
            <button type="button" onClick={loadArticles}>重新載入</button>
          </div>
        ) : articles.length === 0 ? (
          <div className="journal-state journal-state--wide">
            <p>暫時未有這個分類的文章。</p>
          </div>
        ) : articles.map((article) => {
          const coverImage = article.coverImage || getLocalCoverImage(article.slug);
          const tags = article.tags || [];

          return (
            <article key={article.slug} className={"journal-card tone-" + (article.coverTone || "lavender")}>
              <div className="journal-card-visual">
                {coverImage ? (
                  <img src={coverImage} alt={article.title || "生活香氣誌文章封面"} loading="lazy" />
                ) : (
                  <span>{article.heroLabel}</span>
                )}
              </div>

              <div className="journal-card-body">
                <div className="journal-card-meta">
                  <span>{article.category}</span>
                  <span>{formatDate(article.publishDate)}</span>
                  <span>{article.readTime}</span>
                </div>

                <h2>{article.title}</h2>
                <p>{article.excerpt}</p>

                <div className="journal-tags">
                  {tags.map((tag) => (
                    <span key={`${article.slug}-${tag}`}>{tag}</span>
                  ))}
                </div>

                <Link to={"/journal/" + article.slug} className="journal-read-link">
                  閱讀文章
                </Link>
              </div>
            </article>
          );
        })}
      </section>

      <section className="journal-subscribe-callout">
        <div>
          <p className="journal-eyebrow">Newsletter Preview</p>
          <h2>讓香氣知識與手作故事，慢慢送到你身邊</h2>
          <p>
            將來我們會把生活香氣誌的文章、新品靈感和品牌手記，整理成電郵分享給已訂閱的客人。
            這裡會成為 SoapDelight.J 內容推送的起點。
          </p>
        </div>
        <Link to="/subscribe">訂閱 SoapDelight.J</Link>
      </section>
    </main>
  );
}
