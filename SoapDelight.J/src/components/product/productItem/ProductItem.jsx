import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import styles from "./ProductItem.module.scss";
import ProductRating from "../productRating/ProductRating";
import { calculateAverageRating, shortenText } from "../../../utils";
import DOMPurify from "dompurify";
import { ADD_TO_CART, saveCartDB, selectCartItems } from "../../../redux/features/cart/cartSlice";
import { toast } from "react-toastify";


const ProductItem = ({
    product,grid,_id,name,price, image,regularPrice
}) => {
    const dispatch = useDispatch();
    const cartItems = useSelector(selectCartItems);
    const { currentUser } = useSelector((state) => state.user);

    const addToCart = (product) => {
      dispatch(ADD_TO_CART(product));
      if (currentUser) {
        dispatch(
          saveCartDB({ cartItems: JSON.parse(localStorage.getItem("cartItems")) })
        );
      }
    };
    const averageRating = calculateAverageRating(product?.ratings || []);
    const hasDiscount = Number(regularPrice) > Number(price);

  return (
    <div
      className={
        grid
          ? "group mb-5 mx-auto flex h-full min-h-[360px] flex-col rounded-md border border-zinc-200 bg-white p-3 transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
          : `${styles.list} mb-5 border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 dark:text-white`
      }
    >
      <Link to={`/product-details/${_id}`}>
        <div
          className={`${
            grid
              ? "mb-4 flex aspect-square items-center justify-center overflow-hidden rounded-md bg-zinc-50 dark:bg-zinc-900"
              : `${styles.img} flex justify-center mb-2`
          }`}
        >
          <img
            src={image?.[0]}
            alt={name}
            className={`${
              grid
                ? "h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                : ""
            }`}
          />
        </div>
      </Link>

      <div className={`${styles.content} flex flex-1 flex-col px-1`}>
        <div className={`${styles.details} mb-2`}>
          <p className="mb-2 flex items-center justify-center gap-2">
            {hasDiscount && (
              <del className="text-sm text-zinc-400">${regularPrice}</del>
            )}
            <span className="text-base font-semibold text-zinc-950 dark:text-white">{`$${price}`}</span>
          </p>

          <ProductRating
            averageRating={averageRating}
            noOfRatings={product?.ratings?.length || 0}
          />

          <h4 className="mt-2 text-center text-base font-medium leading-6 text-zinc-950 dark:text-white">
            {shortenText(name, 18)}
          </h4>
        </div>

        {!grid && (
          <div
            className="text-sm text-gray-600 dark:text-gray-300 mb-2"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(shortenText(product?.description, 60)),
            }}
          ></div>
        )}

        {product?.quantity > 0 ? (
          <button
            className={`${
              grid
                ? "mt-auto w-full rounded-md bg-zinc-950 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
                : "mx-auto block w-full rounded-md bg-zinc-950 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 md:w-3/4"
            }`}
            onClick={() => addToCart(product)}
          >
            加入購物車
          </button>
        ) : (
          <button
            className={`${
              grid
                ? "mt-auto w-full rounded-md bg-zinc-200 py-2.5 text-sm font-medium text-zinc-500"
                : "mx-auto block w-full rounded-md bg-zinc-200 py-2.5 text-sm font-medium text-zinc-500 md:w-3/4"
            }`}
            onClick={() => toast.error("Sorry, Product is out of stock")}
          >
            Out Of Stock
          </button>
        )}
      </div>
    </div>
  )
}

export default ProductItem
