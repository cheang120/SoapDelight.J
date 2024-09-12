import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import styles from "./ProductDetails.module.scss"
import { getProduct } from "../../../redux/features/product/productSlice";
import DOMPurify from "dompurify";
import { Spinner } from "../../Loader";
import ProductRating from "../productRating/ProductRating.jsx";
import { toast } from "react-toastify";
import {
     calculateAverageRating, 
    //  getCartQuantityById 
} from "../../../utils/index.jsx";
import Card from "../../card/Card.jsx";
import { ADD_TO_CART, DECREASE_CART, saveCartDB, selectCartItems } from "../../../redux/features/cart/cartSlice.jsx";
import { addToWishlist } from "../../../redux/features/auth/authSlice.js";
import ProductRatingSummary from "../productRating/productRatingSummary.jsx";
import StarRating from "react-star-ratings";


const ProductDetails = () => {
    const { id } = useParams();
    const dispatch = useDispatch();
    const cartItems = useSelector(selectCartItems);
    const [imageIndex, setImageIndex] = useState(0);
    const { product, isLoading } = useSelector((state) => state.product);

    useEffect(() => {
        dispatch(getProduct(id));
      }, [dispatch, id]);
    //   console.log(product);

    const slideLength = product?.image?.length
    const nextSlide = () => {
        setImageIndex(imageIndex === slideLength -1 ? 0 : imageIndex + 1)
    }
    let slideInterval;
    useEffect(() => {
        if (product?.image?.length > 1) {
          const auto = () => {
            slideInterval = setInterval(nextSlide, 3000);
          };
          auto();
        }
        return () => clearInterval(slideInterval);
    }, [imageIndex, slideInterval, product]);

    const averageRating = calculateAverageRating(product?.ratings);

    const cart = cartItems.find((cart) => cart._id === id);
    const isCartAdded = cartItems.findIndex((cart) => {
        return cart._id === id;
    });

    const addToCart = (product) => {
        dispatch(ADD_TO_CART(product));
        // dispatch(CALCULATE_TOTAL_QUANTITY());
        dispatch(
          saveCartDB({ cartItems: JSON.parse(localStorage.getItem("cartItems")) })
        );
    };
    
    const decreaseCart = (product) => {
        dispatch(DECREASE_CART(product));
        // dispatch(CALCULATE_TOTAL_QUANTITY());
        // dispatch(
        //   saveCartDB({ cartItems: JSON.parse(localStorage.getItem("cartItems")) })
        // );
    };

    const addWishlist = (product) => {
        const productData = {
          productId: product._id,
        };
        console.log(productData);
        dispatch(addToWishlist(productData));
    };
    // const averageRating = calculateAverageRating(product?.ratings);


  return (
    <section>
        <div className={`container ${styles.product}`}>
            <h2>Product Details</h2>
            <div>
                <Link to="/shop">&larr; Back To Products</Link>
            </div>
            {isLoading ? (
                <Spinner />
            ) : (
                <>
                    <div className={`${styles.details} `}>
                        <div className={`${styles.img} my-4`}>
                            <img 
                                src={product?.image[imageIndex]} 
                                alt={product?.name} 
                                className={`${styles.pImg} w-full min-h-[30rem] max-h-[30rem] md:min-h-[40rem] md:max-h-[40rem]`}
                        
                            />
                            <div className={styles.smallImg}>
                                {product?.image.map((img,index) => {
                                    return (
                                        <img
                                         key={index} 
                                         src={img} 
                                         alt="product" 
                                         onClick={() => setImageIndex(index)}
                                         className={imageIndex === index ? "activeImg" : ""}
                                        />
                                    )
                                })}
                            </div>
                        </div>
                        <div className={`${styles.content} my-4`}>
                            <h3>{product?.name}</h3>

                            <ProductRating
                                averageRating={averageRating}
                                noOfRatings={product?.ratings.length}
                            />
                            <div className="--underline"></div>
                            <div className={styles.property}>
                                <p>
                                    <b>Price:</b>
                                </p>
                                <p className={styles.price}>{`$${product?.price}`}</p>
                            </div>
                            <div className={styles.property}>
                                <p>
                                    <b>SKU:</b>
                                </p>
                                <p>{product?.sku}</p>
                            </div>
                            <div className={styles.property}>
                                <p>
                                    <b>Category: </b>
                                </p>
                                <p>{product?.category}</p>
                            </div>
                            <div className={styles.property}>
                                <p>
                                    <b>Brand: </b>
                                </p>
                                <p>{product?.brand}</p>
                            </div>
                            <div className={styles.property}>
                                <p>
                                    <b>Color: </b>
                                </p>
                                <p>{product?.color}</p>
                            </div>
                            <div className={styles.property}>
                                <p>
                                    <b>Quantity in stock: </b>
                                </p>
                                <p>{product?.quantity}</p>
                            </div>
                            <div className={styles.property}>
                                <p>
                                    <b>Sold: </b>
                                </p>
                                <p>{product?.sold}</p>
                            </div>
                            <div className={styles.count}>
                                {isCartAdded < 0 ? null : (
                                    <>
                                        <button className="--btn" onClick={() => decreaseCart(product)}>
                                            -
                                        </button>
                                        <p>
                                            <b>{cart.cartQuantity}</b>
                                        </p>
                                        <button className="--btn" onClick={() => addToCart(product)}>
                                            +
                                        </button>
                                    </>
                                )}

                            </div>
                            <div className="--flex-start">
                                {product?.quantity > 0 ? (
                                    <button
                                        className="--btn --btn-primary"
                                        onClick={() => addToCart(product)}
                                    >
                                    ADD TO CART
                                    </button>
                                ) : (
                                    <button
                                        className="--btn --btn-red"
                                        onClick={() =>
                                            toast.error("Sorry, Product is out of stock")
                                        }
                                    >
                                    Out Of Stock
                                    </button>
                                )}
                                <button
                                    className="--btn --btn-danger"
                                    onClick={() => addWishlist(product)}
                                >
                                    ADD TO WISHLIST
                                </button>
                            </div>
                            <div className="--underline"></div>
                            <p>
                                <b>Product Description:</b>
                            </p>
                            <div
                                    dangerouslySetInnerHTML={{
                                        __html: DOMPurify.sanitize(product?.description),
                                    }}
                            ></div>
                            <div className="--underline"></div>
                        </div>
                    </div>
                </>
            )}
            {/* Review section */}
            <Card cardClass={`${styles.card} mb-5`}>
                <h3>Product Reviews</h3>
                <ProductRating
                    averageRating={averageRating}
                    noOfRatings={product?.ratings.length}
                />
                <div className="mt-5 --underline"></div>
                <div className={`${styles.ratings} flex flex-col md:flex-row`}>
                    {product !== null && product?.ratings.length > 0 && (
                        <ProductRatingSummary ratings={product?.ratings} />
                    )}

                    <div className="--m">
                    {product?.ratings.length === 0 ? (
                        <p>There are no reviews for this product yet.</p>
                    ) : (
                        <>
                        {product?.ratings.map((item, index) => {
                            const { star, review, reviewDate, name, userID } = item;
                            return (
                            <div key={index} className={styles.review}>
                                {/* <StarsRating value={star} style={{ fontSize: 10 }} /> */}
                                <StarRating
                                starDimension="20px"
                                starSpacing="2px"
                                starRatedColor="#F6B01E"
                                rating={star}
                                editing={false}
                                />
                                <p>{review}</p>
                                <span>
                                <b>{reviewDate}</b>
                                </span>
                                <br />
                                <span>
                                <b>by: {name}</b>
                                </span>
                            </div>
                            );
                        })}
                        </>
                    )}
                    </div>
                </div>
            </Card>
        </div>    
    </section>
  )
}

export default ProductDetails
