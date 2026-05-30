import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import DOMPurify from "dompurify";
import { toast } from "react-toastify";
import StarRating from "react-star-ratings";
import {
  FaCheckCircle,
  FaHeart,
  FaMinus,
  FaPlus,
  FaShoppingBag,
} from "react-icons/fa";
import styles from "./ProductDetails.module.scss";
import { getProduct } from "../../../redux/features/product/productSlice";
import { Spinner } from "../../Loader";
import ProductRating from "../productRating/ProductRating.jsx";
import { calculateAverageRating } from "../../../utils/index.jsx";
import {
  ADD_TO_CART,
  DECREASE_CART,
  saveCartDB,
  selectCartItems,
} from "../../../redux/features/cart/cartSlice.jsx";
import { addToWishlist, getWishlist } from "../../../redux/features/auth/authSlice.js";
import ProductRatingSummary from "../productRating/productRatingSummary.jsx";
import ProductImageFallback, {
  getProductImages,
} from "../../../utils/productImageFallback.jsx";

const stockCopy = (productStatus, quantity) => {
  if (productStatus === "discontinued") {
    return {
      label: "此商品已下架或停產",
      helper: "如需瀏覽現有商品，請返回選購頁面。",
      tone: "text-zinc-500 bg-zinc-100 border-zinc-200 dark:text-zinc-300 dark:bg-zinc-900 dark:border-zinc-700",
    };
  }
  if (productStatus === "out_of_stock") {
    return {
      label: "暫時缺貨・可查詢",
      helper: "如想查詢補貨或寄賣點供應，可透過聯絡我們查詢。",
      tone: "text-amber-800 bg-amber-50 border-amber-200 dark:text-amber-200 dark:bg-amber-950/40 dark:border-amber-800",
    };
  }
  if (quantity <= 0) {
    return {
      label: "暫時缺貨",
      helper: "此商品暫時未能加入購物車。",
      tone: "text-zinc-500 bg-zinc-100 border-zinc-200 dark:text-zinc-300 dark:bg-zinc-900 dark:border-zinc-700",
    };
  }
  if (quantity <= 3) {
    return {
      label: "少量現貨",
      helper: "庫存有限，建議儘早下單。",
      tone: "text-amber-800 bg-amber-50 border-amber-200 dark:text-amber-200 dark:bg-amber-950/40 dark:border-amber-800",
    };
  }
  return {
    label: "有現貨",
    helper: "可正常加入購物車。",
    tone: "text-emerald-800 bg-emerald-50 border-emerald-200 dark:text-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800",
  };
};

const InfoPanel = ({ title, subtitle, children, defaultOpen = false }) => (
  <details
    className="group rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
    open={defaultOpen}
  >
    <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
      <span>
        <span className="block text-lg font-semibold text-zinc-950 dark:text-white">
          {title}
        </span>
        {subtitle && (
          <span className="mt-1 block text-sm text-zinc-500 dark:text-zinc-400">
            {subtitle}
          </span>
        )}
      </span>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 transition group-open:rotate-45 dark:border-zinc-800">
        <FaPlus size={12} />
      </span>
    </summary>
    <div className="mt-5 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
      {children}
    </div>
  </details>
);

const ProductDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const cartItems = useSelector(selectCartItems);
  const { currentUser } = useSelector((state) => state.user);
  const { product, isLoading } = useSelector((state) => state.product);
  const [imageIndex, setImageIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState({});

  useEffect(() => {
    dispatch(getProduct(id));
    window.scrollTo(0, 0);
  }, [dispatch, id]);

  useEffect(() => {
    setImageIndex(0);
    setImageErrors({});
  }, [id, product?.image]);

  const productImages = useMemo(() => {
    return getProductImages(product).filter((image) => !imageErrors[image]);
  }, [imageErrors, product?.image]);

  const selectedImage = productImages[imageIndex] || productImages[0];
  const ratings = product?.ratings || [];
  const averageRating = calculateAverageRating(ratings);
  const stockQuantity = Number(product?.quantity || 0);
  const productStatus = product?.productStatus || "active";
  const stock = stockCopy(productStatus, stockQuantity);
  const cart = cartItems.find((item) => item._id === id);
  const cartQuantity = cart?.cartQuantity || 1;
  const hasDiscount = Number(product?.regularPrice) > Number(product?.price);
  const sanitizedDescription = DOMPurify.sanitize(product?.description || "");
  const canPurchase =
    productStatus !== "discontinued" &&
    productStatus !== "out_of_stock" &&
    stockQuantity > 0;

  const syncCartIfLoggedIn = () => {
    if (currentUser) {
      dispatch(
        saveCartDB({ cartItems: JSON.parse(localStorage.getItem("cartItems")) })
      );
    }
  };

  const addToCart = () => {
    if (!product || !canPurchase) {
      toast.info(stock.helper);
      return;
    }
    dispatch(ADD_TO_CART(product));
    syncCartIfLoggedIn();
  };

  const decreaseCart = () => {
    if (!product || !cart) return;
    dispatch(DECREASE_CART(product));
    syncCartIfLoggedIn();
  };

  const addWishlist = async () => {
    if (!product) return;
    if (!currentUser) {
      toast.info("請先登入才能加入收藏");
      return;
    }

    const result = await dispatch(addToWishlist({ productId: product._id }));
    if (addToWishlist.fulfilled.match(result)) {
      dispatch(getWishlist());
    }
  };

  const handleImageError = (image) => {
    setImageErrors((current) => ({ ...current, [image]: true }));
  };

  if (isLoading && !product) {
    return (
      <section className="min-h-[60rem] px-5 py-20">
        <Spinner />
      </section>
    );
  }

  if (!isLoading && !product) {
    return (
      <section className="min-h-[60rem] px-5 py-20">
        <div className="mx-auto max-w-3xl rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-950">
          <h1 className="text-2xl font-semibold text-zinc-950 dark:text-white">
            找不到商品
          </h1>
          <p className="mt-3 text-zinc-600 dark:text-zinc-300">
            此商品可能已下架或暫時未能提供。
          </p>
          <Link
            to="/shop"
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-zinc-950 px-6 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950"
          >
            繼續選購
          </Link>
        </div>
      </section>
    );
  }

  return (
    <main className={`${styles.productPage} bg-white dark:bg-zinc-950`}>
      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-6 md:py-12 lg:px-8">
        <Link
          to="/shop"
          className="inline-flex text-sm font-medium text-zinc-500 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
        >
          &larr; 繼續選購
        </Link>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-start lg:gap-14">
          <div>
            <div
              className={`${styles.imageFrame} overflow-hidden rounded-[1.5rem] border border-zinc-100 bg-[#fffdfa] dark:border-zinc-800 dark:bg-zinc-950`}
            >
              {selectedImage ? (
                <img
                  src={selectedImage}
                  alt={product.name}
                  className={`${styles.mainImage} aspect-square w-full object-cover md:aspect-[4/5] lg:aspect-auto lg:object-contain`}
                  onError={() => handleImageError(selectedImage)}
                />
              ) : (
                <ProductImageFallback
                  category={product?.category}
                  className={`${styles.imagePlaceholder} aspect-square md:aspect-[4/5] lg:aspect-auto`}
                />
              )}
            </div>

            {productImages.length > 1 && (
              <div className="mt-4 grid grid-cols-5 gap-3 sm:grid-cols-6">
                {productImages.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setImageIndex(index)}
                    className={`overflow-hidden rounded-md border bg-zinc-50 transition ${
                      selectedImage === image
                        ? "border-zinc-950 dark:border-white"
                        : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-800"
                    }`}
                    aria-label={`查看第 ${index + 1} 張商品圖片`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} thumbnail ${index + 1}`}
                      className="aspect-square w-full object-cover"
                      onError={() => handleImageError(image)}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <aside className="h-fit w-full border-0 lg:sticky lg:top-24 lg:self-start">
            <div
              className={`${styles.infoCard} w-full rounded-[1.5rem] bg-white p-6 md:p-8 dark:bg-zinc-950`}
            >
              <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                {product.category && <span>{product.category}</span>}
                {product.brand && (
                  <>
                    <span aria-hidden="true">/</span>
                    <span>{product.brand}</span>
                  </>
                )}
              </div>

              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-zinc-950 dark:text-white md:text-5xl">
                {product.name}
              </h1>

              <div className="mt-5">
                <ProductRating
                  averageRating={averageRating}
                  noOfRatings={ratings.length}
                />
                {ratings.length === 0 && (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    暫未有評價
                  </p>
                )}
              </div>

              <div className="mt-8 flex items-end gap-3">
                {hasDiscount && (
                  <del className="pb-1 text-lg text-zinc-400">
                    ${product.regularPrice}
                  </del>
                )}
                <p className="text-4xl font-semibold text-zinc-950 dark:text-white">
                  ${product.price}
                </p>
              </div>

              <div
                className={`mt-6 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium ${stock.tone}`}
              >
                <FaCheckCircle size={14} />
                {stock.label}
              </div>
              {stock.helper && (
                <p className="mt-3 text-sm leading-7 text-zinc-500 dark:text-zinc-400">
                  {stock.helper}
                </p>
              )}

              <div className="mt-8 rounded-[1.25rem] border border-zinc-100 bg-[#fcfcfa] p-4 dark:border-zinc-800 dark:bg-zinc-900/70 sm:p-5">
                <p className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-200">
                  數量
                </p>
                <div className="flex w-full flex-col gap-3">
                  <div className="flex min-h-11 w-full items-center overflow-hidden rounded-full border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
                    <button
                      type="button"
                      onClick={decreaseCart}
                      disabled={!cart || cartQuantity <= 1 || !canPurchase}
                      className="flex h-11 w-14 shrink-0 items-center justify-center text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:text-zinc-300 dark:text-zinc-200 dark:hover:bg-zinc-900 sm:w-12"
                      aria-label="減少數量"
                    >
                      <FaMinus size={12} />
                    </button>
                    <span className="flex-1 px-4 text-center text-sm font-medium text-zinc-950 dark:text-white sm:min-w-12 sm:px-0">
                      {cartQuantity}
                    </span>
                    <button
                      type="button"
                      onClick={addToCart}
                      disabled={!canPurchase || cartQuantity >= stockQuantity}
                      className="flex h-11 w-14 shrink-0 items-center justify-center text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:text-zinc-300 dark:text-zinc-200 dark:hover:bg-zinc-900 sm:w-12"
                      aria-label="增加數量"
                    >
                      <FaPlus size={12} />
                    </button>
                  </div>
                  <p className="w-full text-left text-sm text-zinc-500 dark:text-zinc-400">
                    {cart ? "已在購物車" : "加入一次即可開始選購"}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-[1fr_auto]">
                <button
                  type="button"
                  onClick={addToCart}
                  disabled={!canPurchase}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-zinc-950 px-7 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
                >
                  <FaShoppingBag size={15} />
                  {productStatus === "out_of_stock"
                    ? "暫時缺貨・可查詢"
                    : productStatus === "discontinued"
                    ? "此商品已下架"
                    : stockQuantity <= 0
                    ? "暫時缺貨"
                    : "加入購物車"}
                </button>
                <button
                  type="button"
                  onClick={addWishlist}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-zinc-300 px-6 text-sm font-medium text-zinc-900 transition hover:border-zinc-950 dark:border-zinc-700 dark:text-white dark:hover:border-zinc-300"
                >
                  <FaHeart size={14} />
                  加入收藏
                </button>
              </div>

              <div className="mt-8 grid gap-3 border-t border-zinc-100 pt-6 text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                {product.sku && (
                  <p>
                    <span className="font-medium text-zinc-700 dark:text-zinc-200">
                      SKU:
                    </span>{" "}
                    {product.sku}
                  </p>
                )}
                {product.color && (
                  <p>
                    <span className="font-medium text-zinc-700 dark:text-zinc-200">
                      色調:
                    </span>{" "}
                    {product.color}
                  </p>
                )}
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="border-y border-zinc-100 bg-[#f7faf6] px-5 py-14 dark:border-zinc-800 dark:bg-zinc-900 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-2">
          <InfoPanel
            title="商品介紹"
            subtitle="產品說明與質感細節"
            defaultOpen
          >
            {sanitizedDescription ? (
              <div
                className={styles.description}
                dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
              />
            ) : (
              <p>這件產品的詳細介紹正在整理中。</p>
            )}
          </InfoPanel>

          <InfoPanel title="主要特色" subtitle="手作日常護理">
            <ul className="space-y-2">
              <li>小批量製作，重視每件作品的細節。</li>
              <li>適合作為日常護理或溫柔送禮選擇。</li>
              <li>產品質感以天然、簡潔和舒適使用感為方向。</li>
            </ul>
          </InfoPanel>

          <InfoPanel
            title="成分及用法"
            subtitle="以商品說明為準"
          >
            <p>詳細成分及使用方法請參考商品說明。</p>
          </InfoPanel>

          <InfoPanel
            title="保存及注意事項"
            subtitle="天然手作產品的小提醒"
          >
            <p>
              請存放於陰涼乾爽位置，避免陽光直射。每個人的膚況不同，使用前可先作局部測試。
            </p>
          </InfoPanel>

          <InfoPanel
            title="送貨及自取"
            subtitle="澳門本地安排"
          >
            <p>
              訂單會按產品狀態和手作時間安排處理。澳門本地送貨及自取安排以結帳頁和訂單確認為準。
            </p>
          </InfoPanel>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.24em] text-emerald-700">
              評價
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white">
              評價
            </h2>
          </div>
          <Link
            to={`/review-product/${id}`}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-zinc-300 px-6 text-sm font-medium text-zinc-900 transition hover:border-zinc-950 dark:border-zinc-700 dark:text-white dark:hover:border-zinc-300"
          >
            撰寫評價
          </Link>
        </div>

        <div className="rounded-[1.5rem] border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950 md:p-8">
          <ProductRating averageRating={averageRating} noOfRatings={ratings.length} />

          {ratings.length > 0 ? (
            <div className="mt-8 grid gap-8 lg:grid-cols-[340px_1fr]">
              <div className={styles.ratingSummary}>
                <ProductRatingSummary ratings={ratings} />
              </div>
              <div className="space-y-4">
                {ratings.map((item, index) => {
                  const { star, review, reviewDate, name, userID } = item;
                  return (
                    <article
                      key={`${userID || name || "review"}-${reviewDate || index}`}
                      className="rounded-lg border border-zinc-100 p-5 dark:border-zinc-800"
                    >
                      <StarRating
                        starDimension="18px"
                        starSpacing="2px"
                        starRatedColor="#F6B01E"
                        rating={star}
                        editing={false}
                      />
                      <p className="mt-4 text-sm leading-7 text-zinc-700 dark:text-zinc-300">
                        {review}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                        {reviewDate && <span>{reviewDate}</span>}
                        {name && <span>由 {name} 撰寫</span>}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="mt-8 rounded-lg bg-zinc-50 p-8 text-center dark:bg-zinc-900">
              <p className="text-zinc-600 dark:text-zinc-300">
                此商品暫未有評價。
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
};

export default ProductDetails;
