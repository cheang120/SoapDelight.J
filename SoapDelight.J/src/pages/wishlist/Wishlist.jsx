import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  getWishlist,
  removeFromWishlist,
} from "../../redux/features/auth/authSlice";
import {
  ADD_TO_CART,
  CALCULATE_TOTAL_QUANTITY,
  saveCartDB,
} from "../../redux/features/cart/cartSlice";
import Loader from "../../components/Loader";
import "./Wishlist.scss";
import { FaRegHeart, FaShoppingBag, FaTrashAlt } from "react-icons/fa";
import { ProductImage } from "../../utils/productImageFallback.jsx";

const Wishlist = () => {
  const dispatch = useDispatch();
  const { wishlist = [], isLoading } = useSelector((state) => state.auth);
  const { currentUser } = useSelector((state) => state.user);
  const visibleWishlist = wishlist.filter((product) => product?.category !== "Shipping");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (currentUser) {
      dispatch(getWishlist());
    }
  }, [currentUser, dispatch]);

  const removeWishlist = async (product) => {
    if (!currentUser) {
      toast.info("請先登入以管理收藏清單。");
      return;
    }
    await dispatch(removeFromWishlist(product._id));
    await dispatch(getWishlist());
  };

  const addToCart = (product) => {
    dispatch(ADD_TO_CART(product));
    dispatch(CALCULATE_TOTAL_QUANTITY());
    if (currentUser) {
      dispatch(
        saveCartDB({ cartItems: JSON.parse(localStorage.getItem("cartItems")) })
      );
    }
  };

  return (
    <main className="wishlist-page min-h-screen bg-[#fbfcfa] px-5 py-10 text-zinc-950 dark:bg-zinc-950 dark:text-white sm:px-6 lg:px-8">
      {isLoading && currentUser && <Loader />}

      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.24em] text-emerald-700">
              收藏項目
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 dark:text-white">
              我的收藏清單
            </h1>
            <p className="mt-3 text-zinc-600 dark:text-zinc-300">
              將喜歡的手作商品先收藏起來，稍後再慢慢選購。
            </p>
          </div>
          <Link
            to="/shop"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-zinc-300 px-6 text-sm font-medium text-zinc-900 transition hover:border-zinc-950 dark:border-zinc-700 dark:text-white dark:hover:border-zinc-300"
          >
            繼續選購
          </Link>
        </div>

        {!currentUser ? (
          <section className="rounded-[1.5rem] border border-zinc-200 bg-white px-6 py-16 text-center dark:border-zinc-800 dark:bg-zinc-950">
            <FaRegHeart className="mx-auto mb-6 h-8 w-8 text-emerald-700" />
            <h2 className="text-3xl font-semibold text-zinc-950 dark:text-white">
              請登入以查看收藏清單。
            </h2>
            <p className="mt-3 text-zinc-600 dark:text-zinc-300">
              登入後即可查看你的收藏清單。
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                to="/sign-in"
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-zinc-950 px-7 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
              >
                登入
              </Link>
              <Link
                to="/shop"
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-zinc-300 px-7 text-sm font-medium text-zinc-900 transition hover:border-zinc-950 dark:border-zinc-700 dark:text-white dark:hover:border-zinc-300"
              >
                繼續選購
              </Link>
            </div>
          </section>
        ) : visibleWishlist.length === 0 ? (
          <section className="rounded-[1.5rem] border border-zinc-200 bg-white px-6 py-16 text-center dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-3xl font-semibold text-zinc-950 dark:text-white">
              收藏清單暫時是空的。
            </h2>
            <p className="mt-3 text-zinc-600 dark:text-zinc-300">
              你暫時未收藏任何商品。
            </p>
            <Link
              to="/shop"
              className="mt-8 inline-flex min-h-11 items-center justify-center rounded-full bg-zinc-950 px-7 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              瀏覽商品
            </Link>
          </section>
        ) : (
          <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {visibleWishlist.map((product) => {
              const {
                _id,
                name = "未命名商品",
                price = 0,
                regularPrice,
                quantity = 0,
                category,
              } = product;
              const hasDiscount = Number(regularPrice) > Number(price);

              return (
                <article
                  key={_id}
                  className="group flex h-full flex-col rounded-[1.25rem] border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <Link to={`/product-details/${_id}`} className="overflow-hidden rounded-lg">
                    <ProductImage
                      product={product}
                      alt={name || "收藏商品"}
                      className="aspect-square w-full rounded-lg object-cover transition duration-300 group-hover:scale-[1.02]"
                      fallbackClassName="aspect-square rounded-lg"
                    />
                  </Link>
                  <div className="flex flex-1 flex-col px-1 py-4">
                    {category && (
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-700">
                        {category}
                      </p>
                    )}
                    <Link
                      to={`/product-details/${_id}`}
                      className="mt-2 text-lg font-semibold leading-6 text-zinc-950 transition hover:text-emerald-800 dark:text-white"
                    >
                      {name}
                    </Link>
                    <div className="mt-3 flex items-center gap-2">
                      {hasDiscount && (
                        <del className="text-sm text-zinc-400">${regularPrice}</del>
                      )}
                      <span className="text-base font-semibold">${price}</span>
                    </div>

                    <div className="mt-auto grid gap-2 pt-5">
                      <button
                        type="button"
                        onClick={() => addToCart(product)}
                        disabled={Number(quantity) <= 0}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-zinc-950 px-5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
                      >
                        <FaShoppingBag size={14} />
                        {Number(quantity) > 0 ? "加入購物車" : "暫時缺貨"}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeWishlist(product)}
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-zinc-200 px-5 text-sm font-medium text-zinc-600 transition hover:border-red-200 hover:text-red-600 dark:border-zinc-800 dark:text-zinc-300"
                      >
                        <FaTrashAlt size={13} />
                        移除
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
};

export default Wishlist;
