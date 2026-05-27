import React, { useEffect, useMemo } from "react";
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
  { title: "天然植物基礎", icon: FaLeaf },
  { title: "澳門本地品牌", icon: FaMapMarkerAlt },
  { title: "日常溫柔護理", icon: FaSeedling },
];

const categoryCards = [
  {
    title: "個人護理",
    caption: "Daily skincare essentials",
    terms: ["個人護理", "Personal Care"],
    to: "/shop?category=%E5%80%8B%E4%BA%BA%E8%AD%B7%E7%90%86",
  },
  {
    title: "手作皂",
    caption: "Gentle handmade soap",
    terms: ["手作皂", "Soap"],
    to: "/shop?category=%E6%89%8B%E4%BD%9C%E7%9A%82",
  },
  {
    title: "香薰蠟",
    caption: "Soft aroma for slow evenings",
    terms: ["香薰蠟", "Candle"],
    to: "/shop?category=%E9%A6%99%E8%96%B0%E8%A0%9F",
  },
  {
    title: "精選禮物",
    caption: "Thoughtful small-batch picks",
    terms: [],
    to: "/shop",
  },
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
      (products || []).filter(
        (product) =>
          product?.quantity > 0 &&
          product?.category !== "Shipping"
      ),
    [products]
  );

  const heroProduct = visibleProducts[0];
  const featuredProducts = visibleProducts.slice(0, 8);

  const findCategoryProduct = (terms) => {
    if (!terms.length) return visibleProducts[3] || visibleProducts[0];
    return (
      visibleProducts.find((product) => terms.includes(product.category)) ||
      visibleProducts[0]
    );
  };

  return (
    <main className="home-page bg-white text-zinc-950 dark:bg-zinc-950 dark:text-white">
      <section className="relative overflow-hidden bg-[#f7faf6] dark:bg-zinc-950">
        <div className="mx-auto grid min-h-[calc(100vh-3.5rem)] max-w-7xl items-center gap-10 px-5 py-14 sm:px-6 md:grid-cols-[0.9fr_1.1fr] md:py-20 lg:px-8">
          <div className="max-w-xl">
            <p className="mb-5 text-sm font-medium tracking-[0.28em] text-emerald-800">
              MACAU HANDMADE CARE
            </p>
            <h1 className="text-5xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-6xl lg:text-7xl">
              SoapDelight.J
            </h1>
            <p className="mt-6 text-xl leading-8 text-zinc-700 dark:text-zinc-300">
              Natural handmade skincare, soap and candles.
            </p>
            <p className="mt-3 text-lg leading-8 text-zinc-600 dark:text-zinc-400">
              天然手作，溫柔照顧每日肌膚。
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/shop"
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-zinc-950 px-7 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
              >
                Shop Now
              </Link>
              <Link
                to="/about"
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-zinc-300 px-7 text-sm font-medium text-zinc-900 transition hover:border-zinc-950 dark:border-zinc-700 dark:text-white dark:hover:border-zinc-300"
              >
                Our Story
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="home-hero-frame mx-auto max-w-[620px] overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              {heroProduct ? (
                <Link to={`/product-details/${heroProduct._id}`} className="block">
                  <ProductImage
                    product={heroProduct}
                    alt={heroProduct.name}
                    className="aspect-[4/5] w-full object-cover"
                    fallbackClassName="aspect-[4/5]"
                  />
                  <div className="flex items-center justify-between gap-4 border-t border-zinc-100 px-5 py-4 dark:border-zinc-800">
                    <div>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        Featured
                      </p>
                      <h2 className="text-lg font-medium text-zinc-950 dark:text-white">
                        {heroProduct.name}
                      </h2>
                    </div>
                    <p className="text-lg font-semibold">${heroProduct.price}</p>
                  </div>
                </Link>
              ) : (
                <div className="flex aspect-[4/5] items-center justify-center p-10 text-center text-zinc-500">
                  {isLoading ? "Loading products..." : "Products coming soon"}
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
        <SectionHeading eyebrow="Shop By Mood" title="溫柔日常，由簡單開始">
          從清潔、護理到香氣，為每日生活留一點安靜而自然的時間。
        </SectionHeading>

        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-4">
          {categoryCards.map((category) => {
            const product = findCategoryProduct(category.terms);
            return (
              <Link
                key={category.title}
                to={category.to}
                className="group relative min-h-[320px] overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900"
              >
                {product && (
                  <ProductImage
                    product={product}
                    alt={category.title}
                    className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                    fallbackClassName="absolute inset-0 h-full w-full rounded-none"
                  />
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-white via-white/90 to-transparent p-5 pt-20 dark:from-zinc-950 dark:via-zinc-950/90">
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-700">
                    {category.caption}
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-zinc-950 dark:text-white">
                    {category.title}
                  </h3>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="bg-[#f6f8f4] px-5 py-16 dark:bg-zinc-900 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Featured Products" title="精選產品">
          小批量製作，選用天然植物基礎，適合日常使用與送禮。
        </SectionHeading>

        {isLoading && featuredProducts.length === 0 ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : (
          <div className="mx-auto grid max-w-7xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featuredProducts.map((product) => (
              <ProductItem
                key={`home-product-${product._id}`}
                {...product}
                product={product}
                grid
              />
            ))}
          </div>
        )}

        {!isLoading && featuredProducts.length === 0 && (
          <p className="text-center text-zinc-500">Products coming soon.</p>
        )}

        <div className="mt-10 text-center">
          <Link
            to="/shop"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-zinc-300 px-7 text-sm font-medium text-zinc-900 transition hover:border-zinc-950 dark:border-zinc-700 dark:text-white dark:hover:border-zinc-300"
          >
            View All Products
          </Link>
        </div>
      </section>

      <section className="bg-white px-5 py-16 dark:bg-zinc-950 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl items-center gap-8 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950 md:grid-cols-[1fr_0.8fr] md:p-10">
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.24em] text-emerald-700">
              Brand Story
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white md:text-4xl">
              手作，不急於大量。
            </h2>
            <p className="mt-5 max-w-3xl text-base leading-8 text-zinc-600 dark:text-zinc-300">
              SoapDelight.J 以小批量手作方式製作護膚品、手工皂及香薰蠟，重視天然成分、日常使用感和每一件作品的細節。
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
        <SectionHeading eyebrow="Service Notes" title="購買前的小資訊">
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
