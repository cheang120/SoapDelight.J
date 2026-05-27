import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import inventoryService from "../inventory/inventoryService";
import "./InventoryLocations.scss";

const emptyForm = {
  name: "",
  code: "",
  type: "consignment",
  commissionRate: 0,
  contactPerson: "",
  phone: "",
  address: "",
  notes: "",
  active: true,
};

const typeOptions = [
  { value: "central", label: "Central / 中央存貨" },
  { value: "online", label: "Online / 網店可售" },
  { value: "consignment", label: "Consignment / 寄賣點" },
  { value: "other", label: "Other / 其他" },
];

const InventoryLocations = () => {
  const [locations, setLocations] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [ensuring, setEnsuring] = useState(false);

  const sortedLocations = useMemo(
    () =>
      Array.isArray(locations)
        ? locations
            .slice()
            .sort((a, b) => `${a.type}-${a.name}`.localeCompare(`${b.type}-${b.name}`))
        : [],
    [locations]
  );

  const loadLocations = async () => {
    setLoading(true);
    try {
      const data = await inventoryService.getLocations();
      setLocations(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not load inventory locations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLocations();
  }, []);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId("");
  };

  const handleEdit = (location) => {
    setEditingId(location._id);
    setForm({
      name: location.name || "",
      code: location.code || "",
      type: location.type || "consignment",
      commissionRate: Number(location.commissionRate || 0),
      contactPerson: location.contactPerson || "",
      phone: location.phone || "",
      address: location.address || "",
      notes: location.notes || "",
      active: location.active !== false,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleEnsureDefaults = async () => {
    setEnsuring(true);
    try {
      await inventoryService.ensureDefaultLocations();
      toast.success("Default inventory locations ensured");
      await loadLocations();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not ensure default locations");
    } finally {
      setEnsuring(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim() || !form.code.trim()) {
      toast.error("Location name and code are required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        code: form.code.trim().toUpperCase(),
        commissionRate: Number(form.commissionRate || 0),
      };

      if (editingId) {
        await inventoryService.updateLocation(editingId, payload);
        toast.success("Inventory location updated");
      } else {
        await inventoryService.createLocation(payload);
        toast.success("Inventory location created");
      }

      resetForm();
      await loadLocations();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not save inventory location");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="inventory-locations">
      <header className="inventory-locations__header">
        <div>
          <p className="inventory-locations__eyebrow">Inventory</p>
          <h2>Inventory Locations / 存貨地點</h2>
          <p>
            Manage central stock, online stock and consignment locations. Locations are not
            deleted after use; set inactive instead.
          </p>
        </div>

        <button type="button" onClick={handleEnsureDefaults} disabled={ensuring}>
          {ensuring ? "Ensuring..." : "Ensure default locations"}
        </button>
      </header>

      <div className="inventory-locations__grid">
        <form className="inventory-locations__form" onSubmit={handleSubmit}>
          <div>
            <p className="inventory-locations__eyebrow">
              {editingId ? "Edit location" : "New location"}
            </p>
            <h3>{editingId ? "Edit inventory location" : "Create inventory location"}</h3>
          </div>

          <label>
            Name / 地點名稱
            <input name="name" value={form.name} onChange={handleChange} placeholder="Macau Baptist Bookstore" />
          </label>

          <label>
            Code / 系統代碼
            <input name="code" value={form.code} onChange={handleChange} placeholder="MACAU_BAPTIST" />
          </label>

          <label>
            Type / 類型
            <select name="type" value={form.type} onChange={handleChange}>
              {typeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Commission rate / 佣金率
            <span className="inventory-locations__hint">Internal only / 只供內部參考</span>
            <input
              name="commissionRate"
              type="number"
              min="0"
              step="0.01"
              value={form.commissionRate}
              onChange={handleChange}
            />
          </label>

          <label>
            Contact person / 聯絡人
            <input name="contactPerson" value={form.contactPerson} onChange={handleChange} />
          </label>

          <label>
            Phone / 電話
            <input name="phone" value={form.phone} onChange={handleChange} />
          </label>

          <label className="inventory-locations__full">
            Address / 地址
            <textarea name="address" rows="2" value={form.address} onChange={handleChange} />
          </label>

          <label className="inventory-locations__full">
            Notes / 備註
            <textarea name="notes" rows="3" value={form.notes} onChange={handleChange} />
          </label>

          <label className="inventory-locations__check">
            <input name="active" type="checkbox" checked={form.active} onChange={handleChange} />
            Active / 啟用
          </label>

          <div className="inventory-locations__actions">
            {editingId && (
              <button type="button" className="secondary" onClick={resetForm}>
                Cancel
              </button>
            )}
            <button type="submit" disabled={saving}>
              {saving ? "Saving..." : editingId ? "Save changes" : "Create location"}
            </button>
          </div>
        </form>

        <div className="inventory-locations__table-card">
          <div className="inventory-locations__table-head">
            <div>
              <p className="inventory-locations__eyebrow">Locations</p>
              <h3>{sortedLocations.length} locations</h3>
            </div>
            <p>Set inactive instead of deleting a location once inventory records exist.</p>
          </div>

          {loading ? (
            <p className="inventory-locations__empty">Loading locations...</p>
          ) : sortedLocations.length === 0 ? (
            <p className="inventory-locations__empty">
              No inventory locations yet. Use “Ensure default locations” to create the core records.
            </p>
          ) : (
            <div className="inventory-locations__table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Code</th>
                    <th>Type</th>
                    <th>Commission</th>
                    <th>Contact</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Notes</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedLocations.map((location) => (
                    <tr key={location._id} className={location.active === false ? "is-inactive" : ""}>
                      <td>{location.name}</td>
                      <td><code>{location.code}</code></td>
                      <td>{location.type}</td>
                      <td>{Number(location.commissionRate || 0)}%</td>
                      <td>{location.contactPerson || "-"}</td>
                      <td>{location.phone || "-"}</td>
                      <td>
                        <span className={location.active === false ? "badge badge--muted" : "badge badge--active"}>
                          {location.active === false ? "Inactive" : "Active"}
                        </span>
                      </td>
                      <td>{location.notes || "-"}</td>
                      <td>
                        <button type="button" className="link-button" onClick={() => handleEdit(location)}>
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default InventoryLocations;
