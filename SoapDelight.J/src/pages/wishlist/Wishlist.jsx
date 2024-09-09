import React, { useEffect, useState } from "react";
import styles from "../../components/product/productList/ProductList.module.scss";
import { useDispatch, useSelector } from "react-redux";
import {
  getWishlist,
  removeFromWishlist,
} from "../../redux/features/auth/authSlice";
import "./Wishlist.scss"
import ProductItem from "../../components/product/productItem/ProductItem";

const Wishlist = () => {
  const [grid, setGrid] = useState(true);
  const dispatch = useDispatch();
  const { wishlist, isLoading } = useSelector((state) => state.auth);

  const removeWishlist = async (product) => {
    const productId = product._id;
    console.log(productId);
    await dispatch(removeFromWishlist(productId));
    await dispatch(getWishlist());
  };

  useEffect(() => {
    dispatch(getWishlist());
  }, [dispatch]);
//   console.log(wishlist);
//   console.log(wishlist.length);

  return (
    <>
      <section>
        {/* {isLoading && <Loader />} */}
        <div className="container min-h-screen">
          <h2 className="text-2xl my-5">My Wishlist</h2>
          <div className="--underline"></div>
          <div className={grid ? `${styles.grid}` : `${styles.list}`}>
            {wishlist.length === 0 ? (
              <p>No product found in your wishlist...</p>
            ) : (
              <>
                {wishlist.map((product) => {
                  return (
                    <div key={product._id}>
                      <ProductItem {...product} grid={grid} product={product} />
                      <button
                        className="--btn --btn-danger --btn-block"
                        onClick={() => removeWishlist(product)}
                      >
                        Romove From Wishlist
                      </button>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      </section>
    </>
  );
};

export default Wishlist;