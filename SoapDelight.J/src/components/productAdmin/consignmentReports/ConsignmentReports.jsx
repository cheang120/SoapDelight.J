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

const getDetailItemName = (item) =>
  item?.locationProductNameAtSale ||
  item?.productNameAtSale ||
  item?.productId?.name ||
  "商品";

const getDetailCentralSku = (item) =>
  item?.centralSkuAtSale ||
  item?.productSkuAtSale ||
  item?.productId?.sku ||
  "-";

const getDetailLocationSku = (item) =>
  item?.locationSkuAtSale ||
  item?.locationSku ||
  item?.productId?.macauBaptistSku ||
  "-";

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
  const [selectedReport, setSelectedReport] = useState(null);
  const [viewingId, setViewingId] = useState("");

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

  const selectedReportItems = useMemo(
    () => (Array.isArray(selectedReport?.items) ? selectedReport.items : []),
    [selectedReport]
  );

  const selectedReportTotals = useMemo(
    () =>
      selectedReportItems.reduce(
        (total, item) => ({
          quantity: total.quantity + Number(item?.quantitySold || 0),
          grossAmount: total.grossAmount + Number(item?.grossAmount || 0),
          discountAmount:
            total.discountAmount + Number(item?.discountAmount || 0),
          commissionAmount:
            total.commissionAmount + Number(item?.commissionAmount || 0),
          netPayable:
            total.netPayable + Number(item?.netPayableAmount || 0),
        }),
        {
          quantity: 0,
          grossAmount: 0,
          discountAmount: 0,
          commissionAmount: 0,
          netPayable: 0,
        }
      ),
    [selectedReportItems]
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

  const handleViewReport = async (reportId) => {
    if (!reportId) return;

    setViewingId(reportId);
    try {
      const reportDetail = await consignmentReportService.getConsignmentReportById(
        reportId
      );
      setSelectedReport(reportDetail);
    } catch (error) {
      toast.error(error?.response?.data?.message || "未能載入回報明細");
    } finally {
      setViewingId("");
    }
  };

  const closeDetail = () => {
    setSelectedReport(null);
    setViewingId("");
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

      <div className="consignment-reports__card consignment-reports__card--stats">
        <p>寄賣地點：{locations.filter((item) => item.type === "consignment").length}</p>
        <p>已載入商品：{products.length}</p>
        <p>已載入回報：{reports.length}</p>
      </div>

      <div className="consignment-reports__card">
        <h3>回報資料</h3>

        <div className="consignment-reports__form-grid">
          <label className="consignment-reports__field">
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

          <label className="consignment-reports__field">
            收到銷售回報日期
            <input name="periodStart" type="date" value={reportForm.periodStart} onChange={handleReportFormChange} />
          </label>

          <label className="consignment-reports__field consignment-reports__field--wide">
            來源文件 / 參考資料
            <input name="sourceDocument" value={reportForm.sourceDocument} onChange={handleReportFormChange} />
          </label>

          <label className="consignment-reports__field consignment-reports__field--wide">
            備註
            <textarea name="note" rows="2" value={reportForm.note} onChange={handleReportFormChange} />
          </label>
        </div>
      </div>

      <div className="consignment-reports__card">
        <h3>銷售項目</h3>
        <p>每一列可使用不同折扣及佣金設定。</p>

        <div className="consignment-reports__items">
          {itemRows.map((row, index) => (
            <div className="consignment-reports__item" key={index}>
              <label className="consignment-reports__item-field consignment-reports__item-field--product">
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

              <label className="consignment-reports__item-field">
                數量
                <input
                  type="number"
                  min="1"
                  value={row.quantitySold}
                  onChange={(event) => handleItemChange(index, "quantitySold", event.target.value)}
                />
              </label>

              <label className="consignment-reports__item-field">
                單價
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={row.publicUnitPriceAtSale}
                  onChange={(event) => handleItemChange(index, "publicUnitPriceAtSale", event.target.value)}
                />
              </label>

              <label className="consignment-reports__item-field">
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

              <label className="consignment-reports__item-field">
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

              <label className="consignment-reports__item-field consignment-reports__item-field--note">
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

        <div className="consignment-reports__card-actions">
          <button type="button" onClick={addItemRow}>
            新增銷售項目
          </button>

          <button type="button" onClick={handleSaveDraft} disabled={saving}>
            {saving ? "儲存中..." : "儲存草稿回報"}
          </button>
        </div>
      </div>

      <div className="consignment-reports__history">
        <div className="consignment-reports__history-head consignment-reports__history-head--simple">
          <h3>最近寄賣回報</h3>
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
                      <div className="consignment-reports__actions">
                        <button
                          type="button"
                          className="consignment-reports__view"
                          onClick={() => handleViewReport(report._id)}
                          disabled={viewingId === report._id}
                        >
                          {viewingId === report._id ? "載入明細中..." : "查看"}
                        </button>
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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedReport && (
        <div className="consignment-reports__detail">
          <div className="consignment-reports__detail-head">
            <div>
              <p className="consignment-reports__eyebrow">明細</p>
              <h3>寄賣回報明細</h3>
              <p>查看每項商品的銷售、折扣、佣金及應收金額。</p>
            </div>
            <button
              type="button"
              className="consignment-reports__detail-close"
              onClick={closeDetail}
            >
              關閉明細
            </button>
          </div>

          <div className="consignment-reports__detail-meta">
            <div>
              <span>回報編號</span>
              <strong>{selectedReport.reportNumber || "-"}</strong>
            </div>
            <div>
              <span>寄賣地點</span>
              <strong>
                {selectedReport.locationNameAtReport ||
                  selectedReport.locationId?.name ||
                  "-"}
              </strong>
            </div>
            <div>
              <span>狀態</span>
              <strong>{reportStatusLabel(selectedReport.status)}</strong>
            </div>
            <div>
              <span>收到銷售回報日期</span>
              <strong>{selectedReport.periodStart || "-"}</strong>
            </div>
            <div>
              <span>來源文件 / 參考資料</span>
              <strong>{selectedReport.sourceDocument || "-"}</strong>
            </div>
            <div>
              <span>備註</span>
              <strong>{selectedReport.note || "-"}</strong>
            </div>
          </div>

          <div className="consignment-reports__table-wrap">
            <table className="consignment-reports__detail-table">
              <thead>
                <tr>
                  <th>商品名稱</th>
                  <th>中央 SKU</th>
                  <th>寄賣點 SKU</th>
                  <th>數量</th>
                  <th>單價</th>
                  <th>折扣 %</th>
                  <th>折扣金額</th>
                  <th>佣金 %</th>
                  <th>佣金金額</th>
                  <th>應收金額</th>
                  <th>推廣備註</th>
                  <th>備註</th>
                </tr>
              </thead>
              <tbody>
                {selectedReportItems.length === 0 ? (
                  <tr>
                    <td colSpan="12" className="consignment-reports__detail-empty">
                      此回報暫時沒有銷售項目。
                    </td>
                  </tr>
                ) : (
                  selectedReportItems.map((item, index) => (
                    <tr key={item._id || `${selectedReport._id}-item-${index}`}>
                      <td>{getDetailItemName(item)}</td>
                      <td>{getDetailCentralSku(item)}</td>
                      <td>{getDetailLocationSku(item)}</td>
                      <td>{Number(item?.quantitySold || 0)}</td>
                      <td>{money(item?.publicUnitPriceAtSale)}</td>
                      <td>{Number(item?.discountRate || 0)}%</td>
                      <td>{money(item?.discountAmount)}</td>
                      <td>{Number(item?.commissionRateAtSale || 0)}%</td>
                      <td>{money(item?.commissionAmount)}</td>
                      <td>{money(item?.netPayableAmount)}</td>
                      <td>{item?.promotionNote || "-"}</td>
                      <td>{item?.note || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="consignment-reports__totals">
            <span>總數量：{selectedReportTotals.quantity}</span>
            <span>總額：{money(selectedReportTotals.grossAmount)}</span>
            <span>折扣總額：{money(selectedReportTotals.discountAmount)}</span>
            <span>佣金總額：{money(selectedReportTotals.commissionAmount)}</span>
            <strong>應收總額：{money(selectedReportTotals.netPayable)}</strong>
          </div>
        </div>
      )}

    </section>
  );
};

export default ConsignmentReports;
