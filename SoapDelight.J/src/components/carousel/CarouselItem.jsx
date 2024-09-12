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

function removeHTMLTags(input) {
  const regex = /<[^>]+>/g;
  return input.replace(regex, "");
}

const CarouselItem = ({
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
    <div className=" p-4 shadow-lg rounded-lg bg-white mx-2 mb-10">
      <Link 
        to={`/product-details/${product._id}`}
        className="flex min-h-[24rem] max-h-[24rem]"
      >
        <div className="flex flex-col w-full">
          <img className=" w-full h-48 object-cover rounded-t-lg" src={url} alt="product" />
          {/* <p className="price">{`$${price}`}</p> */}
          <p className=" mt-2 text-gray-700 text-lg">
            <span className="text-red-500 line-through mr-2" x-show="regularPrice > 0">
              {regularPrice > 0 && <del>${regularPrice}</del>}
            </span>
            {` $${price} `}
          </p>

          <h4 className="font-semibold text-xl mt-2">
            {shortenText(name, 18)}
            {/* {name} */}
          </h4>
          <p className="mt-1 text-gray-600">
            {shortenText(desc, 26)}
            {/* {description} */}
          </p>
        </div>

      </Link>
      <button
        className=" w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600"
        onClick={() => addToCart(product)}
      >
        Add To Cart
      </button>
    </div>
  );
};

export default CarouselItem;
