import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { journalArticles, journalCategories } from "../../data/journalArticles";
import "./Journal.scss";

const formatDate = (dateString) =>
  new Intl.DateTimeFormat("zh-HK", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(dateString));

export default function Journal() {
  const [selectedCategory, setSelectedCategory] = useState("全部");

  const filteredArticles = useMemo(() => {
    if (selectedCategory === "全部") return journalArticles;
    return journalArticles.filter((article) => article.category === selectedCategory);
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
          {journalCategories.map((category) => (
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
        {filteredArticles.map((article) => (
          <article key={article.slug} className={"journal-card tone-" + article.coverTone}>
            <div className="journal-card-visual">
              <span>{article.heroLabel}</span>
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
                {article.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>

              <Link to={"/journal/" + article.slug} className="journal-read-link">
                閱讀文章
              </Link>
            </div>
          </article>
        ))}
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
