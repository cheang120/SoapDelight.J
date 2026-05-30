import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import styles from "./ProductItem.module.scss";
import ProductRating from "../productRating/ProductRating";
import { calculateAverageRating, shortenText } from "../../../utils";
import DOMPurify from "dompurify";
import { ADD_TO_CART, saveCartDB } from "../../../redux/features/cart/cartSlice";
import { toast } from "react-toastify";
import { ProductImage } from "../../../utils/productImageFallback";

const getProductStatus = (product) => product?.productStatus || "active";

const getProductStatusMeta = (product) => {
  const status = getProductStatus(product);
  const quantity = Number(product?.quantity || 0);

  if (status === "out_of_stock") {
    return {
      tone: "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
      label: "暫時缺貨・可查詢",
      actionLabel: "暫時缺貨・可查詢",
      purchasable: false,
      reason: "此商品暫時缺貨，可透過聯絡我們查詢。",
    };
  }

  if (status === "discontinued") {
    return {
      tone: "bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300",
      label: "已下架",
      actionLabel: "已下架",
      purchasable: false,
      reason: "此商品已下架或停產。",
    };
  }

  if (quantity <= 0) {
    return {
      tone: "bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300",
      label: "暫時缺貨",
      actionLabel: "暫時缺貨",
      purchasable: false,
      reason: "此商品暫時缺貨，可透過聯絡我們查詢。",
    };
  }

  return {
    tone: "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200",
    label: "可加入購物車",
    actionLabel: "加入購物車",
    purchasable: true,
    reason: "",
  };
};

const ProductItem = ({
  product,
  grid,
  _id,
  name,
  price,
  regularPrice,
}) => {
  const dispatch = useDispatch();
  const { currentUser } = useSelector((state) => state.user);

  const addToCart = (item) => {
    dispatch(ADD_TO_CART(item));
    if (currentUser) {
      dispatch(
        saveCartDB({ cartItems: JSON.parse(localStorage.getItem("cartItems")) })
      );
    }
  };

  const averageRating = calculateAverageRating(product?.ratings || []);
  const hasDiscount = Number(regularPrice) > Number(price);
  const isGrid = grid;
  const statusMeta = getProductStatusMeta(product);
  const isPurchasable = statusMeta.purchasable;

  return (
    <div
      className={
        isGrid
          ? "group mx-auto flex h-full min-h-[320px] flex-col overflow-hidden rounded-[1.35rem] border border-zinc-200 bg-white transition hover:-translate-y-0.5 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
          : `${styles.list} overflow-hidden rounded-[1.35rem] border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 dark:text-white`
      }
    >
      <Link to={`/product-details/${_id}`}>
        <div
          className={`${
            isGrid
              ? "aspect-[4/4.2] overflow-hidden bg-[#f7f8f4] dark:bg-zinc-900"
              : `${styles.img} flex justify-center bg-[#f7f8f4] dark:bg-zinc-900`
          }`}
        >
          <ProductImage
            product={product}
            alt={name}
            className={`${
              isGrid
                ? "h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                : "h-full w-full object-cover"
            }`}
          />
        </div>
      </Link>

      <div
        className={`${styles.content} flex flex-1 flex-col ${
          isGrid ? "px-4 pb-4 pt-4" : "px-4 py-4"
        }`}
      >
        <div className={`${styles.details} mb-3`}>
          <div className="mb-2 flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
            <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium dark:bg-zinc-900">
              {product?.category || "商品"}
            </span>
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusMeta.tone}`}>
              {statusMeta.label}
            </span>
          </div>

          <h4
            className={`text-zinc-950 dark:text-white ${
              isGrid
                ? "min-h-[3rem] text-[15px] font-medium leading-6"
                : "text-lg font-semibold leading-7"
            }`}
          >
            {shortenText(name, isGrid ? 30 : 60)}
          </h4>

          <div className="mt-3">
            <ProductRating
              averageRating={averageRating}
              noOfRatings={product?.ratings?.length || 0}
            />
          </div>

          <p
            className={`mt-3 flex items-center gap-2 ${
              isGrid ? "justify-start" : "justify-start"
            }`}
          >
            {hasDiscount && (
              <del className="text-sm text-zinc-400">${regularPrice}</del>
            )}
            <span className="text-base font-semibold text-zinc-950 dark:text-white">{`$${price}`}</span>
          </p>
        </div>

        {!isGrid && (
          <div
            className="mb-4 text-sm leading-7 text-gray-600 dark:text-gray-300"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(shortenText(product?.description, 60)),
            }}
          />
        )}

        {!isPurchasable ? (
          <button
            className={`${
              isGrid
                ? "mt-auto w-full rounded-full bg-zinc-200 py-3 text-sm font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-300"
                : "mt-auto block w-full rounded-full bg-zinc-200 py-3 text-sm font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-300 md:w-56"
            }`}
            onClick={() => toast.info(statusMeta.reason)}
          >
            {statusMeta.actionLabel}
          </button>
        ) : (
          <button
            className={`${
              isGrid
                ? "mt-auto w-full rounded-full bg-zinc-950 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
                : "mt-auto block w-full rounded-full bg-zinc-950 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 md:w-56"
            }`}
            onClick={() => addToCart(product)}
          >
            {statusMeta.actionLabel}
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductItem;
