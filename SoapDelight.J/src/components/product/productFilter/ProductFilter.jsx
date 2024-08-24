import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import styles from "./ProductFilter.module.scss";
import {
  FILTER_BY_BRAND,
  // FILTER_BY_BRAND,
  FILTER_BY_CATEGORY,
  FILTER_BY_PRICE,
  // FILTER_BY_PRICE,
  // GET_PRICE_RANGE
} from "../../../redux/features/product/filtersSlice";
import { GET_PRICE_RANGE } from "../../../redux/features/product/productSlice";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";


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

  useEffect(() => {
    dispatch(GET_PRICE_RANGE({ products }));
  }, [dispatch, products]);
  console.log(minPrice,maxPrice);

  // console.log(allBrands);

  const filterProductCategory = (cat) => {
    // console.log(cat);
    setCategory(cat);
    dispatch(FILTER_BY_CATEGORY({ products:products, category: cat }));
    
  }

  useEffect(() => {
    dispatch(FILTER_BY_PRICE({ products, price }));
    // console.log(price);
  }, [dispatch, products, price]);

  // console.log(allCategories);
  const allBrands = [
    "All",
    ...new Set(products.map((product) => product.brand)),
  ];
  // console.log(allBrands);

  const clearFilters = () => {
    setCategory("All");
    setBrand("All");
    setPrice([minPrice, maxPrice]);
  };
  return (
<div className="py-4 px-1">
  <h4 className="mt-4 text-lg font-semibold">Categories</h4>
  <div className="mt-2">
    {allCategories.map((cat, index) => (
      <button
        key={index}
        type="button"
        className={`block w-full md:w-4/5 text-left h-12 text-base border-b border-gray-400 ${
          category === cat ? 'pl-4 border-l-2 border-l-red-500' : ''
        }`}
        onClick={() => filterProductCategory(cat)}
      >
        {cat}
      </button>
    ))}
  </div>
  <h4 className="mt-4 text-lg font-semibold">Brand</h4>
  <div className="mt-2">
    <select
      value={brand}
      onChange={(e) => setBrand(e.target.value)}
      className="w-full  p-2 border border-gray-400 rounded outline-none text-base font-light"
    >
      {allBrands.map((brand, index) => (
        <option key={index} value={brand}>
          {brand}
        </option>
      ))}
    </select>
  </div>
  <h4 className="mt-4 text-lg font-semibold">Price</h4>
  <div className="mt-2 px-4">
    <Slider
      range
      marks={{
        1: `${price[0]}`,
        1000: `${price[1]}`,
      }}
      min={minPrice}
      max={maxPrice}
      defaultValue={[minPrice, maxPrice]}
      tipFormatter={(value) => `$${value}`}
      tipProps={{
        placement: "top",
        visible: true,
      }}
      value={price}
      onChange={(price) => setPrice(price)}

    />
  </div>
  <div className="mt-6">
    <button
      className="bg-red-500 text-xs text-white py-1 px-2 rounded shadow hover:bg-red-600"
      onClick={clearFilters}
    >
      Clear Filter
    </button>
  </div>
</div>
  )
}

export default ProductFilter
