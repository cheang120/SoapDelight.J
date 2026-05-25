import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  ADD_TO_CART,
  CALCULATE_SUBTOTAL,
  CALCULATE_TOTAL_QUANTITY,
  CLEAR_CART,
  DECREASE_CART,
  REMOVE_FROM_CART,
  SELECT_DELIVERY_METHOD,
  getCartDB,
  selectCartItems,
  selectCartTotalAmount,
  selectCartTotalQuantity,
  selectCouponDiscountAmount,
  selectProductCartItems,
  selectProductSubtotal,
  selectSelectedDeliveryMethod,
  getDeliveryMethodLabel,
  LOCAL_PICKUP_METHOD,
  saveCartDB,
} from "../../redux/features/cart/cartSlice";
import { SAVE_PAYMENT_METHOD } from "../../redux/features/checkout/checkoutSlice";
import { selectIsLoggedIn } from "../../redux/user/userSlice";
import { getProducts } from "../../redux/features/product/productSlice";
import VerifyCoupon from "../../components/verifyCoupon/VerifyCoupon";
import { FaMinus, FaPlus, FaRegImage, FaTrashAlt } from "react-icons/fa";
import { toast } from "react-toastify";

const formatMoney = (value) => `$${Number(value || 0).toFixed(2)}`;

const CartImage = ({ image, name }) => {
  const [failed, setFailed] = useState(false);
  const src = Array.isArray(image) ? image[0] : image;

  if (!src || failed) {
    return (
      <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-400 dark:bg-zinc-900">
        <FaRegImage size={22} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name || "Cart item"}
      className="h-24 w-24 shrink-0 rounded-lg object-cover"
      onError={() => setFailed(true)}
    />
  );
};

