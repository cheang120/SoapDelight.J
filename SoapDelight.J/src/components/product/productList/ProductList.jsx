import React, { useEffect, useState } from "react";
import styles from "./ProductList.module.scss";
import { BsFillGridFill } from "react-icons/bs";
import { FaListAlt } from "react-icons/fa";
import Search from "../../search/Search";
import ProductItem from "../productItem/ProductItem";
import { useDispatch, useSelector } from "react-redux";
import ReactPaginate from "react-paginate";
import { FILTER_BY_SEARCH, SORT_PRODUCTS, selectFilteredProducts } from "../../../redux/features/product/filtersSlice";


const ProductList = ({ products }) => {

  const [grid, setGrid] = useState(true);
  const [search, setSearch] = useState("");
  const dispatch = useDispatch();

  const [sort, setSort] = useState("latest");
  const filteredProducts = useSelector(selectFilteredProducts);
  // console.log(products);

  //   Begin Pagination
  // const [currentItems, setCurrentItems] = useState([]);
  // const [pageCount, setPageCount] = useState(0);
    const itemsPerPage = 9;

  const [itemOffset, setItemOffset] = useState(0);
  const endOffset = itemOffset + itemsPerPage
  const currentItems = filteredProducts.slice(itemOffset, endOffset)
  const pageCount = Math.ceil(products.length / itemsPerPage)

  // useEffect(() => {
  //   const endOffset = itemOffset + itemsPerPage;

  //   setCurrentItems(filteredProducts.slice(itemOffset, endOffset));
  //   setPageCount(Math.ceil(filteredProducts.length / itemsPerPage));
  // }, [itemOffset, itemsPerPage, filteredProducts]);

  const handlePageClick = (event) => {
    const newOffset = (event.selected * itemsPerPage) % filteredProducts.length;
    setItemOffset(newOffset);
  };
  //   End Pagination

  useEffect(() => {
    dispatch(SORT_PRODUCTS({ products, sort }));
  }, [dispatch, products, sort]);

  useEffect(() => {
    dispatch(FILTER_BY_SEARCH({ products, search }));
  }, [dispatch, products, search]);

  return (
    <div className={styles["product-list"]} id="product">
      <div className={styles.top}>
        <div className={styles.icons}>
          <BsFillGridFill
            size={22}
            color="orangered"
            onClick={() => setGrid(true)}
          />

          <FaListAlt size={24} color="#0066d4" onClick={() => setGrid(false)} />

          <p>
            <b>
                {currentItems.length}
            </b> Products found.
          </p>
        </div>
        {/* Search Icon */}
        <div>
          <Search value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {/* Sort Products */}
        <div className={styles.sort}>
          <label>Sort by:</label>
          <select
           value={sort} 
           onChange={(e) => setSort(e.target.value)}
          >
            <option value="latest">Latest</option>
            <option value="lowest-price">Lowest Price</option>
            <option value="highest-price">Highest Price</option>
            <option value="a-z">A - Z</option>
            <option value="z-a">Z - A</option>
          </select>
        </div>
      </div>

      <div className={grid ? `${styles.grid}` : `${styles.list}`}>
        {products.length === 0 ? (
          <p>No product found.</p>
        ) : (
          <>
            {currentItems.map((product) => {
              return (
                <div key={product._id} className=" m-4">
                  <ProductItem {...product} grid={grid} product={product} />
                </div>
              );
            })}
          </>
        )}
      </div>
      <ReactPaginate
        breakLabel="..."
        nextLabel="Next"
        onPageChange={handlePageClick}
        pageRangeDisplayed={3}
        pageCount={pageCount}
        previousLabel="Prev"
        renderOnZeroPageCount={null}
        containerClassName="flex justify-center items-center space-x-2 mb-5"
        pageLinkClassName="px-3 py-1 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-200"
        previousLinkClassName="px-3 py-1 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-200"
        nextLinkClassName="px-3 py-1 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-200"
        activeLinkClassName="px-3 py-1 border border-gray-300 rounded-md text-white bg-blue-500"
      />
    </div>
  );
};

export default ProductList;