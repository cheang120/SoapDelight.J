import { Link, useParams } from "react-router-dom";
import { getJournalArticleBySlug, journalArticles } from "../../data/journalArticles";
import "./Journal.scss";

const formatDate = (dateString) =>
  new Intl.DateTimeFormat("zh-HK", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(dateString));

export default function JournalArticle() {
  const { slug } = useParams();
  const article = getJournalArticleBySlug(slug);

  if (!article) {
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

  const relatedArticles = journalArticles
    .filter((item) => item.slug !== article.slug && item.category === article.category)
    .slice(0, 2);

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
        <header className={"journal-article-hero tone-" + article.coverTone}>
          <div>
            <p className="journal-eyebrow">{article.category}</p>
            <h1>{article.title}</h1>
            <p>{article.subtitle}</p>

            <div className="journal-article-meta">
              <span>{formatDate(article.publishDate)}</span>
              <span>{article.readTime}</span>
              {article.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          </div>

          <div className="journal-article-mark">
            <span>{article.heroLabel}</span>
          </div>
        </header>

        <div className="journal-article-content">
          {article.sections.map((section) => (
            <section key={section.heading}>
              <h2>{section.heading}</h2>
              {section.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </section>
          ))}

          <aside className="journal-disclaimer">
            <strong>溫馨提示</strong>
            <p>
              以上內容只作一般生活及產品使用參考，不屬醫療建議。如有特殊健康狀況、
              孕婦、兒童或敏感肌膚人士，使用前應先諮詢專業意見或作局部測試。
            </p>
          </aside>

          <aside className="journal-product-hint">
            <p>{article.relatedProductHint}</p>
            <Link to="/shop">查看 SoapDelight.J 選物</Link>
          </aside>
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
