import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  deleteCoupon,
  getCoupons,
} from "../../../redux/features/coupon/couponSlice";
import { FaTrashAlt } from "react-icons/fa";
import { confirmAlert } from "react-confirm-alert";
import "react-confirm-alert/src/react-confirm-alert.css";

const CouponList = () => {
  const { isLoading, coupons } = useSelector((state) => state.coupon);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getCoupons());
  }, [dispatch]);
  // console.log(coupons.length);

  const confirmDelete = (id) => {
    confirmAlert({
      title: "Delete Coupon",
      message: "Are you sure you want to delete this coupon.",
      buttons: [
        {
          label: "Delete",
          onClick: () => delCoupon(id),
        },
        {
          label: "Cancel",
          // onClick: () => alert('Click No')
        },
      ],
    });
  };

  const delCoupon = async (id) => {
    await dispatch(deleteCoupon(id));
    await dispatch(getCoupons());
  };
  

  return (
    
<div className="p-6 bg-white shadow-md rounded-lg overflow-x-auto">
<div className="border-b-2 border-gray-300 my-4"></div>

  <h3 className="text-xl font-semibold mb-4">All Coupons</h3>

  <div>
    {coupons.length === 0 ? (
      <p className="text-gray-600">No coupon found</p>
    ) : (
      <table className="min-w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">s/n</th>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Name</th>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Discount (%)</th>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Date Created</th>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Expiry Date</th>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Action</th>
          </tr>
        </thead>
        <tbody>
          {coupons.map((coupon, index) => {
            const { _id, name, discount, expiresAt, createdAt } = coupon;
            const formattedCreatedAt = new Date(createdAt).toLocaleDateString();
            const formattedExpiresAt = new Date(expiresAt).toLocaleDateString();
            return (
              <tr key={_id} className="border-b">
                <td className="px-4 py-2 text-sm text-gray-700">{index + 1}</td>
                <td className="px-4 py-2 text-sm text-gray-700">{name}</td>
                <td className="px-4 py-2 text-sm text-gray-700">{discount}% OFF</td>
                <td className="px-4 py-2 text-sm text-gray-700">{formattedCreatedAt}</td>
                <td className="px-4 py-2 text-sm text-gray-700">{formattedExpiresAt}</td>
                <td className="px-4 py-2 text-sm text-gray-700">
                  <span className="cursor-pointer">
                    <FaTrashAlt
                      size={20}
                      color={"red"}
                      onClick={() => confirmDelete(_id)}
                    />
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    )}
  </div>
</div>
  );
};

export default CouponList;