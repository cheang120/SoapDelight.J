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
    <section>
      <div className={`container ${styles.product} mx-auto flex flex-wrap`}>
        
        <aside
          className={
            showFilter ? `w-full ${styles.filter} ${styles.show}` : `w-full  ${styles.filter}`
          }
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