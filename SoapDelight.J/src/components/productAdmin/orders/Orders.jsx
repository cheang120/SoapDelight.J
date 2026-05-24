import React, { useEffect } from 'react'
import ListOfOrders from '../../../pages/order/ListOfOrder'
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getOrders, selectOrders } from '../../../redux/features/order/OrderSlice';

const Orders = () => {
  const orders = useSelector(selectOrders);
  window.scrollTo(0, 0);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(getOrders());
  }, [dispatch]);

  const openOrderDetails = (id) => {
    navigate("/productAdmin/order-details/" + id);
  };
  return (
    <div className='container order overflow-x-scroll min-h-screen'>
      <h2 className='text-2xl'>All Orders</h2>
        <p>
          Open an order to <b>Change Order Status.</b>
        </p>
        <br />
        <ListOfOrders orders={orders || []} openOrderDetails={openOrderDetails}/>

    </div>
  )
}

export default Orders
