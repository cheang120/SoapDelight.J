import React from 'react'
import { Link } from 'react-router-dom'
import OrderDetailsComp from '../../../pages/order/OrderDetailsComp'

const OrderDetails = () => {
  return (
    // <div>
    //   <div className='py-4'>
    //       <Link to="/productAdmin/orders">&larr; Back To Orders</Link>
    //   </div>
    //   <div className=" mx-auto" >
    //     <h2 className='text-xl'>My Order Details</h2>
    //     <br />
    //   </div>
    // </div>
    <OrderDetailsComp orderPageLink={"/productAdmin/orders"}/>
  )
}

export default OrderDetails
