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

const isCouponActive = (expiresAt) =>
  Number(new Date(expiresAt).getTime()) > Date.now();

const statusMeta = (active) =>
  active
    ? {
        label: "有效",
        className: "admin-taxonomy-status-badge admin-taxonomy-status-badge--active",
      }
    : {
        label: "已過期",
        className: "admin-taxonomy-status-badge admin-taxonomy-status-badge--expired",
      };

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
      title: "刪除優惠券",
      message: "確定要刪除此優惠券嗎？",
      buttons: [
        {
          label: "刪除",
          onClick: () => delCoupon(id),
        },
        {
          label: "取消",
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
        <h3 className="admin-taxonomy-panel-title">所有優惠券</h3>
        <p className="admin-taxonomy-panel-subtitle">查看有效優惠碼及到期日。</p>
      </div>

      <div className="admin-taxonomy-table-wrap">
        {coupons.length === 0 ? (
          <p className="admin-taxonomy-empty">暫未有優惠券</p>
        ) : (
          <table className="admin-taxonomy-table">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700">
                <th>序號</th>
                <th>名稱</th>
                <th>折扣 (%)</th>
                <th>建立日期</th>
                <th>到期日</th>
                <th>狀態</th>
                <th className="admin-taxonomy-table-head-actions">操作</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon, index) => {
                const { _id, name, discount, expiresAt, createdAt } = coupon;
                const formattedCreatedAt = new Date(createdAt).toLocaleDateString();
                const formattedExpiresAt = new Date(expiresAt).toLocaleDateString();
                const active = isCouponActive(expiresAt);
                const badge = statusMeta(active);
                return (
                  <tr
                    key={_id}
                    className={`admin-taxonomy-row ${
                      active ? "" : "admin-taxonomy-row--expired"
                    }`}
                  >
                    <td>{index + 1}</td>
                    <td>{name}</td>
                    <td>{discount}% 折扣</td>
                    <td>{formattedCreatedAt}</td>
                    <td>{formattedExpiresAt}</td>
                    <td>
                      <span className={badge.className}>{badge.label}</span>
                    </td>
                    <td className="admin-taxonomy-action-cell">
                      <button type="button" className="admin-taxonomy-icon-button admin-taxonomy-icon-button--delete" aria-label={`刪除優惠券 ${name}`} onClick={() => confirmDelete(_id)}>
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
