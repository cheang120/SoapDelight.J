import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import "./OrderHistory.scss"
import { getOrders } from '../../redux/features/order/OrderSlice';
import Loader from '../../components/Loader';
import ListOfOrders from './ListOfOrder';

const OrderHistory = () => {
  const { isLoading, isError, message, orders } = useSelector(
    (state) => state.order
  );

  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(getOrders());
  }, [dispatch]);

  const openOrderDetails = (id) => {
    navigate(`/order-details/${id}`);
  };

  return (
    <section style={{height:"100%"}} className='p-3 --mh-100vh'>
      <div className={`container order mx-auto mt-10 h-max  overflow-x-scroll` }>
        <h2 className='text-2xl mb-4'>Order History</h2>
        <p>
          Open an order to leave a <b>Product Review</b>
        </p>
        <br />
        <ListOfOrders  openOrderDetails={openOrderDetails}/>
      </div>
    </section>
  )
}

export default OrderHistory
