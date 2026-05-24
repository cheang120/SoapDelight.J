import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { deleteProduct, getProducts } from "../../../redux/features/product/productSlice";
import Search from "../../search/Search.jsx";
import { Spinner } from "../../../components/Loader.jsx";
import { FaEdit, FaTrashAlt } from "react-icons/fa";
import { AiOutlineEye } from "react-icons/ai";
import { Link } from "react-router-dom";
import { shortenText } from "../../../utils/index.jsx";
import ReactPaginate from "react-paginate";
import { confirmAlert } from "react-confirm-alert";
import "react-confirm-alert/src/react-confirm-alert.css";
import "./ViewProducts.scss";

const ViewProducts = () => {
  const { currentUser } = useSelector((state) => state.user);
  const [search, setSearch] = useState("");
  const [itemOffset, setItemOffset] = useState(0);

  const dispatch = useDispatch();
  const { products = [], isLoading } = useSelector((state) => state.product);

  const userRole = currentUser?.role;
  const canManageProducts = userRole === "author" || userRole === "admin";

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (canManageProducts) {
      dispatch(getProducts());
    }
  }, [canManageProducts, dispatch]);

  const safeProducts = Array.isArray(products) ? products : [];

  const filteredProducts = useMemo(
    () =>
      safeProducts.filter((product) =>
        product?.name?.toLowerCase().includes(search.toLowerCase())
      ),
    [safeProducts, search]
  );

  useEffect(() => {
    setItemOffset(0);
  }, [search]);

  useEffect(() => {
    if (itemOffset > 0 && itemOffset >= filteredProducts.length) {
      setItemOffset(0);
    }
  }, [filteredProducts.length, itemOffset]);

  const itemsPerPage = 5;
  const endOffset = itemOffset + itemsPerPage;
  const currentItems = filteredProducts.slice(itemOffset, endOffset);
  const pageCount = filteredProducts.length
    ? Math.ceil(filteredProducts.length / itemsPerPage)
    : 0;

  const handlePageClick = (event) => {
    if (!filteredProducts.length) return;

    const newOffset = (event.selected * itemsPerPage) % filteredProducts.length;
    setItemOffset(newOffset);
  };

  const delProduct = async (id) => {
    await dispatch(deleteProduct(id));
    await dispatch(getProducts());
  };

  const confirmDelete = (id) => {
    confirmAlert({
      title: "Delete Product",
      message: "Are you sure you want to delete this product.",
      buttons: [
        {
          label: "Delete",
          onClick: () => delProduct(id),
        },
        {
          label: "Cancel",
        },
      ],
    });
  };

  if (!canManageProducts) {
    return (
      <div className="rounded-3xl border border-zinc-200 bg-white px-6 py-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-base font-medium text-zinc-950 dark:text-white">
          You are not admin, please login as Admin
        </p>
      </div>
    );
  }

  return (
    <section className="admin-products-page">
      <header className="admin-products-header">
        <div className="admin-products-copy">
          <p className="admin-products-eyebrow">PRODUCTS</p>
          <h2 className="admin-products-title">All Products</h2>
          <p className="admin-products-subtitle">
            Manage your product catalogue, stock and product actions.
          </p>
        </div>

        <div className="admin-products-toolbar">
          <div className="admin-products-count">
            {filteredProducts.length} products found
          </div>
          <div className="admin-products-search">
            <Search
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </header>

      {isLoading ? (
        <div className="admin-products-loading">
          <Spinner />
        </div>
      ) : (
        <div className="admin-products-card">
          <div className="admin-products-table-wrap">
            {currentItems.length === 0 ? (
              <div className="admin-products-empty">
                <p className="admin-products-empty-title">No products found</p>
                <p className="admin-products-empty-copy">
                  Try a different search term or check back after adding new products.
                </p>
              </div>
            ) : (
              <table className="admin-products-table">
                <thead>
                  <tr>
                    <th scope="col">S/N</th>
                    <th scope="col">Name</th>
                    <th scope="col">Category</th>
                    <th scope="col">Price</th>
                    <th scope="col">Quantity</th>
                    <th scope="col">Value</th>
                    <th scope="col" className="admin-products-actions-head">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {currentItems.map((product, index) => {
                    const { _id, name, category, price, quantity } = product;

                    return (
                      <tr key={_id}>
                        <td>{itemOffset + index + 1}</td>
                        <td className="admin-products-name">{shortenText(name, 16)}</td>
                        <td>{category}</td>
                        <td>${price}</td>
                        <td>{quantity}</td>
                        <td>${price * quantity}</td>
                        <td className="admin-products-actions">
                          <Link
                            to={`/product-details/${_id}`}
                            className="admin-products-icon-button admin-products-icon-button--view"
                            aria-label={`View ${name}`}
                          >
                            <AiOutlineEye size={18} />
                          </Link>
                          <Link
                            to={`/productAdmin/edit-product/${_id}`}
                            className="admin-products-icon-button admin-products-icon-button--edit"
                            aria-label={`Edit ${name}`}
                          >
                            <FaEdit size={16} />
                          </Link>
                          <button
                            type="button"
                            onClick={() => confirmDelete(_id)}
                            className="admin-products-icon-button admin-products-icon-button--delete"
                            aria-label={`Delete ${name}`}
                          >
                            <FaTrashAlt size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {pageCount > 1 && (
        <div className="admin-products-pagination">
          <ReactPaginate
            breakLabel="..."
            nextLabel="Next"
            onPageChange={handlePageClick}
            pageRangeDisplayed={3}
            pageCount={pageCount}
            previousLabel="Prev"
            renderOnZeroPageCount={null}
            containerClassName="admin-products-pagination-list"
            pageLinkClassName="admin-products-pagination-link"
            previousLinkClassName="admin-products-pagination-link"
            nextLinkClassName="admin-products-pagination-link"
            activeLinkClassName="admin-products-pagination-link admin-products-pagination-link--active"
          />
        </div>
      )}
    </section>
  );
};

export default ViewProducts;
