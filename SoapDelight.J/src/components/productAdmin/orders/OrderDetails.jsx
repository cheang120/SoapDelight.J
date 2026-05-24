import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import Loader from "../../Loader";
import OrderDetailsComp from "../../../pages/order/OrderDetailsComp";
import ChangeOrderStatus from "../changeOrderStatus/ChangeOrderStatus";
import { getOrder } from "../../../redux/features/order/OrderSlice";

const OrderDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { isLoading, isError, message, order } = useSelector(
    (state) => state.order
  );

  useEffect(() => {
    window.scrollTo(0, 0);

    if (id) {
      dispatch(getOrder(id));
    }
  }, [dispatch, id]);

  const isCurrentOrderLoaded = order?._id === id;

  return (
    <>
      {isLoading && !isCurrentOrderLoaded ? (
        <Loader />
      ) : isError && !order ? (
        <div className="rounded-[1.75rem] border border-red-200 bg-red-50 px-6 py-8 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {message || "We couldn't load this order right now."}
        </div>
      ) : (
        <OrderDetailsComp
          order={order}
          orderPageLink="/productAdmin/orders"
        />
      )}

      <ChangeOrderStatus />
    </>
  );
};

export default OrderDetails
