import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import styles from "./Product.module.scss";

import { FaCogs } from "react-icons/fa";
import {
//   GET_PRICE_RANGE,
  getProducts,
  selectIsLoading,
//   selectProducts,
} from "../../redux/features/product/productSlice";
import { Spinner } from "../../components/Loader";
import ProductList from "../../components/product/productList/ProductList";
import ProductFilter from "../../components/product/productFilter/ProductFilter";

const Product = () => {
//   const products = useSelector(selectProducts);
  const dispatch = useDispatch();

  const [showFilter, setShowFilter] = useState(false);
  const {isLoading, products} = useSelector((state) => state.product);

  useEffect(() => {
    dispatch(getProducts());
    window.scrollTo(0, 0);
  }, [dispatch]);
//   console.log(products);

//   useEffect(() => {
//     dispatch(
//     //   GET_PRICE_RANGE({
//     //     products: products,
//     //   })
//     );
//   }, [dispatch, products]);

  const toggleFilter = () => {
    setShowFilter(!showFilter);
  };

  return (
    <section className=" min-h-[70rem]">
      <div className={`pt-10 mx-auto px-10 md:px-20 lg:px-20  ${styles.product} mx-auto flex flex-wrap justify-center`}>
        
        <aside
          className={`${
            showFilter
              ? "fixed top-20 left-4 w-64  bg-white dark:bg-gray-800 dark:text-white shadow-md p-4 overflow-y-auto z-50 transition-transform duration-300 ease-in-out"
              : "fixed -left-full top-20 w-64  bg-white dark:bg-gray-800 dark:text-white shadow-md p-4 overflow-y-auto z-50 transition-transform duration-300 ease-in-out"
          }`}
        >
          {isLoading ? null : <ProductFilter />}
        </aside>

        <div className={styles.content}>
          {isLoading ? <Spinner /> : <ProductList products={products} />}
          <div className={styles.icon} onClick={toggleFilter}>
            <FaCogs size={20} color="orangered" />
            <p>
              <b>{showFilter ? "Hide Filter" : "Show Filter"}</b>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Product;