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
    <div className={grid ? `${styles.grid} mb-5` : `${styles.list} mb-5` }>
      <Link to={`/product-details/${_id}`}>
        <div className={styles.img}>
          <img src={image[0]} alt={name} />
        </div>
      </Link>
      <div className={styles.content}>
        <div className={styles.details}>
          <p>
            <span>{regularPrice > 0 && <del>${regularPrice}</del>}</span>
            {` $${price} `}
          </p>
          <ProductRating
            averageRating={averageRating}
            noOfRatings={product?.ratings.length}
          />
        <h4>{shortenText(name, 18)}</h4>

        </div>
        {!grid && (
          // <p className={styles.desc}>{shortenText(description, 200)}</p>
          <div
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(
                shortenText(product?.description, 200)
              ),
            }}
          ></div>
        )}
        {product?.quantity > 0 ? (
          <button
            className="--btn --btn-primary"
            onClick={() => addToCart(product)}
          >
            Add To Cart
          </button>
        ) : (
          <button
            className="--btn --btn-red"
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
