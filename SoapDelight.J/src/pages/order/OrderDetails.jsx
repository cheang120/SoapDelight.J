import React, { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useParams } from 'react-router-dom'
import { getOrder } from '../../redux/features/order/OrderSlice';
import { Spinner } from 'flowbite-react';
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import OrderDetailsComp from './OrderDetailsComp';


const OrderDetails = ({orderPageLink}) => {
  const pdfRef = useRef();

  const {id} = useParams()
  const dispatch = useDispatch()

  const { isLoading, order } = useSelector(
    (state) => state.order
  );

  useEffect(() => {
    dispatch(getOrder(id));
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
    <section className='mt-10'>
      <OrderDetailsComp orderPageLink={"/order-history"}/>
    </section>
  )
}

export default OrderDetails
