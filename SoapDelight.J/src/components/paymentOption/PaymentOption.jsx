import React, { useState } from 'react'
import "./Radio.scss"
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useDispatch, useSelector } from 'react-redux'
import { SAVE_PAYMENT_METHOD } from '../../redux/features/checkout/checkoutSlice'
import { selectIsLoggedIn } from '../../redux/user/userSlice.js'

const PaymentOption = ({ selectedShippingFee }) => {
    const [paymentMethod, setPaymentMethod] = useState("")
    const isLoggedIn = useSelector(selectIsLoggedIn)
    console.log("Selected Shipping Fee in PaymentOption:", selectedShippingFee);
    // console.log(selectIsLoggedIn);
    const navigate = useNavigate()
    const dispatch = useDispatch()
    // console.log("Is Logged In:", isLoggedIn);
    const setPayment = (e) => {
        e.preventDefault()
        // console.log(paymentMethod);
        if (paymentMethod === "") {
            return toast.error("Please select a payment method.")
        }
        console.log("Navigating to checkout-details with shipping fee:", selectedShippingFee);

        dispatch(SAVE_PAYMENT_METHOD(paymentMethod))
        // console.log(selectIsLoggedIn);
        if (isLoggedIn) {
            navigate("/checkout-details"),
            { state: { selectedShippingFee } }
        } else {
            navigate("/sign-in?redirect=cart");  // 未登錄時重定向到登錄頁面
        }
    }
    console.log("Navigating to checkout-details with shipping fee:", selectedShippingFee);

  return (
    <>
      {/* <p>Please choose a payment method</p> */}
      <form 
        className="--form-control" 
        onSubmit={setPayment}
      >
        <div className='flex flex-col gap-2'>
            <div className='flex w-full mb-5'>
                <label 
                    htmlFor={"stripe"} 
                    // className="radio-label"
                >
                    <input
                        className="radio-input"
                        type="radio"
                        name={"paymentMethod"}
                        id={"stripe"}
                        value={"stripe"}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <span className="custom-radio" ></span>
                    Confirm Order
                </label>
            </div>
        </div>

        <button
            type="submit"
            className="--btn --btn-primary --btn-block"
            id={"stripe"}
            name={"paymentMethod"}
            value={"stripe"}
            onChange={(e) => setPaymentMethod(e.target.value)}
        >
            Checkout
        </button>
      </form>
    </>
  )
}

export default PaymentOption
