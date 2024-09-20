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
    const navigate = useNavigate()
    const dispatch = useDispatch()

    const setPayment = (e) => {
        e.preventDefault()

        if (paymentMethod === "") {
            return toast.error("Please select a payment method.")
        }

        // Save the payment method to Redux
        dispatch(SAVE_PAYMENT_METHOD(paymentMethod))

        // Navigate to the checkout-details page, passing the selectedShippingFee in the state
        if (isLoggedIn) {
            navigate("/checkout-details");
        } else {
            navigate("/sign-in?redirect=cart");  // Redirect to sign-in page if not logged in
        }
    }
    // console.log(selectedShippingFee);

    return (
        <>
            <form className="--form-control" onSubmit={setPayment}>
                <div className='flex flex-col gap-2'>
                    <div className='flex w-full mb-5'>
                        <label htmlFor={"stripe"}>
                            <input
                                className="radio-input"
                                type="radio"
                                name={"paymentMethod"}
                                id={"stripe"}
                                value={"stripe"}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                            />
                            <span className="custom-radio"></span>
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
