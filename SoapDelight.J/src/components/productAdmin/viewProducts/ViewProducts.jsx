import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { deleteProduct, getProducts } from "../../../redux/features/product/productSlice";
import Search from "../../search/Search.jsx";
import { Spinner } from "../../../components/Loader.jsx";
import { FaEdit, FaTrashAlt } from "react-icons/fa";
import { AiOutlineEye } from "react-icons/ai";
import { Link } from "react-router-dom";
import { shortenText } from "../../../utils/index.jsx";
import { toast } from "react-toastify";
import ReactPaginate from "react-paginate";
import { confirmAlert } from "react-confirm-alert";
import "react-confirm-alert/src/react-confirm-alert.css";
import "./ViewProducts.scss";
import {
  ProductImage,
  getProductImage,
  getProductImageStatus,
} from "../../../utils/productImageFallback.jsx";
import inventoryService from "../inventory/inventoryService.js";

const formatMoney = (value) =>
  `$${Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const mapProductToFallbackInventoryRow = (product) => ({
  productId: product?._id,
  name: product?.name || "未命名商品",
  centralSku: product?.sku || "",
  category: product?.category || "",
  brand: product?.brand || "",
  publicPrice: Number(product?.price || 0),
  image: product?.image || [],
  centralStock: 0,
  onlineStock: 0,
  consignmentTotal: 0,
  macauBaptistStock: 0,
  macauBaptistSku: "",
  macauBaptistCommissionRate: 30,
  macauBaptistInternalNetPrice: Number(product?.price || 0) * 0.7,
  totalStock: Number(product?.quantity || 0),
  imageStatus: getProductImageStatus(product),
  locations: [],
  fallbackProduct: product,
});

const getSearchableRowText = (row) =>
  [
    row.name,
    row.centralSku,
    row.category,
    row.brand,
    row.macauBaptistSku,
    ...(Array.isArray(row.locations)
      ? row.locations.map((location) => location.locationSku)
      : []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

const ViewProducts = () => {
  const { currentUser } = useSelector((state) => state.user);
  const [search, setSearch] = useState("");
  const [itemOffset, setItemOffset] = useState(0);
  const [inventoryRows, setInventoryRows] = useState([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventoryError, setInventoryError] = useState(false);
  const [ensuringDefaults, setEnsuringDefaults] = useState(false);

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

  useEffect(() => {
    if (!canManageProducts) return;

    let shouldIgnore = false;

    const loadInventoryOverview = async () => {
      setInventoryLoading(true);
      setInventoryError(false);

      try {
        const overview = await inventoryService.getInventoryOverview();
        if (shouldIgnore) return;
        setInventoryRows(Array.isArray(overview) ? overview : []);
      } catch (error) {
        if (shouldIgnore) return;
        setInventoryError(true);
        setInventoryRows([]);
      } finally {
        if (!shouldIgnore) {
          setInventoryLoading(false);
        }
      }
    };

    loadInventoryOverview();

    return () => {
      shouldIgnore = true;
    };
  }, [canManageProducts]);

  const safeProducts = Array.isArray(products) ? products : [];
  const hasInventoryRows = !inventoryError && inventoryRows.length > 0;
  const stockRows = hasInventoryRows
    ? inventoryRows
    : safeProducts.map(mapProductToFallbackInventoryRow);

  const filteredProducts = useMemo(
    () => {
      const searchTerm = search.trim().toLowerCase();
      if (!searchTerm) return stockRows;
      return stockRows.filter((row) =>
        getSearchableRowText(row).includes(searchTerm)
      );
    },
    [stockRows, search]
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
    try {
      const overview = await inventoryService.getInventoryOverview();
      setInventoryRows(Array.isArray(overview) ? overview : []);
    } catch {
      setInventoryError(true);
    }
  };

  const handleEnsureDefaultLocations = async () => {
    setEnsuringDefaults(true);
    try {
      await inventoryService.ensureDefaultLocations();
      const overview = await inventoryService.getInventoryOverview();
      setInventoryRows(Array.isArray(overview) ? overview : []);
      setInventoryError(false);
      toast.success("已確認預設存貨地點");
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "未能確認預設存貨地點"
      );
    } finally {
      setEnsuringDefaults(false);
    }
  };

  const confirmDelete = (id) => {
    confirmAlert({
      title: "刪除商品",
      message: "確定要刪除此商品嗎？",
      buttons: [
        {
          label: "刪除",
          onClick: () => delProduct(id),
        },
        {
          label: "取消",
        },
      ],
    });
  };

  if (!canManageProducts) {
    return (
      <div className="rounded-3xl border border-zinc-200 bg-white px-6 py-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-base font-medium text-zinc-950 dark:text-white">
          你不是管理員，請以管理員身份登入。
        </p>
      </div>
    );
  }

  return (
    <section className="admin-products-page">
      <header className="admin-products-header">
        <div className="admin-products-copy">
          <p className="admin-products-eyebrow">商品</p>
          <h2 className="admin-products-title">查看商品</h2>
          <p className="admin-products-subtitle">
            管理商品目錄、各地點存貨及內部寄賣參考資料。
          </p>
          {inventoryError && (
            <p className="admin-products-warning">
              暫時未能載入存貨總覽，現正顯示商品列表備用資料。
            </p>
          )}
        </div>

        <div className="admin-products-toolbar">
          <div className="admin-products-count">
            找到 {filteredProducts.length} 件商品
          </div>
          <button
            type="button"
            className="admin-products-secondary-button"
            onClick={handleEnsureDefaultLocations}
            disabled={ensuringDefaults}
          >
            {ensuringDefaults ? "確認中..." : "確認預設存貨地點"}
          </button>
          <div className="admin-products-internal-note">
            只供內部參考
          </div>
          <div className="admin-products-search">
            <Search
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </header>

      {isLoading || inventoryLoading ? (
        <div className="admin-products-loading">
          <Spinner />
        </div>
      ) : (
        <div className="admin-products-card">
          <div className="admin-products-table-wrap">
            {currentItems.length === 0 ? (
              <div className="admin-products-empty">
                <p className="admin-products-empty-title">找不到商品</p>
                <p className="admin-products-empty-copy">
                  請嘗試其他搜尋字眼，或新增商品後再查看。
                </p>
              </div>
            ) : (
              <table className="admin-products-table">
                <thead>
                  <tr>
                    <th scope="col">序號</th>
                    <th scope="col">相片</th>
                    <th scope="col">名稱</th>
                    <th scope="col">中央 SKU</th>
                    <th scope="col">分類</th>
                    <th scope="col">公開價格</th>
                    <th scope="col">中央存貨</th>
                    <th scope="col">網店存貨</th>
                    <th scope="col">澳浸 SKU</th>
                    <th scope="col">澳浸存貨</th>
                    <th scope="col">
                      澳浸佣金
                      <span className="admin-products-th-note">
                        只供內部參考
                      </span>
                    </th>
                    <th scope="col">
                      內部淨價
                      <span className="admin-products-th-note">
                        只供內部參考
                      </span>
                    </th>
                    <th scope="col">總存貨</th>
                    <th scope="col">相片狀態</th>
                    <th scope="col" className="admin-products-actions-head">
                      操作
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {currentItems.map((row, index) => {
                    const {
                      productId,
                      name,
                      centralSku,
                      category,
                      publicPrice,
                      centralStock,
                      onlineStock,
                      macauBaptistSku,
                      macauBaptistStock,
                      macauBaptistCommissionRate,
                      macauBaptistInternalNetPrice,
                      totalStock,
                      imageStatus,
                    } = row;
                    const product = row.fallbackProduct || {
                      _id: productId,
                      name,
                      category,
                      image: row.image,
                    };
                    const productImage = getProductImage(product);

                    return (
                      <tr key={productId}>
                        <td>{itemOffset + index + 1}</td>
                        <td>
                          <div className="admin-products-photo-cell">
                            <Link
                              to={`/product-details/${productId}`}
                              className="admin-products-photo"
                              aria-label={`查看 ${name}`}
                            >
                              <ProductImage
                                product={product}
                                alt={name}
                                fallbackClassName="admin-products-photo-placeholder"
                              />
                            </Link>
                            <span
                              className={`admin-products-photo-status ${
                                productImage
                                  ? "admin-products-photo-status--real"
                                  : "admin-products-photo-status--placeholder"
                              }`}
                            >
                              {imageStatus}
                            </span>
                          </div>
                        </td>
                        <td className="admin-products-name">{shortenText(name, 16)}</td>
                        <td>{centralSku || "-"}</td>
                        <td>{category}</td>
                        <td>{formatMoney(publicPrice)}</td>
                        <td>{centralStock}</td>
                        <td>{onlineStock}</td>
                        <td>{macauBaptistSku || "-"}</td>
                        <td>{macauBaptistStock}</td>
                        <td>{Number(macauBaptistCommissionRate || 0)}%</td>
                        <td>{formatMoney(macauBaptistInternalNetPrice)}</td>
                        <td>{totalStock}</td>
                        <td>
                          <span
                            className={`admin-products-photo-status ${
                              productImage
                                ? "admin-products-photo-status--real"
                                : "admin-products-photo-status--placeholder"
                            }`}
                          >
                            {imageStatus}
                          </span>
                        </td>
                        <td className="admin-products-actions">
                          <Link
                            to={`/product-details/${productId}`}
                            className="admin-products-icon-button admin-products-icon-button--view"
                            aria-label={`查看 ${name}`}
                          >
                            <AiOutlineEye size={18} />
                          </Link>
                          <Link
                            to={`/productAdmin/edit-product/${productId}`}
                            className="admin-products-icon-button admin-products-icon-button--edit"
                            aria-label={`編輯 ${name}`}
                          >
                            <FaEdit size={16} />
                          </Link>
                          <button
                            type="button"
                            onClick={() => confirmDelete(productId)}
                            className="admin-products-icon-button admin-products-icon-button--delete"
                            aria-label={`刪除 ${name}`}
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
            nextLabel="下一頁"
            onPageChange={handlePageClick}
            pageRangeDisplayed={3}
            pageCount={pageCount}
            previousLabel="上一頁"
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
