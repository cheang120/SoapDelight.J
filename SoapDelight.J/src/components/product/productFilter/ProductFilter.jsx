import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  FILTER_BY_BRAND,
  FILTER_BY_CATEGORY,
  FILTER_BY_PRICE,
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
  const visibleProducts = products?.filter(
    (product) => product.category !== "Shipping"
  );

  const allCategories = [
    "All",
    ...new Set(visibleProducts?.map((product) => product.category)),
  ];

  useEffect(() => {
    dispatch(FILTER_BY_BRAND({ products, brand }));
  }, [dispatch, products, brand]);

  useEffect(() => {
    dispatch(GET_PRICE_RANGE({ products }));
  }, [dispatch, products]);

  const filterProductCategory = (cat) => {
    setCategory(cat);
    dispatch(FILTER_BY_CATEGORY({ products, category: cat }));
  };

  useEffect(() => {
    dispatch(FILTER_BY_PRICE({ products, price }));
  }, [dispatch, products, price]);

  const allBrands = [
    "All",
    ...new Set(
      visibleProducts?.map((product) => product.brand).filter(Boolean) || []
    ),
  ];

  const clearFilters = () => {
    setCategory("All");
    setBrand("All");
    setPrice([minPrice, maxPrice]);
  };

  return (
    <div className="space-y-8 text-zinc-900 dark:text-white">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
          篩選
        </p>
        <h3 className="mt-2 text-lg font-semibold tracking-tight">
          收窄選購範圍
        </h3>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">
          分類
        </h4>
        <div className="mt-3 flex flex-wrap gap-2">
          {allCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`rounded-full border px-4 py-2 text-sm transition ${
                category === cat
                  ? "border-zinc-950 bg-zinc-950 text-white dark:border-white dark:bg-white dark:text-zinc-950"
                  : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-zinc-500 dark:hover:text-white"
              }`}
              onClick={() => filterProductCategory(cat)}
            >
              {cat === "All" ? "全部" : cat}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">
          品牌
        </h4>
        <div className="mt-3">
          <select
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="min-h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
          >
            {allBrands.map((brandOption) => (
              <option key={brandOption} value={brandOption}>
                {brandOption === "All" ? "全部" : brandOption}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">
            價格
          </h4>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            ${price[0]} - ${price[1]}
          </span>
        </div>
        <div className="mt-5 px-1">
          <Slider
            range
            min={minPrice}
            max={maxPrice}
            value={price}
            onChange={(nextPrice) => setPrice(nextPrice)}
            trackStyle={[{ backgroundColor: "#18181b", height: 4 }]}
            handleStyle={[
              {
                borderColor: "#18181b",
                backgroundColor: "#18181b",
                opacity: 1,
              },
              {
                borderColor: "#18181b",
                backgroundColor: "#18181b",
                opacity: 1,
              },
            ]}
            railStyle={{ backgroundColor: "#e4e4e7", height: 4 }}
          />
        </div>
      </div>

      <div>
        <button
          type="button"
          className="inline-flex min-h-10 items-center rounded-full border border-zinc-200 px-4 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900 dark:hover:text-white"
          onClick={clearFilters}
        >
          清除篩選
        </button>
      </div>
    </div>
  );
};

export default ProductFilter;
