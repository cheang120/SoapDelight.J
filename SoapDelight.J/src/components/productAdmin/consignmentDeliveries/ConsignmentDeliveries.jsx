import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import inventoryService from "../inventory/inventoryService";
import consignmentDeliveryService from "./consignmentDeliveryService";
import "./ConsignmentDeliveries.scss";

const emptyItemRow = {
  productId: "",
  quantity: 1,
  unitPriceAtIssue: "",
  note: "",
};

const money = (value) =>
  `$${Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const deliveryStatusLabel = (status) => {
  if (status === "draft") return "草稿";
  if (status === "issued") return "已發出";
  if (status === "cancelled") return "已取消";
  return status || "-";
};

const returnStatusLabel = (delivery) => {
  const items = Array.isArray(delivery?.items) ? delivery.items : [];
  const totalQuantity = items.reduce(
    (sum, item) => sum + Number(item?.quantity || 0),
    0
  );
  const returnedQuantity = items.reduce(
    (sum, item) => sum + Number(item?.returnedQuantity || 0),
    0
  );

  if (totalQuantity <= 0 || returnedQuantity <= 0) return "未退貨";
  if (returnedQuantity >= totalQuantity) return "已全數退貨";
  return "部分退貨";
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("zh-HK");
};

const buildProductOptionLabel = (product) => {
  const name = product?.name || "未命名商品";
  const centralSku = product?.centralSku ? ` (${product.centralSku})` : "";
  return `${name}${centralSku}`;
};

const getPreviewProductName = (row, productById) => {
  const product = productById.get(row.productId);
  return product?.name || "未選擇商品";
};

const getDetailCompanyLines = (selectedDelivery) => {
  const company = selectedDelivery?.companySnapshot || {};
  return [
    company.businessName,
    company.phone,
    company.email,
    company.facebookPage,
  ].filter(Boolean);
};

const getDetailLocationLines = (selectedDelivery) => {
  return [
    selectedDelivery?.locationNameAtIssue,
    selectedDelivery?.locationPhoneAtIssue,
    selectedDelivery?.locationEmailAtIssue,
    selectedDelivery?.locationAddressAtIssue,
  ].filter(Boolean);
};

const getDeliveryItemId = (item) => item?._id || `${item?.productId}-${item?.productCodeAtIssue}`;

const getProductId = (item) =>
  typeof item?.productId === "object" ? item.productId?._id : item?.productId;

const ConsignmentDeliveries = () => {
  const [deliveryForm, setDeliveryForm] = useState({
    locationId: "",
    issueDate: "",
    note: "",
  });
  const [itemRows, setItemRows] = useState([{ ...emptyItemRow }]);
  const [locations, setLocations] = useState([]);
  const [products, setProducts] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewingId, setViewingId] = useState("");
  const [editingId, setEditingId] = useState("");
  const [editingDeliveryNumber, setEditingDeliveryNumber] = useState("");
  const [editingLoadingId, setEditingLoadingId] = useState("");
  const [pdfLoadingId, setPdfLoadingId] = useState("");
  const [issuingId, setIssuingId] = useState("");
  const [cancellingId, setCancellingId] = useState("");
  const [returning, setReturning] = useState(false);
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [returnReason, setReturnReason] = useState("");
  const [returnNote, setReturnNote] = useState("");
  const [returnRows, setReturnRows] = useState([]);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const formCardRef = useRef(null);

  const consignmentLocations = useMemo(
    () =>
      locations.filter(
        (location) =>
          location?.type === "consignment" && location?.active !== false
      ),
    [locations]
  );

  const productOptions = useMemo(
    () =>
      products
        .slice()
        .sort((a, b) =>
          String(a?.name || "").localeCompare(String(b?.name || ""))
        ),
    [products]
  );

  const productById = useMemo(() => {
    const map = new Map();
    productOptions.forEach((product) => map.set(product.productId, product));
    return map;
  }, [productOptions]);

  const previewRows = useMemo(
    () =>
      itemRows.map((row) => {
        const product = productById.get(row.productId);
        const quantity = Number(row.quantity || 0);
        const unitPrice = Number(
          row.unitPriceAtIssue !== "" ? row.unitPriceAtIssue : product?.publicPrice || 0
        );

        return {
          productName: getPreviewProductName(row, productById),
          quantity,
          unitPrice,
          lineAmount: quantity > 0 ? unitPrice * quantity : 0,
          note: row.note,
        };
      }),
    [itemRows, productById]
  );

  const previewTotal = useMemo(
    () =>
      previewRows.reduce(
        (sum, row) => sum + Number(row.lineAmount || 0),
        0
      ),
    [previewRows]
  );

  const selectedItems = useMemo(
    () => (Array.isArray(selectedDelivery?.items) ? selectedDelivery.items : []),
    [selectedDelivery]
  );

  const selectedReturnStatus = useMemo(
    () => returnStatusLabel(selectedDelivery),
    [selectedDelivery]
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const [locationData, productData, deliveryData] = await Promise.all([
        inventoryService.getLocations(),
        inventoryService.getInventoryOverview(),
        consignmentDeliveryService.getConsignmentDeliveries(),
      ]);

      setLocations(Array.isArray(locationData) ? locationData : []);
      setProducts(Array.isArray(productData) ? productData : []);
      setDeliveries(Array.isArray(deliveryData) ? deliveryData : []);
    } catch (error) {
      toast.error(error?.response?.data?.message || "未能載入寄售清單資料");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setDeliveryForm({
      locationId: "",
      issueDate: "",
      note: "",
    });
    setItemRows([{ ...emptyItemRow }]);
    setEditingId("");
    setEditingDeliveryNumber("");
  };

  const resetReturnForm = () => {
    setShowReturnForm(false);
    setReturnReason("");
    setReturnNote("");
    setReturnRows([]);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setDeliveryForm((prev) => ({ ...prev, [name]: value }));
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
      prev.length === 1 ? [{ ...emptyItemRow }] : prev.filter((_, rowIndex) => rowIndex !== index)
    );
  };

  const buildPayloadItems = () =>
    itemRows
      .filter((row) => row.productId && Number(row.quantity) > 0)
      .map((row) => {
        const item = {
          productId: row.productId,
          quantity: Number(row.quantity),
          note: row.note,
        };

        if (row.unitPriceAtIssue !== "") {
          item.unitPriceAtIssue = Number(row.unitPriceAtIssue);
        }

        return item;
      });

  const handleSaveDraft = async () => {
    if (!deliveryForm.locationId) {
      toast.error("請先選擇寄賣點。");
      return;
    }

    const validItems = buildPayloadItems();

    if (validItems.length === 0) {
      toast.error("請至少加入一項有效商品。");
      return;
    }

    setSaving(true);
    try {
      const currentEditingId = editingId;
      const payload = {
        locationId: deliveryForm.locationId,
        issueDate: deliveryForm.issueDate || undefined,
        note: deliveryForm.note,
        items: validItems,
      };

      if (currentEditingId) {
        await consignmentDeliveryService.updateConsignmentDelivery(
          currentEditingId,
          payload
        );
        toast.success("寄售清單草稿已更新");
      } else {
        await consignmentDeliveryService.createConsignmentDelivery(payload);
        toast.success("寄售清單草稿已建立");
      }

      resetForm();
      await loadData();

      if (selectedDelivery?._id === currentEditingId) {
        const detail = await consignmentDeliveryService.getConsignmentDeliveryById(
          currentEditingId
        );
        setSelectedDelivery(detail);
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          (editingId ? "未能更新寄售清單草稿" : "未能建立寄售清單草稿")
      );
    } finally {
      setSaving(false);
    }
  };

  const handleViewDetail = async (deliveryId) => {
    setViewingId(deliveryId);
    try {
      const detail = await consignmentDeliveryService.getConsignmentDeliveryById(
        deliveryId
      );
      setSelectedDelivery(detail);
      resetReturnForm();
    } catch (error) {
      toast.error(error?.response?.data?.message || "未能載入寄售清單明細");
    } finally {
      setViewingId("");
    }
  };

  const handleEditDraft = async (deliveryId) => {
    setEditingLoadingId(deliveryId);
    try {
      const detail = await consignmentDeliveryService.getConsignmentDeliveryById(
        deliveryId
      );

      const locationId =
        detail?.locationId?._id ||
        detail?.locationId ||
        "";

      const nextRows = Array.isArray(detail?.items) && detail.items.length > 0
        ? detail.items.map((item) => ({
            productId: item?.productId?._id || item?.productId || "",
            quantity: Number(item?.quantity || 1),
            unitPriceAtIssue:
              item?.unitPriceAtIssue !== undefined &&
              item?.unitPriceAtIssue !== null
                ? String(item.unitPriceAtIssue)
                : "",
            note: item?.note || "",
          }))
        : [{ ...emptyItemRow }];

      setDeliveryForm({
        locationId,
        issueDate: detail?.issueDate
          ? new Date(detail.issueDate).toISOString().slice(0, 10)
          : "",
        note: detail?.note || "",
      });
      setItemRows(nextRows);
      setEditingId(detail._id);
      setEditingDeliveryNumber(detail.deliveryNumber || "");
      setSelectedDelivery(detail);

      window.requestAnimationFrame(() => {
        formCardRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    } catch (error) {
      toast.error(error?.response?.data?.message || "未能載入草稿以供編輯");
    } finally {
      setEditingLoadingId("");
    }
  };

  const handleCancelEdit = () => {
    resetForm();
  };

  const handleDownloadPdf = async (delivery) => {
    if (!delivery?._id) return;

    setPdfLoadingId(delivery._id);
    try {
      const blob = await consignmentDeliveryService.downloadConsignmentDeliveryPdf(
        delivery._id
      );
      const url = window.URL.createObjectURL(
        new Blob([blob], { type: "application/pdf" })
      );
      const link = document.createElement("a");
      const fileName = `consignment-delivery-${
        delivery.deliveryNumber || delivery._id
      }.pdf`;

      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error?.response?.data?.message || "未能下載寄售清單 PDF");
    } finally {
      setPdfLoadingId("");
    }
  };

  const handleIssue = async (deliveryId) => {
    const confirmed = window.confirm(
      "發出後會從中央存貨扣除並加入寄賣點存貨，確定發出？"
    );

    if (!confirmed) return;

    setIssuingId(deliveryId);
    try {
      await consignmentDeliveryService.issueConsignmentDelivery(deliveryId);
      toast.success("寄售清單已發出");
      resetForm();

      if (selectedDelivery?._id === deliveryId) {
        const detail = await consignmentDeliveryService.getConsignmentDeliveryById(
          deliveryId
        );
        setSelectedDelivery(detail);
      }

      await loadData();
    } catch (error) {
      toast.error(error?.response?.data?.message || "未能發出寄售清單");
    } finally {
      setIssuingId("");
    }
  };

  const handleCancel = async (deliveryId) => {
    const confirmed = window.confirm("確定要取消這張寄售清單？");

    if (!confirmed) return;

    setCancellingId(deliveryId);
    try {
      await consignmentDeliveryService.cancelConsignmentDelivery(deliveryId);
      toast.success("寄售清單已取消");
      resetForm();

      if (selectedDelivery?._id === deliveryId) {
        const detail = await consignmentDeliveryService.getConsignmentDeliveryById(
          deliveryId
        );
        setSelectedDelivery(detail);
      }

      await loadData();
    } catch (error) {
      toast.error(error?.response?.data?.message || "未能取消寄售清單");
    } finally {
      setCancellingId("");
    }
  };

  const getItemLocationStock = (item) => {
    const product = productById.get(getProductId(item));
    const locationId =
      selectedDelivery?.locationId?._id || selectedDelivery?.locationId || "";
    const locationRow = product?.locations?.find(
      (location) => String(location.locationId) === String(locationId)
    );

    return Number(locationRow?.quantity || 0);
  };

  const startReturnFlow = () => {
    if (!selectedDelivery || selectedDelivery.status !== "issued") return;

    setReturnRows(
      selectedItems.map((item) => ({
        itemId: getDeliveryItemId(item),
        productId: getProductId(item),
        quantity: "",
      }))
    );
    setReturnReason("");
    setReturnNote("");
    setShowReturnForm(true);
  };

  const handleReturnRowChange = (itemId, value) => {
    setReturnRows((prev) =>
      prev.map((row) =>
        String(row.itemId) === String(itemId) ? { ...row, quantity: value } : row
      )
    );
  };

  const handleSubmitReturn = async () => {
    if (!selectedDelivery?._id) return;

    if (!returnReason.trim()) {
      toast.error("請填寫退貨 / 逆轉原因。");
      return;
    }

    const items = returnRows
      .map((row) => ({
        itemId: row.itemId,
        productId: row.productId,
        quantity: Number(row.quantity || 0),
      }))
      .filter((row) => row.quantity > 0);

    if (items.length === 0) {
      toast.error("請至少輸入一項退回數量。");
      return;
    }

    for (const row of items) {
      const item = selectedItems.find(
        (selectedItem) => String(getDeliveryItemId(selectedItem)) === String(row.itemId)
      );
      const availableToReturn =
        Number(item?.quantity || 0) - Number(item?.returnedQuantity || 0);
      const locationStock = getItemLocationStock(item);

      if (row.quantity > availableToReturn) {
        toast.error(`${item?.productNameAtIssue || "商品"} 的退回數量超過可退數量。`);
        return;
      }

      if (row.quantity > locationStock) {
        toast.error(`${item?.productNameAtIssue || "商品"} 的退回數量超過寄賣點現有庫存。`);
        return;
      }
    }

    setReturning(true);
    try {
      await consignmentDeliveryService.createConsignmentDeliveryReturn(
        selectedDelivery._id,
        {
          reason: returnReason,
          note: returnNote,
          items,
        }
      );
      toast.success("退貨 / 逆轉紀錄已建立");
      resetReturnForm();
      await loadData();
      const detail = await consignmentDeliveryService.getConsignmentDeliveryById(
        selectedDelivery._id
      );
      setSelectedDelivery(detail);
    } catch (error) {
      toast.error(error?.response?.data?.message || "未能建立退貨 / 逆轉紀錄");
    } finally {
      setReturning(false);
    }
  };

  return (
    <section className="consignment-deliveries">
      <header className="consignment-deliveries__header">
        <div>
          <p className="consignment-deliveries__eyebrow">寄售</p>
          <h2>寄售清單</h2>
          <p>建立交貨予寄賣點的清單，並可預覽或下載寄售交貨清單 PDF。</p>
        </div>
      </header>

      <section className="consignment-deliveries__card" ref={formCardRef}>
        <div className="consignment-deliveries__section-head">
          <div>
            <h3>{editingId ? "編輯寄售清單草稿" : "建立寄售清單草稿"}</h3>
            <p>
              {editingId
                ? `正在編輯：${editingDeliveryNumber || "未命名草稿"}`
                : "先建立交貨草稿，之後再決定何時正式發出。"}
            </p>
          </div>
        </div>

        <div className="consignment-deliveries__form-grid">
          <label className="consignment-deliveries__field">
            <span>寄賣點</span>
            <select
              name="locationId"
              value={deliveryForm.locationId}
              onChange={handleFormChange}
            >
              <option value="">請選擇寄賣點</option>
              {consignmentLocations.map((location) => (
                <option key={location._id} value={location._id}>
                  {location.name} {location.code ? `(${location.code})` : ""}
                </option>
              ))}
            </select>
          </label>

          <label className="consignment-deliveries__field">
            <span>開單日期</span>
            <input
              type="date"
              name="issueDate"
              value={deliveryForm.issueDate}
              onChange={handleFormChange}
            />
          </label>

          <label className="consignment-deliveries__field consignment-deliveries__field--wide">
            <span>備註</span>
            <textarea
              name="note"
              value={deliveryForm.note}
              onChange={handleFormChange}
              placeholder="可選填交貨備註或補充資料。"
            />
          </label>
        </div>
      </section>

      <section className="consignment-deliveries__card">
        <div className="consignment-deliveries__section-head">
          <div>
            <h3>商品項目</h3>
            <p>可加入多項商品；單價留空時會由 backend 使用商品原價。</p>
          </div>
          <button
            type="button"
            className="consignment-deliveries__secondary-button"
            onClick={addItemRow}
          >
            新增商品列
          </button>
        </div>

        <div className="consignment-deliveries__items">
          {itemRows.map((row, index) => (
            <article className="consignment-deliveries__item" key={`delivery-item-${index}`}>
              <label className="consignment-deliveries__item-field consignment-deliveries__item-field--product">
                <span>商品</span>
                <select
                  value={row.productId}
                  onChange={(event) =>
                    handleItemChange(index, "productId", event.target.value)
                  }
                >
                  <option value="">請選擇商品</option>
                  {productOptions.map((product) => (
                    <option key={product.productId} value={product.productId}>
                      {buildProductOptionLabel(product)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="consignment-deliveries__item-field">
                <span>數量</span>
                <input
                  type="number"
                  min="1"
                  value={row.quantity}
                  onChange={(event) =>
                    handleItemChange(index, "quantity", event.target.value)
                  }
                />
              </label>

              <label className="consignment-deliveries__item-field">
                <span>單價</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={row.unitPriceAtIssue}
                  onChange={(event) =>
                    handleItemChange(index, "unitPriceAtIssue", event.target.value)
                  }
                  placeholder="留空使用原價"
                />
              </label>

              <label className="consignment-deliveries__item-field consignment-deliveries__item-field--note">
                <span>備註</span>
                <input
                  type="text"
                  value={row.note}
                  onChange={(event) =>
                    handleItemChange(index, "note", event.target.value)
                  }
                  placeholder="可選填"
                />
              </label>

              <button type="button" onClick={() => removeItemRow(index)}>
                移除
              </button>

              <div className="consignment-deliveries__preview">
                <span>
                  <strong>商品：</strong>
                  {previewRows[index]?.productName || "未選擇商品"}
                </span>
                <span>
                  <strong>數量：</strong>
                  {Number(previewRows[index]?.quantity || 0)}
                </span>
                <span>
                  <strong>單價：</strong>
                  {money(previewRows[index]?.unitPrice || 0)}
                </span>
                <span>
                  <strong>預覽金額：</strong>
                  {money(previewRows[index]?.lineAmount || 0)}
                </span>
                {previewRows[index]?.note ? (
                  <span>
                    <strong>備註：</strong>
                    {previewRows[index].note}
                  </span>
                ) : null}
              </div>
            </article>
          ))}
        </div>

        <div className="consignment-deliveries__totals">
          <span>
            <strong>項目數量：</strong>
            {itemRows.filter((row) => row.productId && Number(row.quantity) > 0).length}
          </span>
          <span>
            <strong>預覽總額：</strong>
            {money(previewTotal)}
          </span>
        </div>

        <div className="consignment-deliveries__card-actions">
          <button type="button" onClick={handleSaveDraft} disabled={saving}>
            {saving ? "儲存中..." : editingId ? "儲存更改" : "儲存寄售清單草稿"}
          </button>
          {editingId && (
            <button
              type="button"
              className="consignment-deliveries__secondary-button"
              onClick={handleCancelEdit}
              disabled={saving}
            >
              取消編輯
            </button>
          )}
        </div>
      </section>

      <section className="consignment-deliveries__history">
        <div className="consignment-deliveries__section-head">
          <div>
            <h3>最近寄售清單</h3>
            <p>查看草稿、已發出與已取消的寄售清單紀錄。</p>
          </div>
        </div>

        <div className="consignment-deliveries__table-wrap">
          <table>
            <thead>
              <tr>
                <th>寄售單號</th>
                <th>寄賣點</th>
                <th>狀態</th>
                <th>總數量</th>
                <th>總額</th>
                <th>開單日期</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {deliveries.length === 0 ? (
                <tr>
                  <td colSpan="7">
                    <div className="consignment-deliveries__empty">
                      尚未建立寄售清單。
                    </div>
                  </td>
                </tr>
              ) : (
                deliveries.map((delivery) => {
                  const isDraft = delivery.status === "draft";
                  const isIssued = delivery.status === "issued";
                  const isCancelled = delivery.status === "cancelled";

                  return (
                    <tr key={delivery._id}>
                      <td>{delivery.deliveryNumber || "-"}</td>
                      <td>{delivery.locationNameAtIssue || delivery.locationId?.name || "-"}</td>
                      <td>
                        <span
                          className={`consignment-deliveries__status consignment-deliveries__status--${delivery.status || "draft"}`}
                        >
                          {deliveryStatusLabel(delivery.status)}
                        </span>
                      </td>
                      <td>{Number(delivery.totalQuantity || 0)}</td>
                      <td>{money(delivery.totalAmount || 0)}</td>
                      <td>{formatDate(delivery.issueDate)}</td>
                      <td>
                        <div className="consignment-deliveries__actions">
                          <button
                            type="button"
                            className="consignment-deliveries__action-button"
                            onClick={() => handleViewDetail(delivery._id)}
                            disabled={viewingId === delivery._id}
                          >
                            {viewingId === delivery._id ? "載入明細中..." : "查看"}
                          </button>

                          {!isCancelled && (
                            <button
                              type="button"
                              className="consignment-deliveries__action-button consignment-deliveries__action-button--ghost"
                              onClick={() => handleDownloadPdf(delivery)}
                              disabled={pdfLoadingId === delivery._id}
                            >
                              {pdfLoadingId === delivery._id
                                ? "準備 PDF..."
                                : isDraft
                                  ? "預覽 PDF"
                                  : "下載 PDF"}
                            </button>
                          )}

                          {isDraft ? (
                            <>
                              <button
                                type="button"
                                className="consignment-deliveries__action-button consignment-deliveries__action-button--ghost"
                                onClick={() => handleEditDraft(delivery._id)}
                                disabled={editingLoadingId === delivery._id}
                              >
                                {editingLoadingId === delivery._id ? "載入中..." : "編輯"}
                              </button>
                              <button
                                type="button"
                                className="consignment-deliveries__action-button consignment-deliveries__action-button--primary"
                                onClick={() => handleIssue(delivery._id)}
                                disabled={issuingId === delivery._id}
                              >
                                {issuingId === delivery._id ? "發出中..." : "發出"}
                              </button>
                            </>
                          ) : isIssued ? (
                            <span className="consignment-deliveries__action-pill">
                              已發出
                            </span>
                          ) : (
                            <span className="consignment-deliveries__action-pill consignment-deliveries__action-pill--cancelled">
                              已取消
                            </span>
                          )}

                          {isDraft && (
                            <button
                              type="button"
                              className="consignment-deliveries__action-button consignment-deliveries__action-button--ghost"
                              onClick={() => handleCancel(delivery._id)}
                              disabled={cancellingId === delivery._id}
                            >
                              {cancellingId === delivery._id ? "取消中..." : "取消"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selectedDelivery && (
        <section className="consignment-deliveries__detail">
          <div className="consignment-deliveries__section-head">
            <div>
              <h3>寄售清單明細</h3>
              <p>
                {selectedDelivery.deliveryNumber || "-"} ・{" "}
                {deliveryStatusLabel(selectedDelivery.status)}
              </p>
            </div>
            <button
              type="button"
              className="consignment-deliveries__secondary-button"
              onClick={() => setSelectedDelivery(null)}
            >
              關閉明細
            </button>
            {selectedDelivery.status === "issued" &&
              selectedReturnStatus !== "已全數退貨" && (
                <button
                  type="button"
                  className="consignment-deliveries__secondary-button"
                  onClick={startReturnFlow}
                >
                  建立退貨 / 逆轉
                </button>
              )}
            {selectedDelivery.status !== "cancelled" && (
              <button
                type="button"
                className="consignment-deliveries__secondary-button"
                onClick={() => handleDownloadPdf(selectedDelivery)}
                disabled={pdfLoadingId === selectedDelivery._id}
              >
                {pdfLoadingId === selectedDelivery._id
                  ? "準備 PDF..."
                  : selectedDelivery.status === "draft"
                    ? "預覽 PDF"
                    : "下載 PDF"}
              </button>
            )}
          </div>

          <div className="consignment-deliveries__detail-grid">
            <article className="consignment-deliveries__detail-card">
              <h4>公司資料</h4>
              {getDetailCompanyLines(selectedDelivery).length > 0 ? (
                <ul>
                  {getDetailCompanyLines(selectedDelivery).map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              ) : (
                <p>未有公司資料快照。</p>
              )}
            </article>

            <article className="consignment-deliveries__detail-card">
              <h4>寄賣點資料</h4>
              {getDetailLocationLines(selectedDelivery).length > 0 ? (
                <ul>
                  {getDetailLocationLines(selectedDelivery).map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              ) : (
                <p>未有寄賣點資料快照。</p>
              )}
            </article>
          </div>

          <div className="consignment-deliveries__meta">
            <span>
              <strong>開單日期：</strong>
              {formatDate(selectedDelivery.issueDate)}
            </span>
            <span>
              <strong>備註：</strong>
              {selectedDelivery.note || "—"}
            </span>
            {selectedDelivery.status === "issued" && (
              <span>
                <strong>退貨狀態：</strong>
                {selectedReturnStatus}
              </span>
            )}
          </div>

          <div className="consignment-deliveries__table-wrap">
            <table className="consignment-deliveries__detail-table">
              <thead>
                <tr>
                  <th>商品編號</th>
                  <th>名稱</th>
                  <th>價格</th>
                  <th>折扣</th>
                  <th>數量</th>
                  <th>已退</th>
                  <th>可退</th>
                  <th>金額</th>
                </tr>
              </thead>
              <tbody>
                {selectedItems.length === 0 ? (
                  <tr>
                    <td colSpan="8">
                      <div className="consignment-deliveries__empty">
                        這張寄售清單沒有商品項目。
                      </div>
                    </td>
                  </tr>
                ) : (
                  selectedItems.map((item) => (
                    <tr key={item._id || `${item.productId}-${item.locationSkuAtIssue}`}>
                      <td>{item.productCodeAtIssue || "-"}</td>
                      <td>{item.productNameAtIssue || "-"}</td>
                      <td>{money(item.unitPriceAtIssue || 0)}</td>
                      <td>{Number(item.settlementRateAtIssue || 0)}%</td>
                      <td>{Number(item.quantity || 0)}</td>
                      <td>{Number(item.returnedQuantity || 0)}</td>
                      <td>
                        {Math.max(
                          Number(item.quantity || 0) -
                            Number(item.returnedQuantity || 0),
                          0
                        )}
                      </td>
                      <td>{money(item.lineAmount || 0)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {showReturnForm && (
            <div className="consignment-deliveries__return-panel">
              <div className="consignment-deliveries__section-head">
                <div>
                  <h4>建立退貨 / 逆轉</h4>
                  <p>退貨會從寄賣點扣庫存，並加回 Central Stock。</p>
                </div>
                <button
                  type="button"
                  className="consignment-deliveries__secondary-button"
                  onClick={resetReturnForm}
                  disabled={returning}
                >
                  取消退貨
                </button>
              </div>

              <div className="consignment-deliveries__form-grid">
                <label className="consignment-deliveries__field">
                  <span>原因</span>
                  <select
                    value={returnReason}
                    onChange={(event) => setReturnReason(event.target.value)}
                  >
                    <option value="">請選擇原因</option>
                    <option value="錯誤發出">錯誤發出</option>
                    <option value="寄賣點退貨">寄賣點退貨</option>
                    <option value="商品損壞退回">商品損壞退回</option>
                    <option value="其他">其他</option>
                  </select>
                </label>

                <label className="consignment-deliveries__field">
                  <span>補充備註</span>
                  <input
                    type="text"
                    value={returnNote}
                    onChange={(event) => setReturnNote(event.target.value)}
                    placeholder="可選填"
                  />
                </label>
              </div>

              <div className="consignment-deliveries__table-wrap">
                <table className="consignment-deliveries__detail-table">
                  <thead>
                    <tr>
                      <th>商品編號</th>
                      <th>名稱</th>
                      <th>原發出</th>
                      <th>已退</th>
                      <th>可退</th>
                      <th>寄賣點庫存</th>
                      <th>今次退回</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedItems.map((item) => {
                      const itemId = getDeliveryItemId(item);
                      const returnedQuantity = Number(item.returnedQuantity || 0);
                      const originalQuantity = Number(item.quantity || 0);
                      const availableToReturn = Math.max(
                        originalQuantity - returnedQuantity,
                        0
                      );
                      const locationStock = getItemLocationStock(item);
                      const row = returnRows.find(
                        (returnRow) => String(returnRow.itemId) === String(itemId)
                      );

                      return (
                        <tr key={`return-${itemId}`}>
                          <td>{item.productCodeAtIssue || "-"}</td>
                          <td>{item.productNameAtIssue || "-"}</td>
                          <td>{originalQuantity}</td>
                          <td>{returnedQuantity}</td>
                          <td>{availableToReturn}</td>
                          <td>{locationStock}</td>
                          <td>
                            <input
                              type="number"
                              min="0"
                              max={Math.min(availableToReturn, locationStock)}
                              value={row?.quantity || ""}
                              onChange={(event) =>
                                handleReturnRowChange(itemId, event.target.value)
                              }
                              disabled={availableToReturn <= 0 || locationStock <= 0}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="consignment-deliveries__card-actions">
                <button
                  type="button"
                  onClick={handleSubmitReturn}
                  disabled={returning}
                >
                  {returning ? "建立中..." : "確認建立退貨 / 逆轉"}
                </button>
              </div>
            </div>
          )}

          <div className="consignment-deliveries__totals">
            <span>
              <strong>總數量：</strong>
              {Number(selectedDelivery.totalQuantity || 0)}
            </span>
            <span>
              <strong>總額：</strong>
              {money(selectedDelivery.totalAmount || 0)}
            </span>
          </div>
        </section>
      )}

      {loading && (
        <div className="consignment-deliveries__loading">載入中...</div>
      )}
    </section>
  );
};

export default ConsignmentDeliveries;
