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

const reportStatusLabel = (status) => {
  if (status === "confirmed") return "已確認";
  if (status === "draft") return "草稿";
  return status || "-";
};

const getReportProductSummary = (report) => {
  const items = Array.isArray(report?.items) ? report.items : [];

  if (items.length === 0) return "-";

  const names = items
    .map((item) => item.locationProductNameAtSale || item.productNameAtSale || "商品")
    .filter(Boolean);

  const uniqueNames = [...new Set(names)];
  const summary = uniqueNames.slice(0, 3).join(", ");

  return uniqueNames.length > 3 ? `${summary} +${uniqueNames.length - 3} 項` : summary;
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
      toast.error(error?.response?.data?.message || "未能載入寄賣回報");
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
      toast.error("請選擇寄賣地點。");
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
      toast.error("請至少新增一項有效銷售項目。");
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

      toast.success("寄賣回報草稿已儲存。");
      setItemRows([{ ...emptyItemRow }]);
      setReportForm({
        locationCode: "",
        periodStart: "",
            sourceDocument: "",
        note: "",
      });
      loadData();
    } catch (error) {
      toast.error(error?.response?.data?.message || "未能儲存草稿回報");
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
      `確認 ${report.reportNumber}？確認後會從寄賣地點扣除存貨，之後不可再編輯。`
    );

    if (!ok) return;

    setConfirmingId(report._id);
    try {
      await consignmentReportService.confirmConsignmentReport(report._id);
      toast.success("寄賣回報已確認，存貨已扣除。");
      loadData();
    } catch (error) {
      toast.error(error?.response?.data?.message || "未能確認回報");
    } finally {
      setConfirmingId("");
    }
  };

  return (
    <section className="consignment-reports">
      <header className="consignment-reports__header">
        <div>
          <p className="consignment-reports__eyebrow">寄賣</p>
          <h2>寄賣銷售回報</h2>
          <p>PDF 及 invoice 會在你提供文件樣式後另行加入。</p>
        </div>

        <button type="button" onClick={loadData} disabled={loading}>
          {loading ? "重新整理中..." : "重新整理"}
        </button>
      </header>

      <div className="consignment-reports__card">
        <p>寄賣地點：{locations.filter((item) => item.type === "consignment").length}</p>
        <p>已載入商品：{products.length}</p>
        <p>已載入回報：{reports.length}</p>
      </div>

      <div className="consignment-reports__card">
        <h3>回報資料</h3>

        <label>
          寄賣地點
          <select name="locationCode" value={reportForm.locationCode} onChange={handleReportFormChange}>
            <option value="">選擇地點</option>
            {consignmentLocations.map((location) => (
              <option key={location._id} value={location.code}>
                {location.name} ({location.code})
              </option>
            ))}
          </select>
        </label>

        <label>
          收到銷售回報日期
          <input name="periodStart" type="date" value={reportForm.periodStart} onChange={handleReportFormChange} />
        </label>
<label>
          來源文件 / 參考資料
          <input name="sourceDocument" value={reportForm.sourceDocument} onChange={handleReportFormChange} />
        </label>

        <label>
          備註
          <textarea name="note" rows="2" value={reportForm.note} onChange={handleReportFormChange} />
        </label>
      </div>

      <div className="consignment-reports__card">
        <h3>銷售項目</h3>
        <p>每一列可使用不同折扣及佣金設定。</p>

        <div className="consignment-reports__items">
          {itemRows.map((row, index) => (
            <div className="consignment-reports__item" key={index}>
              <label>
                商品
                <select
                  value={row.productId}
                  onChange={(event) => handleItemChange(index, "productId", event.target.value)}
                >
                  <option value="">選擇商品</option>
                  {productOptions.map((product) => (
                    <option key={product.productId} value={product.productId}>
                      {product.name} {product.centralSku ? `(${product.centralSku})` : ""}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                數量
                <input
                  type="number"
                  min="1"
                  value={row.quantitySold}
                  onChange={(event) => handleItemChange(index, "quantitySold", event.target.value)}
                />
              </label>

              <label>
                單價
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={row.publicUnitPriceAtSale}
                  onChange={(event) => handleItemChange(index, "publicUnitPriceAtSale", event.target.value)}
                />
              </label>

              <label>
                折扣 %
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
                佣金 %
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={row.commissionRateAtSale}
                  onChange={(event) => handleItemChange(index, "commissionRateAtSale", event.target.value)}
                  placeholder="使用商品 / 地點預設值"
                />
              </label>

              <label>
                推廣備註
                <input
                  value={row.promotionNote}
                  onChange={(event) => handleItemChange(index, "promotionNote", event.target.value)}
                  placeholder="第二件半價"
                />
              </label>

              <div className="consignment-reports__preview">
                <span>總額：{money(itemPreviewRows[index]?.grossAmount)}</span>
                <span>折扣：{money(itemPreviewRows[index]?.discountAmount)}</span>
                <span>佣金：{money(itemPreviewRows[index]?.commissionAmount)}</span>
                <strong>應收：{money(itemPreviewRows[index]?.netPayable)}</strong>
              </div>

              <button type="button" onClick={() => removeItemRow(index)} disabled={itemRows.length === 1}>
                移除
              </button>
            </div>
          ))}
        </div>

        <div className="consignment-reports__totals">
          <span>總額：{money(previewTotals.grossAmount)}</span>
          <span>折扣：{money(previewTotals.discountAmount)}</span>
          <span>佣金：{money(previewTotals.commissionAmount)}</span>
          <strong>應收金額：{money(previewTotals.netPayable)}</strong>
        </div>

        <button type="button" onClick={addItemRow}>
          新增銷售項目
        </button>

        <button type="button" onClick={handleSaveDraft} disabled={saving}>
          {saving ? "儲存中..." : "儲存草稿回報"}
        </button>
      </div>

      <div className="consignment-reports__history">
        <div className="consignment-reports__history-head">
          <div>
            <p className="consignment-reports__eyebrow">紀錄</p>
            <h3>最近寄賣回報</h3>
          </div>
          <p>草稿回報可在確認前檢查；確認後會扣除相應寄賣存貨。</p>
        </div>

        {reports.length === 0 ? (
          <p className="consignment-reports__empty">暫未有寄賣回報。</p>
        ) : (
          <div className="consignment-reports__table-wrap">
            <table>
              <thead>
                <tr>
                  <th>回報</th>
                  <th>地點</th>
                  <th>商品</th>
                  <th>狀態</th>
                  <th>數量</th>
                  <th>總額</th>
                  <th>折扣</th>
                  <th>佣金</th>
                  <th>應收金額</th>
                  <th>操作</th>
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
                        {reportStatusLabel(report.status)}
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
                          {confirmingId === report._id ? "確認中..." : "確認"}
                        </button>
                      ) : (
                        <span className="consignment-reports__muted">已確認</span>
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
