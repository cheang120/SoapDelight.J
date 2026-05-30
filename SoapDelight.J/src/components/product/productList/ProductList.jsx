import React, { useEffect, useMemo, useState } from "react";
import styles from "./ProductList.module.scss";
import { BsFillGridFill } from "react-icons/bs";
import { FaListAlt } from "react-icons/fa";
import Search from "../../search/Search";
import ProductItem from "../productItem/ProductItem";
import { useDispatch, useSelector } from "react-redux";
import ReactPaginate from "react-paginate";
import { FILTER_BY_SEARCH, SORT_PRODUCTS, selectFilteredProducts } from "../../../redux/features/product/filtersSlice";
import { useSearchParams } from "react-router-dom";


const ProductList = ({ products }) => {

  const [grid, setGrid] = useState(true);
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window === "undefined"
      ? true
      : window.matchMedia("(min-width: 1024px)").matches
  );
  const [search, setSearch] = useState("");
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();

  const [sort, setSort] = useState("latest");
  const filteredProducts = useSelector(selectFilteredProducts);
  const categoryQuery = searchParams.get("category");
  const baseProducts = Array.isArray(filteredProducts) ? filteredProducts : products;
  const categoryAliases = {
    "手作皂": ["手作皂", "Soap"],
    "個人護理": ["個人護理", "Personal Care"],
    "香薰蠟": ["香薰蠟", "Candle"],
  };
  const isVisibleProduct = (product) =>
    (product?.productStatus || "active") !== "discontinued" &&
    product?.category !== "Shipping";

  const displayedProducts = useMemo(() => {
    const searchTerm = search.trim().toLocaleLowerCase();
    const categoryTerms = categoryQuery
      ? categoryAliases[categoryQuery] || [categoryQuery]
      : null;

    const visibleProducts = baseProducts
      .filter(isVisibleProduct)
      .filter((product) => {
        if (!categoryTerms) return true;
        return categoryTerms.includes(product.category);
      })
      .filter((product) => {
        if (!searchTerm) return true;
        return [product.name, product.category, product.brand]
          .filter(Boolean)
          .some((value) =>
            String(value).toLocaleLowerCase().includes(searchTerm)
          );
      });

    return visibleProducts.slice().sort((a, b) => {
      if (sort === "lowest-price") {
        return Number(a.price) - Number(b.price);
      }
      if (sort === "highest-price") {
        return Number(b.price) - Number(a.price);
      }
      if (sort === "a-z") {
        return String(a.name).localeCompare(String(b.name), "zh-Hant");
      }
      if (sort === "z-a") {
        return String(b.name).localeCompare(String(a.name), "zh-Hant");
      }
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });
  }, [baseProducts, categoryQuery, search, sort]);

  //   Begin Pagination
  // const [currentItems, setCurrentItems] = useState([]);
  // const [pageCount, setPageCount] = useState(0);
  const itemsPerPage = 9;

  const [itemOffset, setItemOffset] = useState(0);
  const endOffset = itemOffset + itemsPerPage
  const currentItems = displayedProducts.slice(itemOffset, endOffset)
  const pageCount = Math.ceil(displayedProducts.length / itemsPerPage)

  // useEffect(() => {
  //   const endOffset = itemOffset + itemsPerPage;

  //   setCurrentItems(filteredProducts.slice(itemOffset, endOffset));
  //   setPageCount(Math.ceil(filteredProducts.length / itemsPerPage));
  // }, [itemOffset, itemsPerPage, filteredProducts]);

  const handlePageClick = (event) => {
    const newOffset = (event.selected * itemsPerPage) % (displayedProducts.length || 1);
    setItemOffset(newOffset);
  };
  //   End Pagination

  useEffect(() => {
    dispatch(SORT_PRODUCTS({ products, sort }));
  }, [dispatch, products, sort]);

  useEffect(() => {
    dispatch(FILTER_BY_SEARCH({ products, search }));
  }, [dispatch, products, search]);

  useEffect(() => {
    setItemOffset(0);
  }, [search, sort, categoryQuery, displayedProducts.length]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const mediaQuery = window.matchMedia("(min-width: 1024px)");

    const handleViewportChange = () => {
      setIsDesktop(mediaQuery.matches);
      if (!mediaQuery.matches) {
        setGrid(true);
      }
    };

    handleViewportChange();

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleViewportChange);
      return () => mediaQuery.removeEventListener("change", handleViewportChange);
    }

    mediaQuery.addListener(handleViewportChange);
    return () => mediaQuery.removeListener(handleViewportChange);
  }, []);

  const isListView = isDesktop && !grid;
  const useGridLayout = !isListView;

  return (
    <div className={`${styles["product-list"]} min-w-0`} id="product">
      <div className="rounded-[1.5rem] border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 sm:p-5">
        <div className="flex flex-col gap-4 border-b border-zinc-100 pb-4 dark:border-zinc-800">
          <Search value={search} onChange={(e) => setSearch(e.target.value)} />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-600 dark:text-zinc-300">
              <div className="flex items-center gap-2 rounded-full border border-zinc-200 px-3 py-2 dark:border-zinc-700">
                <span className="font-medium text-zinc-950 dark:text-white">
                  {displayedProducts.length}
                </span>
                <span>件商品</span>
              </div>

              <div className="hidden items-center gap-1 rounded-full border border-zinc-200 p-1 dark:border-zinc-700 lg:flex">
                <button
                  type="button"
                  onClick={() => setGrid(true)}
                  className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
                    grid
                      ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950"
                      : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-900"
                  }`}
                  aria-label="格狀顯示"
                >
                  <BsFillGridFill size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setGrid(false)}
                  className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
                    !grid
                      ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950"
                      : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-900"
                  }`}
                  aria-label="列表顯示"
                >
                  <FaListAlt size={16} />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:justify-end">
              <label className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                排序
              </label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="min-h-11 rounded-full border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
              >
                <option value="latest">最新上架</option>
                <option value="lowest-price">價格由低至高</option>
                <option value="highest-price">價格由高至低</option>
                <option value="a-z">名稱 A - Z</option>
                <option value="z-a">名稱 Z - A</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div
        className={
          useGridLayout
            ? "mt-6 grid min-w-0 grid-cols-1 gap-4 min-[440px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3"
            : "mt-6 space-y-4"
        }
      >
        {displayedProducts.length === 0 ? (
          <div className="rounded-[1.25rem] border border-zinc-200 bg-white px-6 py-12 text-center text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
            找不到符合條件的商品。
          </div>
        ) : (
          <>
            {currentItems.map((product) => {
              return (
                <div key={product._id} className="dark:text-white">
                  <ProductItem {...product} grid={useGridLayout} product={product} />
                </div>
              );
            })}
          </>
        )}
      </div>
      <ReactPaginate
        breakLabel="..."
        nextLabel="下一頁"
        onPageChange={handlePageClick}
        pageRangeDisplayed={3}
        pageCount={pageCount}
        previousLabel="上一頁"
        renderOnZeroPageCount={null}
        containerClassName="mt-8 flex flex-wrap justify-center items-center gap-2 rounded-[1.25rem] border border-zinc-200 bg-white/80 p-2 dark:border-zinc-800 dark:bg-zinc-950/80"
        pageLinkClassName="inline-flex min-h-10 min-w-10 items-center justify-center rounded-full border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-100 hover:text-zinc-950 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-white"
        previousLinkClassName="inline-flex min-h-10 items-center justify-center rounded-full border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-100 hover:text-zinc-950 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-white"
        nextLinkClassName="inline-flex min-h-10 items-center justify-center rounded-full border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-100 hover:text-zinc-950 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-white"
        breakLinkClassName="inline-flex min-h-10 min-w-10 items-center justify-center rounded-full px-2 text-sm font-semibold text-zinc-500 dark:text-zinc-400"
        activeLinkClassName="!border-zinc-950 !bg-zinc-950 !text-white shadow-sm dark:!border-white dark:!bg-white dark:!text-zinc-950"
        disabledLinkClassName="cursor-not-allowed opacity-45"
      />
    </div>
  );
};

export default ProductList;
