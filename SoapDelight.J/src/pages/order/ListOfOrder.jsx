import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getOrders } from '../../redux/features/order/OrderSlice';
import Loader from '../../components/Loader';

const ListOfOrders = ({ openOrderDetails }) => {
  const { isLoading, isError, message, orders } = useSelector(
    (state) => state.order
  );

  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(getOrders());
  }, [dispatch]);

  return (
    <>
      {isLoading && <Loader />}
      <div className="table-container pb-10">
        {orders.length === 0 ? (
          <p className="h-screen dark:text-gray-200">No order found</p>
        ) : (
          <table className="min-w-full bg-white dark:bg-gray-800 text-black dark:text-gray-200 shadow-lg rounded-lg overflow-hidden">
            <thead className="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
              <tr>
                <th className="py-3 px-6">s/n</th>
                <th className="py-3 px-6">Date</th>
                <th className="py-3 px-6">Order ID</th>
                <th className="py-3 px-6">Order Amount</th>
                <th className="py-3 px-6">Order Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, index) => {
                const { _id, orderDate, orderTime, orderAmount, orderStatus } = order;
                return (
                  <tr
                    key={_id}
                    onClick={() => openOrderDetails(_id)}
                    className="border-b hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                  >
                    <td className="py-3 px-6">{index + 1}</td>
                    <td className="py-3 px-6">
                      {orderDate} at {orderTime}
                    </td>
                    <td className="py-3 px-6">{_id}</td>
                    <td className="py-3 px-6">${orderAmount}</td>
                    <td className="py-3 px-6">
                      <p
                        className={
                          orderStatus !== 'Delivered'
                            ? 'bg-yellow-200 dark:bg-yellow-500 text-yellow-800 dark:text-yellow-200 py-1 px-3 rounded-full'
                            : 'bg-green-200 dark:bg-green-500 text-green-800 dark:text-green-200 py-1 px-3 rounded-full'
                        }
                      >
                        {orderStatus}
                      </p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
};

export default ListOfOrders;

