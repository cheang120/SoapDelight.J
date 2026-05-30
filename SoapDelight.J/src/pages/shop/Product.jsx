import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import styles from "./Product.module.scss";

import { FaSlidersH, FaTimes } from "react-icons/fa";
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
    <main className="min-h-screen overflow-x-hidden bg-[#fbfcfa] px-4 py-10 text-zinc-950 dark:bg-zinc-950 dark:text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl overflow-x-hidden">
        <section className="mb-10 rounded-[1.75rem] border border-zinc-200 bg-white px-6 py-10 dark:border-zinc-800 dark:bg-zinc-950 sm:px-8">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.24em] text-emerald-700">
            商品系列
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-5xl">
            選購
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-600 dark:text-zinc-300">
            由手作護理、香氣蠟燭、陶瓷器物到生活禮品，慢慢選一件適合日常或送禮的作品。
          </p>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-zinc-500 dark:text-zinc-400">
            部分商品可能暫時缺貨，仍可透過聯絡我們查詢補貨或寄賣點供應。
          </p>
        </section>

        <div className="mb-4 flex justify-end lg:hidden">
          <button
            type="button"
            onClick={toggleFilter}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-zinc-300 bg-white px-5 text-sm font-medium text-zinc-900 transition hover:border-zinc-950 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
          >
            {showFilter ? <FaTimes size={14} /> : <FaSlidersH size={14} />}
            {showFilter ? "關閉篩選" : "篩選"}
          </button>
        </div>

        {showFilter && (
          <div
            className="fixed inset-0 z-40 bg-zinc-950/20 backdrop-blur-[1px] lg:hidden"
            onClick={() => setShowFilter(false)}
          />
        )}

        <div className="grid min-w-0 gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside
            className={`${
              showFilter
                ? "fixed inset-x-4 top-20 z-50 max-h-[calc(100vh-6rem)] overflow-y-auto rounded-[1.5rem] border border-zinc-200 bg-white p-5 shadow-[0_18px_50px_rgba(24,24,27,0.12)] dark:border-zinc-800 dark:bg-zinc-950 lg:static lg:max-h-none lg:shadow-none"
                : "hidden lg:block"
            }`}
          >
            {isLoading ? null : <ProductFilter />}
          </aside>

          <div className={`${styles.content} min-w-0`}>
            {isLoading ? <Spinner /> : <ProductList products={products} />}
          </div>
        </div>
      </div>
    </main>
  );
};

export default Product;
