import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  deleteCoupon,
  getCoupon,
  getCoupons,
} from "../../../redux/features/coupon/couponSlice";
import { FaTrashAlt } from "react-icons/fa";
import { confirmAlert } from "react-confirm-alert";
import "react-confirm-alert/src/react-confirm-alert.css";

const CouponList = () => {
  const { isLoading, coupons } = useSelector((state) => state.coupon);
  const dispatch = useDispatch();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    dispatch(getCoupons());
    // dispatch(getCoupon("NEW_YEAR"))
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
    <div className="admin-taxonomy-panel">
      <div className="admin-taxonomy-panel-copy">
        <h3 className="admin-taxonomy-panel-title">All Coupons</h3>
        <p className="admin-taxonomy-panel-subtitle">Review active discount codes and expiry dates.</p>
      </div>

      <div className="admin-taxonomy-table-wrap">
        {coupons.length === 0 ? (
          <p className="admin-taxonomy-empty">No coupon found</p>
        ) : (
          <table className="admin-taxonomy-table">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700">
                <th>s/n</th>
                <th>Name</th>
                <th>Discount (%)</th>
                <th>Date Created</th>
                <th>Expiry Date</th>
                <th className="admin-taxonomy-table-head-actions">Action</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon, index) => {
                const { _id, name, discount, expiresAt, createdAt } = coupon;
                const formattedCreatedAt = new Date(createdAt).toLocaleDateString();
                const formattedExpiresAt = new Date(expiresAt).toLocaleDateString();
                return (
                  <tr key={_id}>
                    <td>{index + 1}</td>
                    <td>{name}</td>
                    <td>{discount}% OFF</td>
                    <td>{formattedCreatedAt}</td>
                    <td>{formattedExpiresAt}</td>
                    <td className="admin-taxonomy-action-cell">
                      <button type="button" className="admin-taxonomy-icon-button admin-taxonomy-icon-button--delete" aria-label={`Delete coupon ${name}`} onClick={() => confirmDelete(_id)}>
                        <FaTrashAlt size={16} />
                      </button>
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
