import { Fragment, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import journalService from "../../services/journalService";
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

function JournalMediaRow({ images = [], mediaKey }) {
  const visibleImages = images.filter((image) => {
    const shouldShowPlaceholder = image?.showPlaceholder === true;
    const imageSrc = shouldShowPlaceholder ? "" : image?.src?.trim();
    return imageSrc || shouldShowPlaceholder;
  });

  if (visibleImages.length === 0) return null;

  return (
    <div className={visibleImages.length === 1 ? "journal-media-row single" : "journal-media-row"}>
      {visibleImages.map((image, index) => {
        const shouldShowPlaceholder = image?.showPlaceholder === true;
        const imageSrc = shouldShowPlaceholder ? "" : image.src?.trim();

        return (
          <figure className="journal-media-card" key={mediaKey + "-" + index}>
            <div className="journal-media-frame">
              {imageSrc ? (
                <img src={imageSrc} alt={image.alt || image.caption || ""} loading="lazy" />
              ) : (
                <div className="journal-media-placeholder">
                  <span>{image.placeholderLabel || "圖片位置"}</span>
                </div>
              )}
            </div>
            {image.caption && <figcaption>{image.caption}</figcaption>}
          </figure>
        );
      })}
    </div>
  );
}

const getLocalCoverImage = (article) => {
  const cover = journalMediaBySlug[article.slug]?.cover;
  if (typeof cover === "string") {
    return { src: cover, alt: article.title };
  }
  if (cover?.showPlaceholder === true) {
    return null;
  }
  if (cover?.src) {
    return { src: cover.src, alt: cover.alt || article.title };
  }
  return null;
};

export default function JournalArticle() {
  const { slug } = useParams();
  const [article, setArticle] = useState(null);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isNotFound, setIsNotFound] = useState(false);
  const requestIdRef = useRef(0);

  const loadArticle = async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setIsLoading(true);
    setError("");
    setIsNotFound(false);
    setArticle(null);
    setRelatedArticles([]);

    try {
      const currentArticle = await journalService.getPublishedArticle(slug);
      if (requestIdRef.current !== requestId) return;

      setArticle(currentArticle);
      setIsLoading(false);

      try {
        const related = await journalService.getPublishedArticles({
          category: currentArticle.category,
        });
        if (requestIdRef.current === requestId) {
          setRelatedArticles(
            (Array.isArray(related) ? related : [])
              .filter((item) => item.slug !== currentArticle.slug)
              .slice(0, 2)
          );
        }
      } catch {
        if (requestIdRef.current === requestId) {
          setRelatedArticles([]);
        }
      }
    } catch (loadError) {
      if (requestIdRef.current !== requestId) return;

      if (loadError.response?.status === 404) {
        setIsNotFound(true);
      } else {
        setError(loadError.response?.data?.message || "暫時未能載入文章，請稍後再試。");
      }
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadArticle();

    return () => {
      requestIdRef.current += 1;
    };
  }, [slug]);

  if (isLoading) {
    return (
      <main className="journal-page">
        <section className="journal-not-found">
          <p className="journal-eyebrow">Loading</p>
          <h1>正在載入文章</h1>
          <p>請稍候，我們正在整理這篇生活香氣誌。</p>
        </section>
      </main>
    );
  }

  if (isNotFound) {
    return (
      <main className="journal-page">
        <section className="journal-not-found">
          <p className="journal-eyebrow">Article Not Found</p>
          <h1>找不到這篇文章</h1>
          <p>這篇生活香氣誌文章可能已移除或路徑有誤。</p>
          <Link to="/journal">返回生活香氣誌</Link>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="journal-page">
        <section className="journal-not-found">
          <p className="journal-eyebrow">Loading Error</p>
          <h1>暫時未能載入文章</h1>
          <p>{error}</p>
          <button type="button" className="journal-retry-button" onClick={loadArticle}>
            重新載入
          </button>
          <Link to="/journal">返回生活香氣誌</Link>
        </section>
      </main>
    );
  }

  const articleMedia = journalMediaBySlug[article.slug] || {};
  const coverImage = article.coverImage
    ? { src: article.coverImage, alt: article.title }
    : getLocalCoverImage(article);
  const tags = article.tags || [];
  const sections = article.sections || [];

  return (
    <main className="journal-page journal-detail-page">
      <nav className="journal-breadcrumb" aria-label="breadcrumb">
        <Link to="/">首頁</Link>
        <span>/</span>
        <Link to="/journal">生活香氣誌</Link>
        <span>/</span>
        <span>{article.title}</span>
      </nav>

      <article className="journal-article">
        <header className={"journal-article-hero tone-" + (article.coverTone || "lavender")}>
          <div>
            <p className="journal-eyebrow">{article.category}</p>
            <h1>{article.title}</h1>
            <p>{article.subtitle}</p>

            <div className="journal-article-meta">
              <span>{formatDate(article.publishDate)}</span>
              <span>{article.readTime}</span>
              {tags.map((tag) => (
                <span key={`${article.slug}-${tag}`}>{tag}</span>
              ))}
            </div>
          </div>

          <div className="journal-article-mark">
            {coverImage?.src ? (
              <img src={coverImage.src} alt={coverImage.alt || article.title} loading="lazy" />
            ) : (
              <span>{article.heroLabel}</span>
            )}
          </div>
        </header>

        <div className="journal-article-content">
          {sections.map((section, sectionIndex) => {
            const sectionMedia = articleMedia.sections?.[sectionIndex]?.afterParagraph || {};
            const sectionDbImage = section.image?.trim()
              ? [{
                  src: section.image.trim(),
                  alt: section.imageAlt || article.title,
                  caption: section.imageAlt || "",
                }]
              : null;

            return (
              <section key={`${article.slug}-section-${sectionIndex}`}>
                <h2>{section.heading}</h2>
                {sectionDbImage && (
                  <JournalMediaRow
                    images={sectionDbImage}
                    mediaKey={`${article.slug}-${sectionIndex}-db`}
                  />
                )}
                {(section.body || []).map((paragraph, paragraphIndex) => (
                  <Fragment key={`${article.slug}-${sectionIndex}-${paragraphIndex}`}>
                    <p>{paragraph}</p>
                    {!sectionDbImage && (
                      <JournalMediaRow
                        images={sectionMedia[paragraphIndex]}
                        mediaKey={article.slug + "-" + sectionIndex + "-" + paragraphIndex}
                      />
                    )}
                  </Fragment>
                ))}
              </section>
            );
          })}

          <aside className="journal-disclaimer">
            <strong>溫馨提示</strong>
            <p>
              以上內容只作一般生活及產品使用參考，不屬醫療建議。如有特殊健康狀況、
              孕婦、兒童或敏感肌膚人士，使用前應先諮詢專業意見或作局部測試。
            </p>
          </aside>

          {article.relatedProductHint && (
            <aside className="journal-product-hint">
              <p>{article.relatedProductHint}</p>
              <Link to="/shop">查看 SoapDelight.J 選物</Link>
            </aside>
          )}
        </div>
      </article>

      {relatedArticles.length > 0 && (
        <section className="journal-related">
          <h2>相關文章</h2>
          <div>
            {relatedArticles.map((item) => (
              <Link key={item.slug} to={"/journal/" + item.slug}>
                <span>{item.category}</span>
                <strong>{item.title}</strong>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="journal-back-link">
        <Link to="/journal">返回生活香氣誌</Link>
      </div>
    </main>
  );
}
