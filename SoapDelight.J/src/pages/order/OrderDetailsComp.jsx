import React, { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useParams } from 'react-router-dom'
import { getOrder } from '../../redux/features/order/OrderSlice';
import { Spinner } from 'flowbite-react';
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";


const OrderDetailsComp = ({orderPageLink}) => {
  const pdfRef = useRef();

  const {id} = useParams()
  const dispatch = useDispatch()


  const { isLoading, order } = useSelector(
    (state) => state.order
  );

  useEffect(() => {
    dispatch(getOrder(id));
    window.scrollTo(0, 0);
  }, [dispatch, id]);

  const downloadPDF = () => {
    const input = pdfRef.current;
    html2canvas(input).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4", true);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imageWidth = canvas.width;
      const imageHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imageWidth, pdfHeight / imageHeight);
      const imgX = (pdfWidth - imageWidth * ratio) / 2;
      const imgY = 30;
      pdf.addImage(
        imgData,
        "PNG",
        imgX,
        imgY,
        imageWidth * ratio,
        imageHeight * ratio
      );
      pdf.save(`soapDelightInvoice.pdf`);
    });
  };

  return (
    <div className='py-10 container'>
      <div className='py-4'>
          <Link to={orderPageLink}>&larr; Back To Orders</Link>
        </div>
      <div className="px-5 mx-auto overflow-x-scroll" ref={pdfRef}>
        <h2 className='text-xl'>Order Details</h2>
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
              <br />
              <table>
              <thead>
                <tr>
                  <th>s/n</th>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Quantity</th>
                  <th>Total</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {order?.cartItems?.map((cart, index) => {
                  const { _id, name, price, image, cartQuantity } = cart;
                  return (
                    <tr key={_id}>
                      <td>{index + 1}</td>
                      <td>
                        <p>
                          <b>{name}</b>
                        </p>
                        <img
                          // src={image[0]}
                          src={Array.isArray(image) && image.length > 0 ? image[0] : 'defaultImage.png'}

                          alt={name}
                          style={{ width: "100px" }}
                        />
                      </td>
                      <td>{price}</td>
                      <td>
                        {cartQuantity}
                      </td>
                      <td>{(price * cartQuantity).toFixed(2)}</td>
                      <td className={"icons"}>
                        <Link to={`/review-product/${_id}`}>
                            <button className="--btn --btn-primary">
                              Review Product
                            </button>
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            </>
          )}
        </div>

      </div>
      <div className='my-6 flex justify-center'>
          <button className="--btn --btn-primary" onClick={downloadPDF}>
              Download PDF
          </button>
        </div>
    </div>
  )
}

export default OrderDetailsComp

