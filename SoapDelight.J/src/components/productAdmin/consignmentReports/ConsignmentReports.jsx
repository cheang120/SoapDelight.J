import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import inventoryService from "../inventory/inventoryService";
import consignmentReportService from "./consignmentReportService";
import "./ConsignmentReports.scss";

const emptyItemRow = {
  productId: "",
  quantitySold: 1,
  publicUnitPriceAtSale: "",
  discountRate: 0,
  commissionRateAtSale: "",
  promotionNote: "",
  note: "",
};

const money = (value) => `$${Number(value || 0).toFixed(2)}`;

const ConsignmentReports = () => {
  const [itemRows, setItemRows] = useState([{ ...emptyItemRow }]);
  const [locations, setLocations] = useState([]);
  const [products, setProducts] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);

  const productOptions = useMemo(
    () =>
      products
        .slice()
        .sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""))),
    [products]
  );

  const productById = useMemo(() => {
    const map = new Map();
    products.forEach((product) => map.set(product.productId, product));
    return map;
  }, [products]);

  const itemPreviewRows = useMemo(
    () =>
      itemRows.map((row) => {
        const product = productById.get(row.productId);
        const quantity = Number(row.quantitySold || 0);
        const unitPrice = Number(row.publicUnitPriceAtSale || product?.price || 0);
        const discountRate = Number(row.discountRate || 0);
        const commissionRate = Number(row.commissionRateAtSale || product?.macauBaptistCommissionRate || 0);

        const grossAmount = quantity * unitPrice;
        const discountAmount = grossAmount * (discountRate / 100);
        const afterDiscount = grossAmount - discountAmount;
        const commissionAmount = afterDiscount * (commissionRate / 100);
        const netPayable = afterDiscount - commissionAmount;

        return {
          grossAmount,
          discountAmount,
          commissionAmount,
          netPayable,
        };
      }),
    [itemRows, productById]
  );

  const previewTotals = useMemo(
    () =>
      itemPreviewRows.reduce(
        (total, row) => ({
          grossAmount: total.grossAmount + row.grossAmount,
          discountAmount: total.discountAmount + row.discountAmount,
          commissionAmount: total.commissionAmount + row.commissionAmount,
          netPayable: total.netPayable + row.netPayable,
        }),
        { grossAmount: 0, discountAmount: 0, commissionAmount: 0, netPayable: 0 }
      ),
    [itemPreviewRows]
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const [locationData, productData, reportData] = await Promise.all([
        inventoryService.getLocations(),
        inventoryService.getInventoryOverview(),
        consignmentReportService.getConsignmentReports(),
      ]);

      setLocations(Array.isArray(locationData) ? locationData : []);
      setProducts(Array.isArray(productData) ? productData : []);
      setReports(Array.isArray(reportData) ? reportData : []);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not load consignment reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleItemChange = (index, field, value) => {
    setItemRows((prev) =>
      prev.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: value } : row
      )
    );
  };

  const addItemRow = () => {
    setItemRows((prev) => [...prev, { ...emptyItemRow }]);
  };

  const removeItemRow = (index) => {
    setItemRows((prev) =>
      prev.length === 1 ? prev : prev.filter((_, rowIndex) => rowIndex !== index)
    );
  };

  return (
    <section className="consignment-reports">
      <header className="consignment-reports__header">
        <div>
          <p className="consignment-reports__eyebrow">Consignment</p>
          <h2>Consignment Sales Reports / 寄賣銷售回報</h2>
          <p>PDF and invoice generation will be added later after you provide the document style.</p>
        </div>

        <button type="button" onClick={loadData} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </header>

      <div className="consignment-reports__card">
        <p>Consignment locations: {locations.filter((item) => item.type === "consignment").length}</p>
        <p>Products loaded: {products.length}</p>
        <p>Reports loaded: {reports.length}</p>
      </div>

      <div className="consignment-reports__card">
        <h3>Sales item rows / 銷售項目</h3>
        <p>Each row can use its own discount and commission. Saving will be added in the next step.</p>

        <div className="consignment-reports__items">
          {itemRows.map((row, index) => (
            <div className="consignment-reports__item" key={index}>
              <label>
                Product
                <select
                  value={row.productId}
                  onChange={(event) => handleItemChange(index, "productId", event.target.value)}
                >
                  <option value="">Select product</option>
                  {productOptions.map((product) => (
                    <option key={product.productId} value={product.productId}>
                      {product.name} {product.centralSku ? `(${product.centralSku})` : ""}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Qty
                <input
                  type="number"
                  min="1"
                  value={row.quantitySold}
                  onChange={(event) => handleItemChange(index, "quantitySold", event.target.value)}
                />
              </label>

              <label>
                Unit price
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={row.publicUnitPriceAtSale}
                  onChange={(event) => handleItemChange(index, "publicUnitPriceAtSale", event.target.value)}
                />
              </label>

              <label>
                Discount %
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={row.discountRate}
                  onChange={(event) => handleItemChange(index, "discountRate", event.target.value)}
                />
              </label>

              <label>
                Commission %
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={row.commissionRateAtSale}
                  onChange={(event) => handleItemChange(index, "commissionRateAtSale", event.target.value)}
                  placeholder="Use product/location default"
                />
              </label>

              <label>
                Promotion note
                <input
                  value={row.promotionNote}
                  onChange={(event) => handleItemChange(index, "promotionNote", event.target.value)}
                  placeholder="Second item half price"
                />
              </label>

              <div className="consignment-reports__preview">
                <span>Gross: {money(itemPreviewRows[index]?.grossAmount)}</span>
                <span>Discount: {money(itemPreviewRows[index]?.discountAmount)}</span>
                <span>Commission: {money(itemPreviewRows[index]?.commissionAmount)}</span>
                <strong>Net: {money(itemPreviewRows[index]?.netPayable)}</strong>
              </div>

              <button type="button" onClick={() => removeItemRow(index)} disabled={itemRows.length === 1}>
                Remove
              </button>
            </div>
          ))}
        </div>

        <div className="consignment-reports__totals">
          <span>Gross total: {money(previewTotals.grossAmount)}</span>
          <span>Discount total: {money(previewTotals.discountAmount)}</span>
          <span>Commission total: {money(previewTotals.commissionAmount)}</span>
          <strong>Net payable: {money(previewTotals.netPayable)}</strong>
        </div>

        <button type="button" onClick={addItemRow}>
          Add item row
        </button>
      </div>
    </section>
  );
};

export default ConsignmentReports;
