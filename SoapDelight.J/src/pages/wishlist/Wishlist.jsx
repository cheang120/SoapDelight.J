import React, { useEffect, useState } from "react";
import styles from "../../components/product/productList/ProductList.module.scss";
import { useDispatch, useSelector } from "react-redux";
import {
  getWishlist,
  removeFromWishlist,
} from "../../redux/features/auth/authSlice";
import "./Wishlist.scss"
import ProductItem from "../../components/product/productItem/ProductItem";
import Loader from "../../components/Loader";

const Wishlist = () => {
  const [grid, setGrid] = useState(true);
  const dispatch = useDispatch();
  const { wishlist = [], isLoading } = useSelector((state) => state.auth);

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
      <section className="mb-10 dark:bg-gray-900 dark:text-white py-10">
        {isLoading && <Loader />}
        <div className="container min-h-screen ">
          <h2 className="text-2xl my-5 dark:text-white">My Wishlist</h2>
          <div className="--underline dark:bg-gray-800"></div>
          <div className={grid ? `${styles.grid} dark:bg-gray-900` : `${styles.list} dark:bg-gray-900`}>
            {wishlist.length === 0 ? (
              <p className="dark:text-gray-300">No product found in your wishlist...</p>
            ) : (
              <>
                {wishlist.map((product) => {
                  return (
                    <div key={product._id} className="my-5 dark:bg-gray-800 dark:text-white p-4 rounded-lg">
                      <ProductItem {...product} grid={grid} product={product} />
                      <div className="w-full flex justify-center">
                        <button
                          className="--btn --btn-danger  dark:bg-red-600 dark:hover:bg-red-700 dark:border-none dark:text-white"
                          onClick={() => removeWishlist(product)}
                        >
                          Romove From Wishlist
                        </button>
                      </div>

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