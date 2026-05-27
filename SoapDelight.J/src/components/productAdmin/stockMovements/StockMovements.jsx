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
  `${product?.name || "Unnamed product"}${product?.centralSku ? ` (${product.centralSku})` : ""}`;

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
      toast.error(error?.response?.data?.message || "Could not load stock movement data");
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
      toast.error("Please select product, location and a positive quantity.");
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
      toast.success("Stock added successfully");
      setAddForm(emptyAddForm);
      await loadData();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not add stock");
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
      toast.error("Please select product, locations and a positive quantity.");
      return;
    }

    if (transferForm.fromLocationCode === transferForm.toLocationCode) {
      toast.error("From and To locations cannot be the same.");
      return;
    }

    const availableStock = Number(transferSourceAvailableStock ?? 0);
    const requestedQuantity = Number(transferForm.quantity);

    if (availableStock < requestedQuantity) {
      toast.error(`Only ${availableStock} available at selected source location.`);
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
      toast.success("Stock transferred successfully");
      setTransferForm(emptyTransferForm);
      await loadData();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not transfer stock");
    } finally {
      setSavingType("");
    }
  };

  const handleAdjustStock = async (event) => {
    event.preventDefault();

    if (!adjustForm.productId || !adjustForm.locationCode || adjustForm.newQuantity === "") {
      toast.error("Please select product, location and new quantity.");
      return;
    }

    const newQuantity = Number(adjustForm.newQuantity);
    if (!Number.isFinite(newQuantity) || newQuantity < 0) {
      toast.error("New quantity must be zero or greater.");
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
      toast.success("Stock adjusted successfully");
      setAdjustForm(emptyAdjustForm);
      await loadData();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not adjust stock");
    } finally {
      setSavingType("");
    }
  };

  const renderProductSelect = (name, value, onChange) => (
    <select name={name} value={value} onChange={onChange}>
      <option value="">Select product</option>
      {productOptions.map((product) => (
        <option key={product.productId} value={product.productId}>
          {getProductLabel(product)}
        </option>
      ))}
    </select>
  );

  const renderLocationSelect = (name, value, onChange, defaultLabel = "Select location") => (
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
          <p className="stock-movements__eyebrow">Inventory</p>
          <h2>Stock Movements / 存貨流動</h2>
          <p>
            Add stock, transfer stock between locations, and record stock count adjustments.
            Movements cannot be deleted.
          </p>
        </div>
        <button type="button" onClick={loadData} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </header>

      <div className="stock-movements__forms">
        <form onSubmit={handleAddStock} className="stock-movements__card">
          <p className="stock-movements__eyebrow">Add stock / 入貨</p>
          <h3>Add stock to location</h3>
          <label>
            Product
            {renderProductSelect("productId", addForm.productId, updateAddForm)}
          </label>
          <label>
            To location
            {renderLocationSelect("toLocationCode", addForm.toLocationCode, updateAddForm)}
          </label>
          <label>
            Quantity
            <input name="quantity" type="number" min="1" step="1" value={addForm.quantity} onChange={updateAddForm} />
          </label>
          <label>
            Note
            <textarea name="note" rows="2" value={addForm.note} onChange={updateAddForm} />
          </label>
          <button type="submit" disabled={savingType === "add"}>
            {savingType === "add" ? "Adding..." : "Add stock"}
          </button>
        </form>

        <form onSubmit={handleTransferStock} className="stock-movements__card">
          <p className="stock-movements__eyebrow">Transfer / 調貨</p>
          <h3>Transfer between locations</h3>
          <label>
            Product
            {renderProductSelect("productId", transferForm.productId, updateTransferForm)}
          </label>
          <label>
            From location
            {renderLocationSelect("fromLocationCode", transferForm.fromLocationCode, updateTransferForm)}
          </label>
          {transferForm.productId && transferForm.fromLocationCode && (
            <p className="stock-movements__availability">
              Available at selected source: <strong>{transferSourceAvailableStock ?? 0}</strong>
            </p>
          )}
          <label>
            To location
            {renderLocationSelect("toLocationCode", transferForm.toLocationCode, updateTransferForm)}
          </label>
          <label>
            Quantity
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
            Note
            <textarea name="note" rows="2" value={transferForm.note} onChange={updateTransferForm} />
          </label>
          <button type="submit" disabled={savingType === "transfer"}>
            {savingType === "transfer" ? "Transferring..." : "Transfer stock"}
          </button>
        </form>

        <form onSubmit={handleAdjustStock} className="stock-movements__card">
          <p className="stock-movements__eyebrow">Adjustment / 盤點調整</p>
          <h3>Set actual stock count</h3>
          <label>
            Product
            {renderProductSelect("productId", adjustForm.productId, updateAdjustForm)}
          </label>
          <label>
            Location
            {renderLocationSelect("locationCode", adjustForm.locationCode, updateAdjustForm)}
          </label>
          <label>
            New quantity
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
            Note
            <textarea name="note" rows="2" value={adjustForm.note} onChange={updateAdjustForm} />
          </label>
          <button type="submit" disabled={savingType === "adjust"}>
            {savingType === "adjust" ? "Saving..." : "Save adjustment"}
          </button>
        </form>
      </div>

      <div className="stock-movements__history">
        <div className="stock-movements__history-head">
          <div>
            <p className="stock-movements__eyebrow">History</p>
            <h3>Latest movements</h3>
          </div>
          <p>No delete or edit action is available. Use adjustment if a movement was entered incorrectly.</p>
        </div>

        {loading ? (
          <p className="stock-movements__empty">Loading movements...</p>
        ) : movements.length === 0 ? (
          <p className="stock-movements__empty">No stock movements yet.</p>
        ) : (
          <div className="stock-movements__table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Product</th>
                  <th>Type</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Qty</th>
                  <th>Note</th>
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
