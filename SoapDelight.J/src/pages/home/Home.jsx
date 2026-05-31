import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  FaHandHoldingHeart,
  FaLeaf,
  FaMapMarkerAlt,
  FaRegClock,
  FaRegCreditCard,
  FaSeedling,
  FaShippingFast,
} from "react-icons/fa";
import "./Home.scss";
import { getProducts } from "../../redux/features/product/productSlice.jsx";
import ProductItem from "../../components/product/productItem/ProductItem";
import { Spinner } from "../../components/Loader";
import { ProductImage } from "../../utils/productImageFallback.jsx";

const trustPoints = [
  { title: "小批量手作", icon: FaHandHoldingHeart },
  { title: "生活選物", icon: FaLeaf },
  { title: "澳門本地品牌", icon: FaMapMarkerAlt },
  { title: "自用與送禮", icon: FaSeedling },
];

const serviceCards = [
  {
    title: "送貨及自取",
    text: "按訂單安排本地送貨或交收。",
    icon: FaShippingFast,
  },
  {
    title: "澳門本地安排",
    text: "小店親自處理每張訂單細節。",
    icon: FaMapMarkerAlt,
  },
  {
    title: "安全付款",
    text: "付款流程由既有安全 checkout 處理。",
    icon: FaRegCreditCard,
  },
  {
    title: "訂單處理時間",
    text: "手作產品一般需時製作及整理。",
    icon: FaRegClock,
  },
];

const getProductStatus = (product) => product?.productStatus || "active";
const isVisibleProduct = (product) =>
  getProductStatus(product) !== "discontinued" && product?.category !== "Shipping";
const getHomePriority = (product) => {
  const status = getProductStatus(product);
  const quantity = Number(product?.quantity || 0);

  if (status === "active" && quantity > 0) return 0;
  if (status === "active") return 1;
  if (status === "out_of_stock") return 2;
  return 3;
};

const getFeaturedOrder = (product) => {
  const order = Number(product?.featuredOrder || 0);
  return Number.isFinite(order) ? order : 0;
};

const sortHomeProducts = (a, b) => {
  const priorityDifference = getHomePriority(a) - getHomePriority(b);
  if (priorityDifference !== 0) return priorityDifference;
  return new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0);
};

const sortFeaturedProducts = (a, b) => {
  const orderDifference = getFeaturedOrder(a) - getFeaturedOrder(b);
  if (orderDifference !== 0) return orderDifference;
  return sortHomeProducts(a, b);
};

const SectionHeading = ({ eyebrow, title, children }) => (
  <div className="mx-auto mb-8 max-w-3xl text-center">
    {eyebrow && (
      <p className="mb-3 text-xs font-medium uppercase tracking-[0.24em] text-emerald-700">
        {eyebrow}
      </p>
    )}
    <h2 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white md:text-4xl">
      {title}
    </h2>
    {children && (
      <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-zinc-600 dark:text-zinc-300">
        {children}
      </p>
    )}
  </div>
);

