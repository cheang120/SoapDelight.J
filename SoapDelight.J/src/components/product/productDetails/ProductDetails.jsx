import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import styles from "./ProductDetails.module.scss"
import { getProduct } from "../../../redux/features/product/productSlice";
import DOMPurify from "dompurify";
import { Spinner } from "../../Loader";


const ProductDetails = () => {
    const { id } = useParams();
    const dispatch = useDispatch();
    // const cartItems = useSelector(selectCartItems);
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
                    <div className={styles.details}>
                        <div className={styles.img}>
                            <img 
                                src={product.image[imageIndex]} 
                                alt={product?.name} 
                                className={styles.pImg}

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
                    </div>
                </>
            )}
        </div>    
    </section>
  )
}

export default ProductDetails