const Cart = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const cartItems = useSelector(selectCartItems);
  const productItems = useSelector(selectProductCartItems);
  const cartTotalQuantity = useSelector(selectCartTotalQuantity);
  const cartTotalAmount = useSelector(selectCartTotalAmount);
  const productSubtotal = useSelector(selectProductSubtotal);
  const couponDiscountAmount = useSelector(selectCouponDiscountAmount);
  const selectedDeliveryMethod = useSelector(selectSelectedDeliveryMethod);
  const { coupon } = useSelector((state) => state.coupon);
  const { products = [] } = useSelector((state) => state.product);
  const { currentUser } = useSelector((state) => state.user);
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const shippingOptions = products.filter((item) => item?.category === "Shipping");
  const hasRealProducts = productItems.length > 0;
  const deliveryFee = Number(selectedDeliveryMethod?.price || 0);
  const deliveryOptions = [LOCAL_PICKUP_METHOD, ...shippingOptions];
  const selectedDeliveryId = selectedDeliveryMethod?._id || "";

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (currentUser) {
      dispatch(getCartDB());
    }
  }, [currentUser, dispatch]);

  useEffect(() => {
    dispatch(CALCULATE_SUBTOTAL({ coupon }));
    dispatch(CALCULATE_TOTAL_QUANTITY());
  }, [cartItems, dispatch, coupon]);

  useEffect(() => {
    if (!products.length) {
      dispatch(getProducts());
    }
  }, [dispatch, products.length]);

  const handleCheckout = () => {
    if (!hasRealProducts) return;
    if (!selectedDeliveryMethod) {
      toast.info("Please select a delivery method before checkout. / 請先選擇送貨方式。");
      return;
    }
    dispatch(SAVE_PAYMENT_METHOD("stripe"));
    if (currentUser || isLoggedIn) {
      navigate("/checkout-details");
    } else {
      navigate("/sign-in?redirect=cart");
    }
  };

  const syncCartToDB = () => {
    if (!currentUser) return;

    dispatch(
      saveCartDB({ cartItems: JSON.parse(localStorage.getItem("cartItems") || "[]") })
    );
  };

  const increaseQuantity = (item) => {
    dispatch(ADD_TO_CART(item));
    syncCartToDB();
  };

  const decreaseQuantity = (item) => {
    if (Number(item.cartQuantity || 0) <= 1) return;
    dispatch(DECREASE_CART(item));
    syncCartToDB();
  };

  const removeCartItem = (item) => {
    dispatch(REMOVE_FROM_CART(item));
    syncCartToDB();
  };

  const clearCartItems = () => {
    dispatch(CLEAR_CART());

    if (currentUser) {
      dispatch(saveCartDB({ cartItems: [] }));
    }
  };

  const handleDeliverySelection = (methodId) => {
    const method = deliveryOptions.find((option) => option._id === methodId);
    if (!method) return;
    dispatch(SELECT_DELIVERY_METHOD(method));
    dispatch(CALCULATE_SUBTOTAL({ coupon }));

    if (currentUser) {
      dispatch(
        saveCartDB({ cartItems: JSON.parse(localStorage.getItem("cartItems") || "[]") })
      );
    }
  };

  return (
    <main className="min-h-screen bg-[#fbfcfa] px-5 py-10 text-zinc-950 dark:bg-zinc-950 dark:text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.24em] text-emerald-700">
              Order Review
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 dark:text-white">
              Shopping Cart
            </h1>
            <p className="mt-3 text-zinc-600 dark:text-zinc-300">
              Review your handmade picks before checkout.
            </p>
          </div>
          <Link
            to="/shop"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-zinc-300 px-6 text-sm font-medium text-zinc-900 transition hover:border-zinc-950 dark:border-zinc-700 dark:text-white dark:hover:border-zinc-300"
          >
            Continue Shopping / 繼續選購
          </Link>
        </div>

        {!hasRealProducts ? (
          <section className="rounded-[1.5rem] border border-zinc-200 bg-white px-6 py-16 text-center dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-3xl font-semibold text-zinc-950 dark:text-white">
              Your cart is empty.
            </h2>
            <p className="mt-3 text-zinc-600 dark:text-zinc-300">
              你的購物車暫時沒有商品。
            </p>
            <Link
              to="/shop"
              className="mt-8 inline-flex min-h-11 items-center justify-center rounded-full bg-zinc-950 px-7 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              Continue Shopping / 繼續選購
            </Link>
          </section>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
            <section className="space-y-4">
              {productItems.map((item) => {
                const {
                  _id,
                  name = "Untitled product",
                  price = 0,
                  image,
                  cartQuantity = 1,
                  quantity,
                  category,
                } = item;
                const maxQuantity = Number(quantity || 0);
                const canIncrease = maxQuantity <= 0 || cartQuantity < maxQuantity;
                const itemTotal = Number(price || 0) * Number(cartQuantity || 0);

                return (
                  <article
                    key={_id}
                    className="rounded-[1.25rem] border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 sm:p-5"
                  >
                    <div className="flex flex-col gap-5 sm:flex-row">
                      <Link to={`/product-details/${_id}`} className="shrink-0">
                        <CartImage image={image} name={name} />
                      </Link>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col justify-between gap-3 md:flex-row">
                          <div>
                            {category && (
                              <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-700">
                                {category}
                              </p>
                            )}
                            <Link
                              to={`/product-details/${_id}`}
                              className="mt-1 block text-xl font-semibold text-zinc-950 transition hover:text-emerald-800 dark:text-white"
                            >
                              {name}
                            </Link>
                            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                              Unit price: {formatMoney(price)}
                            </p>
                          </div>

                          <div className="text-left md:text-right">
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                              Item subtotal
                            </p>
                            <p className="mt-1 text-xl font-semibold">
                              {formatMoney(itemTotal)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                          <div className="inline-flex w-fit min-h-11 items-center overflow-hidden rounded-full border border-zinc-200 dark:border-zinc-800">
                            <button
                              type="button"
                              onClick={() => decreaseQuantity(item)}
                              disabled={cartQuantity <= 1}
                              className="flex h-11 w-12 items-center justify-center text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:text-zinc-300 dark:text-zinc-200 dark:hover:bg-zinc-900"
                              aria-label={`Decrease ${name} quantity`}
                            >
                              <FaMinus size={12} />
                            </button>
                            <span className="min-w-12 text-center text-sm font-medium">
                              {cartQuantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => increaseQuantity(item)}
                              disabled={!canIncrease}
                              className="flex h-11 w-12 items-center justify-center text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:text-zinc-300 dark:text-zinc-200 dark:hover:bg-zinc-900"
                              aria-label={`Increase ${name} quantity`}
                            >
                              <FaPlus size={12} />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeCartItem(item)}
                            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-zinc-200 px-4 text-sm font-medium text-zinc-600 transition hover:border-red-200 hover:text-red-600 dark:border-zinc-800 dark:text-zinc-300"
                          >
                            <FaTrashAlt size={13} />
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}

              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={clearCartItems}
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-zinc-300 px-6 text-sm font-medium text-zinc-700 transition hover:border-red-300 hover:text-red-600 dark:border-zinc-700 dark:text-zinc-200"
                >
                  Clear Cart / 清除購物車
                </button>
              </div>
            </section>

            <aside className="w-full min-w-0 border-0 lg:sticky lg:top-24 lg:self-start">
              <div className="w-full rounded-[1.5rem] border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
                <h2 className="text-2xl font-semibold tracking-tight">
                  Order Summary
                </h2>
                <div className="mt-6 space-y-4 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-zinc-500 dark:text-zinc-400">
                      Items
                    </span>
                    <span className="font-medium">{cartTotalQuantity}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-zinc-500 dark:text-zinc-400">
                      Product subtotal / 商品小計
                    </span>
                    <span className="font-medium">
                      {formatMoney(productSubtotal)}
                    </span>
                  </div>
                  <div className="rounded-[1.25rem] border border-zinc-200 bg-[#f7faf6] p-4 dark:border-zinc-800 dark:bg-zinc-900">
                    <label
                      htmlFor="delivery-method"
                      className="text-sm font-semibold text-zinc-950 dark:text-white"
                    >
                      Delivery Method / 送貨方式
                    </label>
                    <select
                      id="delivery-method"
                      value={selectedDeliveryId}
                      onChange={(e) => handleDeliverySelection(e.target.value)}
                      className="mt-3 block min-h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm text-zinc-950 outline-none transition focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                    >
                      <option value="" disabled>
                        請先選擇送貨方式
                      </option>
                      {deliveryOptions.map((method) => (
                        <option key={method._id} value={method._id}>
                          {getDeliveryMethodLabel(method.name, { concise: true })}
                        </option>
                      ))}
                    </select>
                    <div className="mt-3 flex items-center justify-between gap-4 text-sm">
                      <span className="text-zinc-500 dark:text-zinc-400">
                        Delivery fee / 運費
                      </span>
                      <span className="font-medium text-zinc-950 dark:text-white">
                        {formatMoney(deliveryFee)}
                      </span>
                    </div>
                    {!selectedDeliveryMethod && (
                      <p className="mt-3 text-xs text-amber-700 dark:text-amber-300">
                        請先選擇送貨方式
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-6 border-t border-zinc-100 pt-5 dark:border-zinc-800">
                  {coupon && (
                    <div className="mb-4 flex justify-between gap-4 text-sm text-emerald-700">
                      <span>Coupon discount / 優惠折扣</span>
                      <span>-{formatMoney(couponDiscountAmount)}</span>
                    </div>
                  )}
                  <VerifyCoupon />
                </div>

                <div className="mt-6 border-t border-zinc-100 pt-5 dark:border-zinc-800">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold">Total / 總數</span>
                    <span className="text-3xl font-semibold">
                      {formatMoney(cartTotalAmount)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCheckout}
                    disabled={!hasRealProducts || !selectedDeliveryMethod}
                    className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-zinc-950 px-7 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
                  >
                    Checkout
                  </button>
                  <p className="mt-3 text-center text-xs text-zinc-500 dark:text-zinc-400">
                    {selectedDeliveryMethod
                      ? "You will sign in before checkout if needed."
                      : "Please select a delivery method before checkout. / 請先選擇送貨方式。"}
                  </p>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
};

export default Cart;
