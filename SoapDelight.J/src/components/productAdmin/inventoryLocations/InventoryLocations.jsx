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
  { value: "central", label: "中央存貨" },
  { value: "online", label: "網店可售存貨" },
  { value: "consignment", label: "寄賣點" },
  { value: "other", label: "其他" },
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
      toast.error(error?.response?.data?.message || "未能載入存貨地點");
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
      toast.success("已確認預設存貨地點");
      await loadLocations();
    } catch (error) {
      toast.error(error?.response?.data?.message || "未能確認預設存貨地點");
    } finally {
      setEnsuring(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim() || !form.code.trim()) {
      toast.error("請填寫地點名稱及系統代碼");
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
        toast.success("存貨地點已更新");
      } else {
        await inventoryService.createLocation(payload);
        toast.success("存貨地點已建立");
      }

      resetForm();
      await loadLocations();
    } catch (error) {
      toast.error(error?.response?.data?.message || "未能儲存存貨地點");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="inventory-locations">
      <header className="inventory-locations__header">
        <div>
          <p className="inventory-locations__eyebrow">存貨</p>
          <h2>存貨地點</h2>
          <p>
            管理中央存貨、網店存貨及寄賣點。地點一經用於存貨紀錄後不可刪除，請改為停用。
          </p>
        </div>

        <button type="button" onClick={handleEnsureDefaults} disabled={ensuring}>
          {ensuring ? "確認中..." : "確認預設地點"}
        </button>
      </header>

      <div className="inventory-locations__grid">
        <form className="inventory-locations__form" onSubmit={handleSubmit}>
          <div>
            <p className="inventory-locations__eyebrow">
              {editingId ? "編輯地點" : "新增地點"}
            </p>
            <h3>{editingId ? "編輯存貨地點" : "建立存貨地點"}</h3>
          </div>

          <label>
            地點名稱
            <input name="name" value={form.name} onChange={handleChange} placeholder="澳門浸信書局" />
          </label>

          <label>
            系統代碼
            <input name="code" value={form.code} onChange={handleChange} placeholder="MACAU_BAPTIST" />
          </label>

          <label>
            類型
            <select name="type" value={form.type} onChange={handleChange}>
              {typeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            佣金率
            <span className="inventory-locations__hint">只供內部參考</span>
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
            聯絡人
            <input name="contactPerson" value={form.contactPerson} onChange={handleChange} />
          </label>

          <label>
            電話
            <input name="phone" value={form.phone} onChange={handleChange} />
          </label>

          <label className="inventory-locations__full">
            地址
            <textarea name="address" rows="2" value={form.address} onChange={handleChange} />
          </label>

          <label className="inventory-locations__full">
            備註
            <textarea name="notes" rows="3" value={form.notes} onChange={handleChange} />
          </label>

          <label className="inventory-locations__check">
            <input name="active" type="checkbox" checked={form.active} onChange={handleChange} />
            啟用
          </label>

          <div className="inventory-locations__actions">
            {editingId && (
              <button type="button" className="secondary" onClick={resetForm}>
                取消
              </button>
            )}
            <button type="submit" disabled={saving}>
              {saving ? "儲存中..." : editingId ? "儲存更改" : "建立地點"}
            </button>
          </div>
        </form>

        <div className="inventory-locations__table-card">
          <div className="inventory-locations__table-head">
            <div>
              <p className="inventory-locations__eyebrow">地點列表</p>
              <h3>{sortedLocations.length} 個地點</h3>
            </div>
            <p>已有存貨紀錄的地點不可刪除，請改為停用。</p>
          </div>

          {loading ? (
            <p className="inventory-locations__empty">正在載入存貨地點...</p>
          ) : sortedLocations.length === 0 ? (
            <p className="inventory-locations__empty">
              暫未有存貨地點。請使用「確認預設地點」建立核心紀錄。
            </p>
          ) : (
            <div className="inventory-locations__table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>名稱</th>
                    <th>代碼</th>
                    <th>類型</th>
                    <th>佣金</th>
                    <th>聯絡人</th>
                    <th>電話</th>
                    <th>狀態</th>
                    <th>備註</th>
                    <th>操作</th>
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
                          {location.active === false ? "停用" : "啟用"}
                        </span>
                      </td>
                      <td>{location.notes || "-"}</td>
                      <td>
                        <button type="button" className="link-button" onClick={() => handleEdit(location)}>
                          編輯
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
