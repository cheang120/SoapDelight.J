import React, { useState } from 'react'
import "./Radio.scss"

const PaymentOption = () => {
    const [paymentMethod, setPaymentMethod] = useState("")
    const setPayment = () => {}
  return (
    <>
      <p>Please choose a payment method</p>
      <form 
        className="--form-control" 
        onSubmit={setPayment}
      >
        <div className='flex flex-col gap-2'>
            <div className='flex w-full'>
                <label 
                    htmlFor={"stripe"} 
                    className="radio-label"
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
                    Stripe
                </label>
            </div>

            <div className='flex w-full'>

                <label htmlFor={"flutterwave"} className="radio-label">
                            <input
                                className="radio-input"
                                type="radio"
                                name={"paymentMethod"}
                                id={"flutterwave"}
                                value={"flutterwave"}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                            />
                            <span className="custom-radio" />
                            Flutterwave
                </label>
            </div>

            <div className='flex w-full'>
                <label htmlFor={"paypal"} className="radio-label">
                            <input
                                className="radio-input"
                                type="radio"
                                name={"paymentMethod"}
                                id={"paypal"}
                                value={"paypal"}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                            />
                            <span className="custom-radio" />
                            Paypal
                </label>
            </div>

            <div className='flex w-full'>
                <label htmlFor={"wallet"} className="radio-label">
                            <input
                                className="radio-input"
                                type="radio"
                                name={"paymentMethod"}
                                id={"wallet"}
                                value={"wallet"}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                            />
                            <span className="custom-radio" />
                            Wallet
                </label>
            </div>
        </div>







        <button
            type="submit"
            className="--btn --btn-primary --btn-block"
        >
            Checkout
        </button>
      </form>
    </>
  )
}

export default PaymentOption
