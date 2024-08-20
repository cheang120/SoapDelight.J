import React, { useEffect, useState } from "react";
// import Card from "../../card/Card";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useDispatch, useSelector } from "react-redux";
import { createCoupon, getCoupons } from "../../../redux/features/coupon/couponSlice";
// import Loader from "../../loader/Loader";
import { toast } from "react-toastify";

const CreateCoupon = ({reloadCoupon}) => {
  const [name, setName] = useState("");
  const [discount, setDiscount] = useState(0);
  const [expiresAt, setExpiresAt] = useState(new Date());

  const { isLoading, coupons } = useSelector((state) => state.coupon);
  const dispatch = useDispatch();

  const saveCoupon = async (e) => {
    e.preventDefault();
    // console.log(name, discount, expiresAt);
    if (name.length < 6) {
      return toast.error("Coupon must be up to 6 characters");
    }
    if (discount < 1) {
      return toast.error("Discount must be greater than one");
    }

    const formData = {
      name,
      discount,
      expiresAt,
    };
    // console.log(formData);
    dispatch(createCoupon(formData));
    setName("");
    setDiscount(0);

  };

  useEffect(() => {
    dispatch(getCoupons());
  }, [dispatch]);
  return (
<>
  <div className="mb-8">
    <h3 className="text-2xl font-semibold text-gray-800 mb-2">Create Coupon</h3>
    <p className="text-gray-600 mb-4">
      Use the form to <b>Create a Coupon.</b>
    </p>
    <div className="bg-white p-6 rounded-lg shadow-md max-w-md">
      <form onSubmit={saveCoupon} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Coupon Name:
          </label>
          <input
            type="text"
            placeholder="Coupon name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value.toUpperCase())}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
            />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Discount %:
          </label>
          <input
            type="number"
            placeholder="Coupon Discount"
            name="discount"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
            />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Expiry date:
          </label>
          <DatePicker
            selected={expiresAt}
            value={expiresAt}
            onChange={(date) => setExpiresAt(date)}
            required
            className="block w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div className="mt-6">
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition duration-300"
          >
            Save Coupon
          </button>
        </div>
      </form>
    </div>
  </div>
</>

  );
};

export default CreateCoupon;
