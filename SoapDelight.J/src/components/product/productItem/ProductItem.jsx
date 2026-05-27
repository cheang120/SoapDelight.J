import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import styles from "./ProductItem.module.scss";
import ProductRating from "../productRating/ProductRating";
import { calculateAverageRating, shortenText } from "../../../utils";
import DOMPurify from "dompurify";
import { ADD_TO_CART, saveCartDB } from "../../../redux/features/cart/cartSlice";
import { toast } from "react-toastify";
import { ProductImage } from "../../../utils/productImageFallback";

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
  const isOutOfStock = product?.quantity <= 0;

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

        {isOutOfStock ? (
          <button
            className={`${
              isGrid
                ? "mt-auto w-full rounded-full bg-zinc-200 py-3 text-sm font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-300"
                : "mt-auto block w-full rounded-full bg-zinc-200 py-3 text-sm font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-300 md:w-56"
            }`}
            onClick={() => toast.error("抱歉，商品暫時缺貨")}
          >
            暫時缺貨
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
            加入購物車
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductItem;
