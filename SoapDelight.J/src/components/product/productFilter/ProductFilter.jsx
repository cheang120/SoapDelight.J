import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import styles from "./ProductFilter.module.scss";
import {
  FILTER_BY_BRAND,
  // FILTER_BY_BRAND,
  FILTER_BY_CATEGORY,
  // FILTER_BY_PRICE,
} from "../../../redux/features/product/filtersSlice";


const ProductFilter = () => {
  const { products, minPrice, maxPrice } = useSelector(
    (state) => state.product
  );
  const [category, setCategory] = useState("All");
  const [brand, setBrand] = useState("All");
  const [price, setPrice] = useState([50, 1500]);

  const dispatch = useDispatch();

  const allCategories = [
    "All",
    ...new Set(products?.map((product) => product.category)),
  ];

  useEffect(() => {
    dispatch(FILTER_BY_BRAND({ products, brand }));
  }, [dispatch, products, brand]);

  // console.log(allBrands);

  // const filterProducts = (cat) => {
  //   setCategory(cat);
  //   dispatch(FILTER_BY_CATEGORY({ products, category: cat }));
  // };

  const filterProductCategory = (cat) => {
    // console.log(cat);
    setCategory(cat);
    dispatch(FILTER_BY_CATEGORY({ products:products, category: cat }));
    
  }

  // console.log(allCategories);
  const allBrands = [
    "All",
    ...new Set(products.map((product) => product.brand)),
  ];
  // console.log(allBrands);
  return (
    <div className={styles.filter}>
      <h4>Categories</h4>
      <div className={styles.category}>
        {allCategories.map((cat,index) => {
          return (
              <button
                key={index}
                type="button"
                className={`${category}` === cat ? `${styles.active}` : null}
                onClick={() => filterProductCategory(cat)}
              >
                &#8250; {cat}
              </button>

          )
      })}
      </div>
      <h4>Brand</h4>
      <div className={styles.brand}>
        <select value={brand} onChange={(e) => setBrand(e.target.value)}>
          {allBrands.map((brand, index) => {
            return (
              <option key={index} value={brand}>
                {brand}
              </option>
            );
          })}
        </select>
      </div>
    </div>
  )
}

export default ProductFilter
