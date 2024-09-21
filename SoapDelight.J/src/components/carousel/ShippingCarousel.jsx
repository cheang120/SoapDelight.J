import React from "react";
import "./Carousel.scss";
import { 
  getCartQuantityById,
  shortenText 
} from "../../utils";
import DOMPurify from "dompurify";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";

import { Link } from "react-router-dom";
import { ADD_TO_CART, CALCULATE_TOTAL_QUANTITY, saveCartDB, selectCartItems } from "../../redux/features/cart/cartSlice";
import { CgAdd } from "react-icons/cg";

function removeHTMLTags(input) {
  const regex = /<[^>]+>/g;
  return input.replace(regex, "");
}

const ShippingCarouselItem = ({
  url,
  name,
  regularPrice,
  price,
  description,
  product,
}) => {
  const cartItems = useSelector(selectCartItems);
  const dispatch = useDispatch();

  const addToCart = (product) => {
    const cartQuantity = getCartQuantityById(cartItems, product._id);
    if (cartQuantity === product.quantity) {
      return toast.info("Max number of product reached!!!");
    }
    dispatch(ADD_TO_CART(product));
    dispatch(CALCULATE_TOTAL_QUANTITY());
    dispatch(
      saveCartDB({ cartItems: JSON.parse(localStorage.getItem("cartItems")) })
    );
  };

  const desc = removeHTMLTags(description);

  return (
    <div className="p-1  bg-white dark:bg-gray-800 mx-2">
      <Link 
        // to={`/product-details/${product._id}`}
        className="flex "
      >
        <div className="flex flex-col w-full">
          {/* Removed extra content to focus on flex layout below */}
        </div>
      </Link>

      {/* 横向排列价格、商品名和按钮 */}
      <div className="flex justify-between items-center">

        {/* 商品名称 */}
        <h4 className="font-semibold text-lg dark:text-white">
          {shortenText(name, 18)}
        </h4>

        {/* 价格 */}
        <p className="text-gray-700 dark:text-gray-300 text-lg">
          {`$${price}`}
        </p>

        {/* 按钮 */}
        <button
          className="bg-pink-500 text-white py-1 px-1 rounded-full hover:bg-pink-600 
                     transition duration-300 ease-in-out focus:outline-none focus:ring-2 
                     focus:ring-offset-2 focus:ring-pink-400 transform active:scale-95"
          onClick={() => addToCart(product)}
        >
          {/* &#x25CF; */}
          <CgAdd />
        </button>
      </div>
    </div>
  );
};

export default ShippingCarouselItem;
