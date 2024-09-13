import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import styles from "./ProductItem.module.scss";
import ProductRating from "../productRating/ProductRating";
import { calculateAverageRating, shortenText } from "../../../utils";
import DOMPurify from "dompurify";
import { ADD_TO_CART, saveCartDB, selectCartItems } from "../../../redux/features/cart/cartSlice";


const ProductItem = ({
    product,grid,_id,name,price, image,regularPrice
}) => {
    const dispatch = useDispatch();
    const cartItems = useSelector(selectCartItems);

    const addToCart = (product) => {
      dispatch(ADD_TO_CART(product));
      // dispatch(CALCULATE_TOTAL_QUANTITY());
      dispatch(
        saveCartDB({ cartItems: JSON.parse(localStorage.getItem("cartItems")) })
      );
    };
    const averageRating = calculateAverageRating(product.ratings);

  return (
<div
  className={
    grid
      ? "mb-5 w-full  mx-auto p-4 bg-white dark:bg-gray-800 dark:text-white shadow-md rounded-lg h-[350px] flex flex-col justify-between"
      : `${styles.list} mb-5 dark:bg-gray-800 dark:text-white`
  }
>
  <Link to={`/product-details/${_id}`}>
    <div
      className={`${
        grid
          ? "flex justify-center items-center overflow-hidden mb-2 rounded-md h-48" // 图片容器
          : `${styles.img} flex justify-center mb-2`
      }`}
    >
      <img
        src={image[0]}
        alt={name}
        className={`${
          grid
            ? "object-cover w-full h-full transform transition-transform duration-300 hover:scale-105" // 添加 hover 效果
            : ""
        }`}
      />
    </div>
  </Link>

  <div className={`${styles.content} px-2`}>
    <div className={`${styles.details} mb-2`}>
      <p className="flex items-center justify-center mb-1">
        <span>
          {regularPrice > 0 && (
            <del className="text-red-500 mr-2">${regularPrice}</del>
          )}
        </span>
        <span className="text-lg font-bold">{`$${price}`}</span>
      </p>

      <ProductRating
        averageRating={averageRating}
        noOfRatings={product?.ratings.length}
      />

      <h4 className="text-center text-lg font-semibold">
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
            ? "w-full bg-blue-500 text-white py-2 mt-auto rounded hover:bg-blue-600"
            : "w-full md:w-3/4 text-[1rem] bg-blue-500 text-white py-2 rounded hover:bg-blue-600 mx-auto block"
        }`}
        onClick={() => addToCart(product)}
      >
        Add To Cart
      </button>
    ) : (
      <button
        className={`${
          grid
            ? "w-full bg-red-500 text-white py-2 mt-auto rounded hover:bg-red-600"
            : "w-full md:w-3/4 text-[1rem] bg-red-500 text-white py-2 rounded hover:bg-red-600 mx-auto block"
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
