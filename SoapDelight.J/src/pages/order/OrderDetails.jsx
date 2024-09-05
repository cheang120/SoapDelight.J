import React, { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useParams } from 'react-router-dom'
import { getOrder } from '../../redux/features/order/OrderSlice';
import { Spinner } from 'flowbite-react';

const OrderDetails = () => {
  const pdfRef = useRef();

  const {id} = useParams()
  const dispatch = useDispatch()

  const { isLoading, order } = useSelector(
    (state) => state.order
  );

  useEffect(() => {
    dispatch(getOrder(id));
  }, [dispatch, id]);

  // const downloadPDF = () => {
  //   const input = pdfRef.current;
  //   html2canvas(input).then((canvas) => {
  //     const imgData = canvas.toDataURL("image/png");
  //     const pdf = new jsPDF("p", "mm", "a4", true);
  //     const pdfWidth = pdf.internal.pageSize.getWidth();
  //     const pdfHeight = pdf.internal.pageSize.getHeight();
  //     const imageWidth = canvas.width;
  //     const imageHeight = canvas.height;
  //     const ratio = Math.min(pdfWidth / imageWidth, pdfHeight / imageHeight);
  //     const imgX = (pdfWidth - imageWidth * ratio) / 2;
  //     const imgY = 30;
  //     pdf.addImage(
  //       imgData,
  //       "PNG",
  //       imgX,
  //       imgY,
  //       imageWidth * ratio,
  //       imageHeight * ratio
  //     );
  //     pdf.save(`shopitoInvoice.pdf`);
  //   });
  // };
  return (
    <section className='py-10'>
      <div className="container mx-auto">
        <h2 className='text-xl'>Order Details</h2>
        <div className='py-4'>
          <Link to="/order-history">&larr; Back To Orders</Link>
        </div>
        <br />
        <div className='table'>
          {isLoading && order === null ? (
            <Spinner />
          ) : (
            <>
              <p>
                <b>Ship to</b> : {order?.shippingAddress?.name}
              </p>
              <p>
                <b>Order ID</b> : {order?._id}
              </p>
              <p>
                <b>Order Amount</b> : {order?.orderAmount}
              </p>
              <p>
                <b>Coupon</b> : {order?.coupon.name} | {order?.coupon?.discount}%
              </p>
              <p>
                <b>Payment Method</b> : {order?.paymentMethod}
              </p>
              <p>
                <b>Order Status</b> : {order?.orderStatus}
              </p>
              <p>
                <b>Shipping Address</b> 
                <br />
                Address: {order?.shippingAddress.line1},{order?.shippingAddress.line2}, {order?.shippingAddress.city}
                <br />
                State: {order?.shippingAddress.state}
                <br />
                Country: {order?.shippingAddress.country}
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  )
}

export default OrderDetails
