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

const getReportProductSummary = (report) => {
  const items = Array.isArray(report?.items) ? report.items : [];

  if (items.length === 0) return "-";

  const names = items
    .map((item) => item.locationProductNameAtSale || item.productNameAtSale || "Product")
    .filter(Boolean);

  const uniqueNames = [...new Set(names)];
  const summary = uniqueNames.slice(0, 3).join(", ");

  return uniqueNames.length > 3 ? `${summary} +${uniqueNames.length - 3} more` : summary;
};

const ConsignmentReports = () => {
  const [itemRows, setItemRows] = useState([{ ...emptyItemRow }]);
  const [locations, setLocations] = useState([]);
  const [products, setProducts] = useState([]);
  const [reports, setReports] = useState([]);
  const [reportForm, setReportForm] = useState({
    locationCode: "",
    periodStart: "",
    sourceDocument: "",
    note: "",
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmingId, setConfirmingId] = useState("");

  const consignmentLocations = useMemo(
    () => locations.filter((location) => location.type === "consignment" && location.active !== false),
    [locations]
  );

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

  const handleReportFormChange = (event) => {
    const { name, value } = event.target;
    setReportForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveDraft = async () => {
    if (!reportForm.locationCode) {
      toast.error("Please select a consignment location.");
      return;
    }

    const validItems = itemRows
      .filter((row) => row.productId && Number(row.quantitySold) > 0)
      .map((row) => {
        const item = {
          productId: row.productId,
          quantitySold: Number(row.quantitySold),
          discountRate: Number(row.discountRate || 0),
          promotionNote: row.promotionNote,
          note: row.note,
        };

        if (row.publicUnitPriceAtSale !== "") {
          item.publicUnitPriceAtSale = Number(row.publicUnitPriceAtSale);
        }

        if (row.commissionRateAtSale !== "") {
          item.commissionRateAtSale = Number(row.commissionRateAtSale);
        }

        return item;
      });

    if (validItems.length === 0) {
      toast.error("Please add at least one valid sales item.");
      return;
    }

    setSaving(true);
    try {
      await consignmentReportService.createConsignmentReport({
        locationCode: reportForm.locationCode,
        periodStart: reportForm.periodStart || undefined,
        sourceDocument: reportForm.sourceDocument,
        note: reportForm.note,
        items: validItems,
      });

      toast.success("Consignment report draft saved.");
      setItemRows([{ ...emptyItemRow }]);
      setReportForm({
        locationCode: "",
        periodStart: "",
            sourceDocument: "",
        note: "",
      });
      loadData();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not save draft report");
    } finally {
      setSaving(false);
    }
  };

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

  const handleConfirmReport = async (report) => {
    if (!report?._id || report.status !== "draft") return;

    const ok = window.confirm(
      `Confirm ${report.reportNumber}? This will deduct stock from the consignment location and cannot be edited afterwards.`
    );

    if (!ok) return;

    setConfirmingId(report._id);
    try {
      await consignmentReportService.confirmConsignmentReport(report._id);
      toast.success("Consignment report confirmed and stock deducted.");
      loadData();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not confirm report");
    } finally {
      setConfirmingId("");
    }
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
        <h3>Report details / 回報資料</h3>

        <label>
          Consignment location
          <select name="locationCode" value={reportForm.locationCode} onChange={handleReportFormChange}>
            <option value="">Select location</option>
            {consignmentLocations.map((location) => (
              <option key={location._id} value={location.code}>
                {location.name} ({location.code})
              </option>
            ))}
          </select>
        </label>

        <label>
          Sales report received date / 收到銷售回報日期
          <input name="periodStart" type="date" value={reportForm.periodStart} onChange={handleReportFormChange} />
        </label>
<label>
          Source document / Reference
          <input name="sourceDocument" value={reportForm.sourceDocument} onChange={handleReportFormChange} />
        </label>

        <label>
          Note
          <textarea name="note" rows="2" value={reportForm.note} onChange={handleReportFormChange} />
        </label>
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

        <button type="button" onClick={handleSaveDraft} disabled={saving}>
          {saving ? "Saving..." : "Save draft report"}
        </button>
      </div>

      <div className="consignment-reports__history">
        <div className="consignment-reports__history-head">
          <div>
            <p className="consignment-reports__eyebrow">History</p>
            <h3>Recent reports / 最近寄賣回報</h3>
          </div>
          <p>Draft reports can be reviewed before confirmation. Confirm action will be added later.</p>
        </div>

        {reports.length === 0 ? (
          <p className="consignment-reports__empty">No consignment reports yet.</p>
        ) : (
          <div className="consignment-reports__table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Report</th>
                  <th>Location</th>
                  <th>Products</th>
                  <th>Status</th>
                  <th>Qty</th>
                  <th>Gross</th>
                  <th>Discount</th>
                  <th>Commission</th>
                  <th>Net payable</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report._id}>
                    <td>{report.reportNumber}</td>
                    <td>{report.locationNameAtReport || report.locationId?.name || "-"}</td>
                    <td>{getReportProductSummary(report)}</td>
                    <td>
                      <span className={`consignment-reports__status consignment-reports__status--${report.status}`}>
                        {report.status}
                      </span>
                    </td>
                    <td>{report.totalQuantity || 0}</td>
                    <td>{money(report.grossTotal)}</td>
                    <td>{money(report.promotionDiscountTotal)}</td>
                    <td>{money(report.commissionTotal)}</td>
                    <td><strong>{money(report.netPayableTotal)}</strong></td>
                    <td>
                      {report.status === "draft" ? (
                        <button
                          type="button"
                          className="consignment-reports__confirm"
                          onClick={() => handleConfirmReport(report)}
                          disabled={confirmingId === report._id}
                        >
                          {confirmingId === report._id ? "Confirming..." : "Confirm"}
                        </button>
                      ) : (
                        <span className="consignment-reports__muted">Confirmed</span>
                      )}
                    </td>
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

export default ConsignmentReports;
