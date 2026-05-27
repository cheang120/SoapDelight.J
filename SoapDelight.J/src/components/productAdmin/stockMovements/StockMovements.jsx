import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import inventoryService from "../inventory/inventoryService";
import "./StockMovements.scss";

const emptyAddForm = {
  productId: "",
  toLocationCode: "CENTRAL",
  quantity: "",
  note: "",
};

const emptyTransferForm = {
  productId: "",
  fromLocationCode: "",
  toLocationCode: "",
  quantity: "",
  note: "",
};

const emptyAdjustForm = {
  productId: "",
  locationCode: "",
  newQuantity: "",
  note: "",
};

const getProductLabel = (product) =>
  `${product?.name || "未命名商品"}${product?.centralSku ? ` (${product.centralSku})` : ""}`;

const StockMovements = () => {
  const [overviewRows, setOverviewRows] = useState([]);
  const [locations, setLocations] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingType, setSavingType] = useState("");

  const [addForm, setAddForm] = useState(emptyAddForm);
  const [transferForm, setTransferForm] = useState(emptyTransferForm);
  const [adjustForm, setAdjustForm] = useState(emptyAdjustForm);

  const activeLocations = useMemo(
    () => locations.filter((location) => location.active !== false),
    [locations]
  );

  const productOptions = useMemo(
    () =>
      overviewRows
        .slice()
        .sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""))),
    [overviewRows]
  );

  const locationNameByCode = useMemo(() => {
    const map = new Map();
    locations.forEach((location) => map.set(location.code, location.name));
    return map;
  }, [locations]);

  const selectedTransferProduct = useMemo(
    () => overviewRows.find((product) => product.productId === transferForm.productId),
    [overviewRows, transferForm.productId]
  );

  const transferSourceAvailableStock = useMemo(() => {
    if (!selectedTransferProduct || !transferForm.fromLocationCode) return null;

    const sourceLocation = selectedTransferProduct.locations?.find(
      (location) => location.locationCode === transferForm.fromLocationCode
    );

    return Number(sourceLocation?.quantity || 0);
  }, [selectedTransferProduct, transferForm.fromLocationCode]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [overview, locationData, movementData] = await Promise.all([
        inventoryService.getInventoryOverview(),
        inventoryService.getLocations(),
        inventoryService.getMovements({ limit: 50 }),
      ]);
      setOverviewRows(Array.isArray(overview) ? overview : []);
      setLocations(Array.isArray(locationData) ? locationData : []);
      setMovements(Array.isArray(movementData) ? movementData : []);
    } catch (error) {
      toast.error(error?.response?.data?.message || "未能載入存貨流動資料");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const updateAddForm = (event) => {
    const { name, value } = event.target;
    setAddForm((prev) => ({ ...prev, [name]: value }));
  };

  const updateTransferForm = (event) => {
    const { name, value } = event.target;
    setTransferForm((prev) => ({ ...prev, [name]: value }));
  };

  const updateAdjustForm = (event) => {
    const { name, value } = event.target;
    setAdjustForm((prev) => ({ ...prev, [name]: value }));
  };

  const validatePositiveQuantity = (quantity) => {
    const number = Number(quantity);
    return Number.isFinite(number) && number > 0;
  };

  const handleAddStock = async (event) => {
    event.preventDefault();

    if (!addForm.productId || !addForm.toLocationCode || !validatePositiveQuantity(addForm.quantity)) {
      toast.error("請選擇商品、地點及正數數量。");
      return;
    }

    setSavingType("add");
    try {
      await inventoryService.createProductionInMovement({
        productId: addForm.productId,
        toLocationCode: addForm.toLocationCode,
        quantity: Number(addForm.quantity),
        note: addForm.note,
      });
      toast.success("入貨已成功記錄");
      setAddForm(emptyAddForm);
      await loadData();
    } catch (error) {
      toast.error(error?.response?.data?.message || "未能新增存貨");
    } finally {
      setSavingType("");
    }
  };

  const handleTransferStock = async (event) => {
    event.preventDefault();

    if (
      !transferForm.productId ||
      !transferForm.fromLocationCode ||
      !transferForm.toLocationCode ||
      !validatePositiveQuantity(transferForm.quantity)
    ) {
      toast.error("請選擇商品、地點及正數數量。");
      return;
    }

    if (transferForm.fromLocationCode === transferForm.toLocationCode) {
      toast.error("來源及目的地點不可相同。");
      return;
    }

    const availableStock = Number(transferSourceAvailableStock ?? 0);
    const requestedQuantity = Number(transferForm.quantity);

    if (availableStock < requestedQuantity) {
      toast.error(`所選來源地點只有 ${availableStock} 件可用存貨。`);
      return;
    }

    setSavingType("transfer");
    try {
      await inventoryService.createTransferMovement({
        productId: transferForm.productId,
        fromLocationCode: transferForm.fromLocationCode,
        toLocationCode: transferForm.toLocationCode,
        quantity: Number(transferForm.quantity),
        note: transferForm.note,
      });
      toast.success("調貨已成功記錄");
      setTransferForm(emptyTransferForm);
      await loadData();
    } catch (error) {
      toast.error(error?.response?.data?.message || "未能完成調貨");
    } finally {
      setSavingType("");
    }
  };

  const handleAdjustStock = async (event) => {
    event.preventDefault();

    if (!adjustForm.productId || !adjustForm.locationCode || adjustForm.newQuantity === "") {
      toast.error("請選擇商品、地點及新數量。");
      return;
    }

    const newQuantity = Number(adjustForm.newQuantity);
    if (!Number.isFinite(newQuantity) || newQuantity < 0) {
      toast.error("新數量必須為 0 或以上。");
      return;
    }

    setSavingType("adjust");
    try {
      await inventoryService.createAdjustmentMovement({
        productId: adjustForm.productId,
        locationCode: adjustForm.locationCode,
        newQuantity,
        note: adjustForm.note,
      });
      toast.success("盤點調整已儲存");
      setAdjustForm(emptyAdjustForm);
      await loadData();
    } catch (error) {
      toast.error(error?.response?.data?.message || "未能儲存盤點調整");
    } finally {
      setSavingType("");
    }
  };

  const renderProductSelect = (name, value, onChange) => (
    <select name={name} value={value} onChange={onChange}>
      <option value="">選擇商品</option>
      {productOptions.map((product) => (
        <option key={product.productId} value={product.productId}>
          {getProductLabel(product)}
        </option>
      ))}
    </select>
  );

  const renderLocationSelect = (name, value, onChange, defaultLabel = "選擇地點") => (
    <select name={name} value={value} onChange={onChange}>
      <option value="">{defaultLabel}</option>
      {activeLocations.map((location) => (
        <option key={location._id} value={location.code}>
          {location.name} ({location.code})
        </option>
      ))}
    </select>
  );

  return (
    <section className="stock-movements">
      <header className="stock-movements__header">
        <div>
          <p className="stock-movements__eyebrow">存貨</p>
          <h2>存貨流動</h2>
          <p>
            記錄入貨、地點之間調貨及盤點調整。存貨流動紀錄不可刪除。
          </p>
        </div>
        <button type="button" onClick={loadData} disabled={loading}>
          {loading ? "重新整理中..." : "重新整理"}
        </button>
      </header>

      <div className="stock-movements__forms">
        <form onSubmit={handleAddStock} className="stock-movements__card">
          <p className="stock-movements__eyebrow">入貨</p>
          <h3>新增存貨到地點</h3>
          <label>
            商品
            {renderProductSelect("productId", addForm.productId, updateAddForm)}
          </label>
          <label>
            目的地點
            {renderLocationSelect("toLocationCode", addForm.toLocationCode, updateAddForm)}
          </label>
          <label>
            數量
            <input name="quantity" type="number" min="1" step="1" value={addForm.quantity} onChange={updateAddForm} />
          </label>
          <label>
            備註
            <textarea name="note" rows="2" value={addForm.note} onChange={updateAddForm} />
          </label>
          <button type="submit" disabled={savingType === "add"}>
            {savingType === "add" ? "新增中..." : "新增存貨"}
          </button>
        </form>

        <form onSubmit={handleTransferStock} className="stock-movements__card">
          <p className="stock-movements__eyebrow">調貨</p>
          <h3>地點之間調貨</h3>
          <label>
            商品
            {renderProductSelect("productId", transferForm.productId, updateTransferForm)}
          </label>
          <label>
            來源地點
            {renderLocationSelect("fromLocationCode", transferForm.fromLocationCode, updateTransferForm)}
          </label>
          {transferForm.productId && transferForm.fromLocationCode && (
            <p className="stock-movements__availability">
              所選來源可用存貨：<strong>{transferSourceAvailableStock ?? 0}</strong>
            </p>
          )}
          <label>
            目的地點
            {renderLocationSelect("toLocationCode", transferForm.toLocationCode, updateTransferForm)}
          </label>
          <label>
            數量
            <input
              name="quantity"
              type="number"
              min="1"
              step="1"
              value={transferForm.quantity}
              onChange={updateTransferForm}
            />
          </label>
          <label>
            備註
            <textarea name="note" rows="2" value={transferForm.note} onChange={updateTransferForm} />
          </label>
          <button type="submit" disabled={savingType === "transfer"}>
            {savingType === "transfer" ? "調貨中..." : "調貨"}
          </button>
        </form>

        <form onSubmit={handleAdjustStock} className="stock-movements__card">
          <p className="stock-movements__eyebrow">盤點調整</p>
          <h3>設定實際存貨數量</h3>
          <label>
            商品
            {renderProductSelect("productId", adjustForm.productId, updateAdjustForm)}
          </label>
          <label>
            地點
            {renderLocationSelect("locationCode", adjustForm.locationCode, updateAdjustForm)}
          </label>
          <label>
            新數量
            <input
              name="newQuantity"
              type="number"
              min="0"
              step="1"
              value={adjustForm.newQuantity}
              onChange={updateAdjustForm}
            />
          </label>
          <label>
            備註
            <textarea name="note" rows="2" value={adjustForm.note} onChange={updateAdjustForm} />
          </label>
          <button type="submit" disabled={savingType === "adjust"}>
            {savingType === "adjust" ? "儲存中..." : "儲存調整"}
          </button>
        </form>
      </div>

      <div className="stock-movements__history">
        <div className="stock-movements__history-head">
          <div>
            <p className="stock-movements__eyebrow">紀錄</p>
            <h3>最新存貨流動</h3>
          </div>
          <p>此處不可刪除或編輯紀錄。如輸入錯誤，請使用盤點調整修正。</p>
        </div>

        {loading ? (
          <p className="stock-movements__empty">正在載入存貨流動...</p>
        ) : movements.length === 0 ? (
          <p className="stock-movements__empty">暫未有存貨流動紀錄。</p>
        ) : (
          <div className="stock-movements__table-wrap">
            <table>
              <thead>
                <tr>
                  <th>日期</th>
                  <th>商品</th>
                  <th>類型</th>
                  <th>來源</th>
                  <th>目的地</th>
                  <th>數量</th>
                  <th>備註</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((movement) => (
                  <tr key={movement._id}>
                    <td>
                      {movement.createdAt
                        ? new Date(movement.createdAt).toLocaleString("en-GB")
                        : "-"}
                    </td>
                    <td>{movement.productId?.name || movement.product?.name || "-"}</td>
                    <td><span className="movement-badge">{movement.type}</span></td>
                    <td>
                      {movement.fromLocationId?.name ||
                        movement.fromLocation?.name ||
                        (movement.fromLocationCode ? locationNameByCode.get(movement.fromLocationCode) : "") ||
                        "-"}
                    </td>
                    <td>
                      {movement.toLocationId?.name ||
                        movement.toLocation?.name ||
                        (movement.toLocationCode ? locationNameByCode.get(movement.toLocationCode) : "") ||
                        "-"}
                    </td>
                    <td>{movement.quantity}</td>
                    <td>{movement.note || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};

export default StockMovements;
