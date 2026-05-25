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
      const message = error.response?.data?.message || error.message || "Unable to load shipping methods";
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
        toast.success("Shipping method updated");
      } else {
        await shippingMethodService.createShippingMethod(payload);
        toast.success("Shipping method created");
      }
      resetForm();
      await loadShippingMethods();
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Unable to save shipping method";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (method) => {
    const shouldDelete = window.confirm(`Delete shipping method "${method.name}"?`);
    if (!shouldDelete) return;

    try {
      await shippingMethodService.deleteShippingMethod(method._id);
      toast.success("Shipping method deleted");
      await loadShippingMethods();
      if (editingId === method._id) {
        resetForm();
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Unable to delete shipping method";
      toast.error(message);
    }
  };

  return (
    <section className="shipping-methods-page">
      <header className="shipping-methods-header">
        <div className="shipping-methods-copy">
          <p className="shipping-methods-eyebrow">SHIPPING</p>
          <h2 className="shipping-methods-title">Shipping Methods</h2>
          <p className="shipping-methods-subtitle">
            Manage delivery regions, fees and active shipping options.
          </p>
        </div>
      </header>

      <div className="shipping-methods-stack">
        <div className="shipping-methods-panel">
          <div className="shipping-methods-panel-copy">
            <h3 className="shipping-methods-panel-title">
              {isEditing ? "Edit Shipping Method" : "Create Shipping Method"}
            </h3>
            <p className="shipping-methods-panel-subtitle">
              These methods are ready for the future delivery flow. Cart and checkout still use the existing Shipping products for now.
            </p>
          </div>

          <form className="shipping-methods-form" onSubmit={handleSubmit}>
            <div className="shipping-methods-field">
              <label className="shipping-methods-label">Name</label>
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
              <label className="shipping-methods-label">Code</label>
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
              <label className="shipping-methods-label">Region</label>
              <input
                className="shipping-methods-input"
                name="region"
                value={formData.region}
                onChange={handleChange}
                placeholder="United Kingdom"
              />
            </div>

            <div className="shipping-methods-field">
              <label className="shipping-methods-label">Fee</label>
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
              <label className="shipping-methods-label">Currency</label>
              <input
                className="shipping-methods-input"
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                placeholder="MOP"
              />
            </div>

            <div className="shipping-methods-field shipping-methods-field--full">
              <label className="shipping-methods-label">Estimated delivery time</label>
              <input
                className="shipping-methods-input"
                name="estimatedDeliveryTime"
                value={formData.estimatedDeliveryTime}
                onChange={handleChange}
                placeholder="7-14 business days"
              />
            </div>

            <div className="shipping-methods-field shipping-methods-field--full">
              <label className="shipping-methods-label">Description</label>
              <textarea
                className="shipping-methods-input shipping-methods-textarea"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Internal notes or customer-facing delivery description"
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
                <span>Active</span>
              </label>
              <label className="shipping-methods-checkbox">
                <input
                  type="checkbox"
                  name="isPickup"
                  checked={formData.isPickup}
                  onChange={handleChange}
                />
                <span>Is pickup</span>
              </label>
            </div>

            <div className="shipping-methods-actions shipping-methods-field--full">
              <button type="submit" className="shipping-methods-button" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : isEditing ? "Update Method" : "Save Method"}
              </button>
              {isEditing && (
                <button type="button" className="shipping-methods-button shipping-methods-button--secondary" onClick={resetForm}>
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="shipping-methods-panel">
          <div className="shipping-methods-panel-copy">
            <h3 className="shipping-methods-panel-title">All Shipping Methods</h3>
            <p className="shipping-methods-panel-subtitle">
              Review delivery regions, fee settings and availability.
            </p>
          </div>

          <div className="shipping-methods-table-wrap">
            {isLoading ? (
              <p className="shipping-methods-empty">Loading shipping methods...</p>
            ) : shippingMethods.length === 0 ? (
              <p className="shipping-methods-empty">No shipping methods found</p>
            ) : (
              <table className="shipping-methods-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Region</th>
                    <th>Fee</th>
                    <th>Active</th>
                    <th>Pickup</th>
                    <th className="shipping-methods-table-head-actions">Actions</th>
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
                          {method.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>{method.isPickup ? "Yes" : "No"}</td>
                      <td className="shipping-methods-action-cell">
                        <button
                          type="button"
                          className="shipping-methods-icon-button"
                          aria-label={`Edit shipping method ${method.name}`}
                          onClick={() => handleEdit(method)}
                        >
                          <FaEdit size={15} />
                        </button>
                        <button
                          type="button"
                          className="shipping-methods-icon-button shipping-methods-icon-button--delete"
                          aria-label={`Delete shipping method ${method.name}`}
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