const Home = () => {
  const dispatch = useDispatch();
  const { products, isLoading } = useSelector((state) => state.product);

  useEffect(() => {
    dispatch(getProducts());
    window.scrollTo(0, 0);
  }, [dispatch]);

  const visibleProducts = useMemo(
    () =>
      (products || [])
        .filter(isVisibleProduct)
        .slice()
        .sort(sortHomeProducts),
    [products]
  );

  const heroProducts = useMemo(() => {
    const selectedFeaturedProducts = visibleProducts
      .filter((product) => Boolean(product?.isFeatured))
      .sort(sortFeaturedProducts);

    if (selectedFeaturedProducts.length > 0) {
      return selectedFeaturedProducts;
    }

    return visibleProducts.slice(0, Math.min(4, visibleProducts.length));
  }, [visibleProducts]);

  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    setHeroIndex(0);
  }, [heroProducts.length]);

  useEffect(() => {
    if (heroProducts.length <= 1) return undefined;

    const timer = window.setTimeout(() => {
      setHeroIndex((currentIndex) => (currentIndex + 1) % heroProducts.length);
    }, 8000);

    return () => window.clearTimeout(timer);
  }, [heroProducts.length, heroIndex]);

  const heroProduct = heroProducts[heroIndex] || visibleProducts[0];
  const heroSlides = heroProducts.length > 0 ? heroProducts : heroProduct ? [heroProduct] : [];
  const goToHeroProduct = (nextIndex) => {
    if (heroSlides.length <= 1) return;

    setHeroIndex(
      ((nextIndex % heroSlides.length) + heroSlides.length) % heroSlides.length
    );
  };
  const goToPreviousHeroProduct = () => goToHeroProduct(heroIndex - 1);
  const goToNextHeroProduct = () => goToHeroProduct(heroIndex + 1);
  const latestProducts = visibleProducts
    .slice()
    .sort(
      (a, b) =>
        new Date(b?.createdAt || 0).getTime() -
        new Date(a?.createdAt || 0).getTime()
    )
    .slice(0, 9);

  const collectionCards = useMemo(() => {
    const groupedCollections = new Map();

    visibleProducts.forEach((product) => {
      const categoryName =
        typeof product?.category === "string" && product.category.trim()
          ? product.category.trim()
          : "其他選物";

      if (!categoryName || categoryName === "Shipping") return;

      const currentCollection = groupedCollections.get(categoryName);

      if (!currentCollection) {
        groupedCollections.set(categoryName, {
          title: categoryName,
          caption: "系列選物",
          count: 1,
          product,
          to: `/shop?category=${encodeURIComponent(categoryName)}`,
        });
        return;
      }

      currentCollection.count += 1;

      if (sortHomeProducts(product, currentCollection.product) < 0) {
        currentCollection.product = product;
      }
    });

    return Array.from(groupedCollections.values()).sort((a, b) =>
      a.title.localeCompare(b.title, "zh-Hant")
    );
  }, [visibleProducts]);

  const loopingCollectionCards =
    collectionCards.length > 1
      ? [...collectionCards, ...collectionCards]
      : collectionCards;

  return (
    <main className="home-page bg-white text-zinc-950 dark:bg-zinc-950 dark:text-white">
      <section className="relative overflow-hidden bg-[#f7faf6] dark:bg-zinc-950">
        <div className="mx-auto grid min-h-[calc(100vh-3.5rem)] max-w-7xl items-center gap-10 px-5 py-14 sm:px-6 md:grid-cols-[0.9fr_1.1fr] md:py-20 lg:px-8">
          <div className="max-w-xl">
            <p className="mb-5 text-sm font-medium tracking-[0.28em] text-emerald-800">
              澳門手作・生活選物
            </p>
            <h1 className="text-5xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-6xl lg:text-7xl">
              SoapDelight.J
            </h1>
            <p className="mt-6 text-xl leading-8 text-zinc-700 dark:text-zinc-300">
              精選手作護理、香氣、陶瓷與生活禮品。
            </p>
            <p className="mt-3 text-lg leading-8 text-zinc-600 dark:text-zinc-400">
              由日常自用到送禮心意，為生活留一點溫柔。
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/shop"
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-zinc-950 px-7 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
              >
                立即選購
              </Link>
              <Link
                to="/about"
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-zinc-300 px-7 text-sm font-medium text-zinc-900 transition hover:border-zinc-950 dark:border-zinc-700 dark:text-white dark:hover:border-zinc-300"
              >
                品牌故事
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="home-hero-frame mx-auto max-w-[620px] overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              {heroSlides.length > 0 ? (
                <div className="home-hero-carousel" aria-roledescription="carousel">
                  <div
                    className="home-hero-track"
                    style={{ transform: `translateX(-${heroIndex * 100}%)` }}
                  >
                    {heroSlides.map((slideProduct) => (
                      <Link
                        key={slideProduct._id}
                        to={`/product-details/${slideProduct._id}`}
                        className="home-hero-slide block"
                      >
                        <ProductImage
                          product={slideProduct}
                          alt={slideProduct.name}
                          className="aspect-[4/5] w-full object-cover"
                          fallbackClassName="aspect-[4/5]"
                        />
                        <div className="flex items-center justify-between gap-4 border-t border-zinc-100 px-5 py-4 dark:border-zinc-800">
                          <div>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                              精選產品
                            </p>
                            <h2 className="text-lg font-medium text-zinc-950 dark:text-white">
                              {slideProduct.name}
                            </h2>
                          </div>
                          <p className="text-lg font-semibold">${slideProduct.price}</p>
                        </div>
                      </Link>
                    ))}
                  </div>

                  {heroSlides.length > 1 && (
                    <>
                      <button
                        type="button"
                        className="home-hero-arrow home-hero-arrow--left"
                        aria-label="上一件推薦產品"
                        onClick={goToPreviousHeroProduct}
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        className="home-hero-arrow home-hero-arrow--right"
                        aria-label="下一件推薦產品"
                        onClick={goToNextHeroProduct}
                      >
                        ›
                      </button>
                      <div className="home-hero-dots" aria-label="首頁推薦商品輪播">
                        {heroSlides.map((item, index) => (
                          <button
                            type="button"
                            key={`hero-dot-${item._id}`}
                            aria-label={`查看第 ${index + 1} 件推薦產品`}
                            className={`home-hero-dot ${
                              index === heroIndex ? "home-hero-dot--active" : ""
                            }`}
                            onClick={() => goToHeroProduct(index)}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex aspect-[4/5] items-center justify-center p-10 text-center text-zinc-500">
                  {isLoading ? "正在載入商品..." : "商品即將上架"}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-zinc-100 bg-white py-6 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-3 px-5 sm:px-6 md:grid-cols-4 lg:px-8">
          {trustPoints.map(({ title, icon: Icon }) => (
            <div
              key={title}
              className="flex min-h-24 items-center gap-3 rounded-md border border-zinc-100 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <Icon className="h-5 w-5 shrink-0 text-emerald-700" />
              <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                {title}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white px-5 py-16 dark:bg-zinc-950 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="按系列選購" title="從日常護理到生活禮品">
          由護理、香氣、陶瓷到禮品選物，慢慢探索不同手作系列。
        </SectionHeading>

        {collectionCards.length > 0 ? (
          <div className="home-category-carousel mx-auto max-w-7xl">
            <div
              className={`home-category-track ${
                collectionCards.length <= 1 ? "home-category-track--static" : ""
              }`}
            >
              {loopingCollectionCards.map((collection, index) => (
                <Link
                  key={`home-category-${collection.title}-${index}`}
                  to={collection.to}
                  className="home-category-card group relative min-h-[320px] overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  {collection.product && (
                    <ProductImage
                      product={collection.product}
                      alt={collection.title}
                      className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                      fallbackClassName="absolute inset-0 h-full w-full rounded-none"
                    />
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-white via-white/90 to-transparent p-5 pt-20 dark:from-zinc-950 dark:via-zinc-950/90">
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-700">
                      {collection.caption}
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold text-zinc-950 dark:text-white">
                      {collection.title}
                    </h3>
                    <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                      {collection.count} 件選物
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-center text-zinc-500">系列即將整理。</p>
        )}
      </section>

      <section className="bg-[#f6f8f4] px-5 py-16 dark:bg-zinc-900 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="最新選物" title="近期上架">
          探索最新加入的護理、香氣、陶瓷與禮品選物。
        </SectionHeading>

        {isLoading && latestProducts.length === 0 ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : (
          <div className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {latestProducts.map((product) => (
              <ProductItem
                key={`home-product-${product._id}`}
                {...product}
                product={product}
                grid
              />
            ))}
          </div>
        )}

        {!isLoading && latestProducts.length === 0 && (
          <p className="text-center text-zinc-500">商品即將上架。</p>
        )}

        <div className="mt-10 text-center">
          <Link
            to="/shop"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-zinc-300 px-7 text-sm font-medium text-zinc-900 transition hover:border-zinc-950 dark:border-zinc-700 dark:text-white dark:hover:border-zinc-300"
          >
            查看全部商品
          </Link>
        </div>
      </section>

      <section className="bg-white px-5 py-16 dark:bg-zinc-950 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl items-center gap-8 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950 md:grid-cols-[1fr_0.8fr] md:p-10">
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.24em] text-emerald-700">
              品牌故事
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white md:text-4xl">
              手作，不急於大量。
            </h2>
            <p className="mt-5 max-w-3xl text-base leading-8 text-zinc-600 dark:text-zinc-300">
              SoapDelight.J 以小批量手作與生活選物為核心，整理護理、香氣、陶瓷、燈箱及禮品選物；每一件都重視日常使用感、手作溫度與送禮心意。
            </p>
          </div>
          <div className="flex md:justify-end">
            <Link
              to="/about"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-emerald-900 px-7 text-sm font-medium text-white transition hover:bg-emerald-800"
            >
              了解品牌故事
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-[#fbfcfa] px-5 py-16 dark:bg-zinc-950 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="服務資訊" title="購買前的小資訊">
          簡單清晰的安排，讓手作產品安心送到你手上。
        </SectionHeading>

        <div className="mx-auto grid max-w-7xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {serviceCards.map(({ title, text, icon: Icon }) => (
            <div
              key={title}
              className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <Icon className="mb-5 h-5 w-5 text-emerald-700" />
              <h3 className="text-lg font-semibold text-zinc-950 dark:text-white">
                {title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                {text}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
};

export default Home;
