import React, { useEffect, useState } from "react";
import { FaEdit, FaTrashAlt } from "react-icons/fa";
import { toast } from "react-toastify";
import shippingMethodService from "./shippingMethodService";
import "./ShippingMethods.scss";

const initialState = {
  name: "",
  code: "",
  region: "",
  fee: 0,
  currency: "MOP",
  estimatedDeliveryTime: "",
  description: "",
  active: true,
  isPickup: false,
};

const ShippingMethods = () => {
  const [shippingMethods, setShippingMethods] = useState([]);
  const [formData, setFormData] = useState(initialState);
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = Boolean(editingId);

  const loadShippingMethods = async () => {
    setIsLoading(true);
    try {
      const data = await shippingMethodService.getAdminShippingMethods();
      setShippingMethods(Array.isArray(data) ? data : []);
    } catch (error) {
      const message = error.response?.data?.message || error.message || "未能載入送貨方式";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    loadShippingMethods();
  }, []);

  const handleChange = (event) => {
    const { name, value, checked, type } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const resetForm = () => {
    setFormData(initialState);
    setEditingId(null);
  };

  const handleEdit = (method) => {
    setEditingId(method._id);
    setFormData({
      name: method.name || "",
      code: method.code || "",
      region: method.region || "",
      fee: method.fee ?? 0,
      currency: method.currency || "MOP",
      estimatedDeliveryTime: method.estimatedDeliveryTime || "",
      description: method.description || "",
      active: Boolean(method.active),
      isPickup: Boolean(method.isPickup),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const payload = {
      ...formData,
      fee: Number(formData.fee),
      code: formData.code.trim().toUpperCase(),
    };

    setIsSubmitting(true);
    try {
      if (isEditing) {
        await shippingMethodService.updateShippingMethod(editingId, payload);
        toast.success("送貨方式已更新");
      } else {
        await shippingMethodService.createShippingMethod(payload);
        toast.success("送貨方式已建立");
      }
      resetForm();
      await loadShippingMethods();
    } catch (error) {
      const message = error.response?.data?.message || error.message || "未能儲存送貨方式";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (method) => {
    const shouldDelete = window.confirm(`刪除送貨方式「${method.name}」？`);
    if (!shouldDelete) return;

    try {
      await shippingMethodService.deleteShippingMethod(method._id);
      toast.success("送貨方式已刪除");
      await loadShippingMethods();
      if (editingId === method._id) {
        resetForm();
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message || "未能刪除送貨方式";
      toast.error(message);
    }
  };

  return (
    <section className="shipping-methods-page">
      <header className="shipping-methods-header">
        <div className="shipping-methods-copy">
          <p className="shipping-methods-eyebrow">送貨</p>
          <h2 className="shipping-methods-title">送貨方式</h2>
          <p className="shipping-methods-subtitle">
            管理送貨地區、運費及可用送貨選項。
          </p>
        </div>
      </header>

      <div className="shipping-methods-stack">
        <div className="shipping-methods-panel">
          <div className="shipping-methods-panel-copy">
            <h3 className="shipping-methods-panel-title">
              {isEditing ? "編輯送貨方式" : "建立送貨方式"}
            </h3>
            <p className="shipping-methods-panel-subtitle">
              這些送貨方式供目前購物車及結帳流程使用。
            </p>
          </div>

          <form className="shipping-methods-form" onSubmit={handleSubmit}>
            <div className="shipping-methods-field">
              <label className="shipping-methods-label">名稱</label>
              <input
                className="shipping-methods-input"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="郵寄 - 英國"
                required
              />
            </div>

            <div className="shipping-methods-field">
              <label className="shipping-methods-label">代碼</label>
              <input
                className="shipping-methods-input"
                name="code"
                value={formData.code}
                onChange={handleChange}
                placeholder="SHIP_UK"
                required
              />
            </div>

            <div className="shipping-methods-field">
              <label className="shipping-methods-label">地區</label>
              <input
                className="shipping-methods-input"
                name="region"
                value={formData.region}
                onChange={handleChange}
                placeholder="英國"
              />
            </div>

            <div className="shipping-methods-field">
              <label className="shipping-methods-label">運費</label>
              <input
                className="shipping-methods-input"
                type="number"
                min="0"
                name="fee"
                value={formData.fee}
                onChange={handleChange}
                required
              />
            </div>

            <div className="shipping-methods-field">
              <label className="shipping-methods-label">貨幣</label>
              <input
                className="shipping-methods-input"
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                placeholder="MOP"
              />
            </div>

            <div className="shipping-methods-field shipping-methods-field--full">
              <label className="shipping-methods-label">預計送達時間</label>
              <input
                className="shipping-methods-input"
                name="estimatedDeliveryTime"
                value={formData.estimatedDeliveryTime}
                onChange={handleChange}
                placeholder="7-14 個工作天"
              />
            </div>

            <div className="shipping-methods-field shipping-methods-field--full">
              <label className="shipping-methods-label">說明</label>
              <textarea
                className="shipping-methods-input shipping-methods-textarea"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="內部備註或顧客可見的送貨說明"
              />
            </div>

            <div className="shipping-methods-toggle-row shipping-methods-field--full">
              <label className="shipping-methods-checkbox">
                <input
                  type="checkbox"
                  name="active"
                  checked={formData.active}
                  onChange={handleChange}
                />
                <span>啟用</span>
              </label>
              <label className="shipping-methods-checkbox">
                <input
                  type="checkbox"
                  name="isPickup"
                  checked={formData.isPickup}
                  onChange={handleChange}
                />
                <span>自取方式</span>
              </label>
            </div>

            <div className="shipping-methods-actions shipping-methods-field--full">
              <button type="submit" className="shipping-methods-button" disabled={isSubmitting}>
                {isSubmitting ? "儲存中..." : isEditing ? "更新方式" : "儲存方式"}
              </button>
              {isEditing && (
                <button type="button" className="shipping-methods-button shipping-methods-button--secondary" onClick={resetForm}>
                  取消編輯
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="shipping-methods-panel">
          <div className="shipping-methods-panel-copy">
            <h3 className="shipping-methods-panel-title">所有送貨方式</h3>
            <p className="shipping-methods-panel-subtitle">
              查看送貨地區、運費設定及啟用狀態。
            </p>
          </div>

          <div className="shipping-methods-table-wrap">
            {isLoading ? (
              <p className="shipping-methods-empty">正在載入送貨方式...</p>
            ) : shippingMethods.length === 0 ? (
              <p className="shipping-methods-empty">暫未有送貨方式</p>
            ) : (
              <table className="shipping-methods-table">
                <thead>
                  <tr>
                    <th>名稱</th>
                    <th>地區</th>
                    <th>運費</th>
                    <th>啟用</th>
                    <th>自取</th>
                    <th className="shipping-methods-table-head-actions">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {shippingMethods.map((method) => (
                    <tr key={method._id}>
                      <td>
                        <div className="shipping-methods-name">
                          <strong>{method.name}</strong>
                          <span>{method.code}</span>
                        </div>
                      </td>
                      <td>{method.region || "-"}</td>
                      <td>
                        {method.currency || "MOP"} ${Number(method.fee || 0).toFixed(2)}
                      </td>
                      <td>
                        <span className={`shipping-methods-badge ${method.active ? "is-active" : "is-muted"}`}>
                          {method.active ? "啟用" : "停用"}
                        </span>
                      </td>
                      <td>{method.isPickup ? "是" : "否"}</td>
                      <td className="shipping-methods-action-cell">
                        <button
                          type="button"
                          className="shipping-methods-icon-button"
                          aria-label={`編輯送貨方式 ${method.name}`}
                          onClick={() => handleEdit(method)}
                        >
                          <FaEdit size={15} />
                        </button>
                        <button
                          type="button"
                          className="shipping-methods-icon-button shipping-methods-icon-button--delete"
                          aria-label={`刪除送貨方式 ${method.name}`}
                          onClick={() => handleDelete(method)}
                        >
                          <FaTrashAlt size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ShippingMethods;
