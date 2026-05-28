import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import inventoryService from "../inventory/inventoryService";
import "./LocationStockPage.scss";

const money = (value) =>
  `$${Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("zh-HK");
};

const getLocationTypeLabel = (location) => {
  if (location?.code === "CENTRAL") return "中央倉";
  if (location?.type === "consignment") return "寄賣點";
  if (location?.type === "online") return "網店";
  return "其他";
};

const getSearchText = (row) =>
  [
    row.productName,
    row.centralSku,
    row.locationSku,
    row.locationProductName,
    row.category,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

const LocationStockPage = () => {
  const [locations, setLocations] = useState([]);
  const [overviewRows, setOverviewRows] = useState([]);
  const [movements, setMovements] = useState([]);
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [locationTypeFilter, setLocationTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("quantity");
  const [sortDirection, setSortDirection] = useState("desc");
  const [loading, setLoading] = useState(false);
  const [movementLoading, setMovementLoading] = useState(false);

  const filteredLocations = useMemo(() => {
    const safeLocations = Array.isArray(locations) ? locations : [];

    if (locationTypeFilter === "central") {
      return safeLocations.filter(
        (location) => location.code === "CENTRAL" || location.type === "central"
      );
    }

    if (locationTypeFilter === "consignment") {
      return safeLocations.filter((location) => location.type === "consignment");
    }

    return safeLocations;
  }, [locations, locationTypeFilter]);

  const selectedLocation = useMemo(
    () => locations.find((location) => location._id === selectedLocationId),
    [locations, selectedLocationId]
  );

  const lastMovementByProduct = useMemo(() => {
    const map = new Map();

    movements.forEach((movement) => {
      const productId =
        movement?.productId?._id ||
        movement?.product?._id ||
        movement?.productId ||
        movement?.product;

      if (!productId || map.has(String(productId))) return;
      map.set(String(productId), movement);
    });

    return map;
  }, [movements]);

  const locationRows = useMemo(() => {
    if (!selectedLocationId) return [];

    return overviewRows
      .map((product) => {
        const location = product.locations?.find(
          (item) => item.locationId === selectedLocationId
        );

        if (!location) return null;

        const quantity = Number(location.quantity || 0);
        const hasMapping =
          Boolean(location.locationSku) || Boolean(location.locationProductName);

        if (quantity <= 0 && !hasMapping) return null;

        const publicPrice = Number(product.publicPrice || 0);
        const internalNetPrice = Number(location.internalNetPrice || 0);
        const latestMovement = lastMovementByProduct.get(String(product.productId));

        return {
          productId: product.productId,
          productName: product.name || "未命名商品",
          centralSku: product.centralSku || "",
          category: product.category || "",
          locationName: location.locationName,
          locationCode: location.locationCode,
          locationSku: location.locationSku || "",
          locationProductName: location.locationProductName || "",
          quantity,
          publicPrice,
          commissionRate: Number(location.commissionRate || 0),
          internalNetPrice,
          estimatedRetailValue: publicPrice * quantity,
          estimatedConsignmentValue: internalNetPrice * quantity,
          lastMovementDate: latestMovement?.createdAt || "",
        };
      })
      .filter(Boolean);
  }, [overviewRows, selectedLocationId, lastMovementByProduct]);

  const visibleRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    const searchedRows = term
      ? locationRows.filter((row) => getSearchText(row).includes(term))
      : locationRows;

    return searchedRows.slice().sort((a, b) => {
      let aValue = a[sortKey];
      let bValue = b[sortKey];

      if (sortKey === "sku") {
        aValue = a.locationSku || a.centralSku || "";
        bValue = b.locationSku || b.centralSku || "";
      }

      if (sortKey === "lastMovementDate") {
        aValue = aValue ? new Date(aValue).getTime() : 0;
        bValue = bValue ? new Date(bValue).getTime() : 0;
      }

      if (typeof aValue === "number" || typeof bValue === "number") {
        return sortDirection === "asc"
          ? Number(aValue || 0) - Number(bValue || 0)
          : Number(bValue || 0) - Number(aValue || 0);
      }

      return sortDirection === "asc"
        ? String(aValue || "").localeCompare(String(bValue || ""))
        : String(bValue || "").localeCompare(String(aValue || ""));
    });
  }, [locationRows, search, sortDirection, sortKey]);

  const summary = useMemo(
    () =>
      locationRows.reduce(
        (total, row) => ({
          skuCount: total.skuCount + 1,
          totalQuantity: total.totalQuantity + Number(row.quantity || 0),
          retailValue:
            total.retailValue + Number(row.estimatedRetailValue || 0),
          consignmentValue:
            total.consignmentValue +
            Number(row.estimatedConsignmentValue || 0),
        }),
        {
          skuCount: 0,
          totalQuantity: 0,
          retailValue: 0,
          consignmentValue: 0,
        }
      ),
    [locationRows]
  );

  const latestMovementDate = useMemo(() => {
    const [latest] = movements;
    return latest?.createdAt || "";
  }, [movements]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [locationData, overviewData] = await Promise.all([
        inventoryService.getLocations(),
        inventoryService.getInventoryOverview(),
      ]);

      const safeLocations = Array.isArray(locationData) ? locationData : [];
      setLocations(safeLocations);
      setOverviewRows(Array.isArray(overviewData) ? overviewData : []);

      if (safeLocations.length > 0) {
        const centralLocation =
          safeLocations.find((location) => location.code === "CENTRAL") ||
          safeLocations[0];
        setSelectedLocationId((current) => current || centralLocation._id);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "未能載入地點存貨資料");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMovements = useCallback(async (locationId) => {
    if (!locationId) {
      setMovements([]);
      return;
    }

    setMovementLoading(true);
    try {
      const movementData = await inventoryService.getMovements({
        locationId,
        limit: 500,
      });
      setMovements(Array.isArray(movementData) ? movementData : []);
    } catch (error) {
      setMovements([]);
      toast.error(error?.response?.data?.message || "未能載入最近流水資料");
    } finally {
      setMovementLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const stillAvailable = filteredLocations.some(
      (location) => location._id === selectedLocationId
    );

    if (!stillAvailable) {
      setSelectedLocationId(filteredLocations[0]?._id || "");
    }
  }, [filteredLocations, selectedLocationId]);

  useEffect(() => {
    loadMovements(selectedLocationId);
  }, [loadMovements, selectedLocationId]);

  const handleSort = (nextSortKey) => {
    if (sortKey === nextSortKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(nextSortKey);
    setSortDirection(nextSortKey === "productName" || nextSortKey === "sku" ? "asc" : "desc");
  };

  return (
    <section className="location-stock-page">
      <header className="location-stock-page__header">
        <div>
          <p className="location-stock-page__eyebrow">存貨</p>
          <h2>地點存貨總覽</h2>
          <p>
            只讀查看中央倉、網店及各寄賣點目前商品數量。數量來自 InventoryBalance。
          </p>
        </div>
        <button type="button" onClick={loadData} disabled={loading}>
          {loading ? "重新整理中..." : "重新整理"}
        </button>
      </header>

      <section className="location-stock-page__card">
        <div className="location-stock-page__filters">
          <label>
            地點類型
            <select
              value={locationTypeFilter}
              onChange={(event) => setLocationTypeFilter(event.target.value)}
            >
              <option value="all">全部</option>
              <option value="central">中央倉 / CENTRAL</option>
              <option value="consignment">寄賣點</option>
            </select>
          </label>

          <label>
            存貨地點
            <select
              value={selectedLocationId}
              onChange={(event) => setSelectedLocationId(event.target.value)}
            >
              {filteredLocations.length === 0 ? (
                <option value="">沒有可選地點</option>
              ) : (
                filteredLocations.map((location) => (
                  <option key={location._id} value={location._id}>
                    {location.name} ({location.code})
                  </option>
                ))
              )}
            </select>
          </label>

          <label>
            搜尋
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="搜尋商品名稱、SKU、寄賣 SKU 或寄賣名稱"
            />
          </label>

          <div className="location-stock-page__selected">
            <span>{selectedLocation?.name || "未選擇地點"}</span>
            <strong>{selectedLocation ? getLocationTypeLabel(selectedLocation) : "-"}</strong>
          </div>
        </div>
      </section>

      <section className="location-stock-page__summary">
        <article>
          <span>SKU / 商品種類</span>
          <strong>{summary.skuCount}</strong>
        </article>
        <article>
          <span>總數量</span>
          <strong>{summary.totalQuantity}</strong>
        </article>
        <article>
          <span>估算零售總值</span>
          <strong>{money(summary.retailValue)}</strong>
        </article>
        <article>
          <span>估算寄賣應收</span>
          <strong>{money(summary.consignmentValue)}</strong>
        </article>
        <article>
          <span>最近流水日期</span>
          <strong>{movementLoading ? "載入中..." : formatDate(latestMovementDate)}</strong>
        </article>
      </section>

      <section className="location-stock-page__table-card">
        <div className="location-stock-page__table-head">
          <div>
            <h3>商品存貨</h3>
            <p>
              顯示此地點有庫存或已建立 mapping 的商品，不提供直接修改數量。
            </p>
          </div>
          <span>{visibleRows.length} 項結果</span>
        </div>

        <div className="location-stock-page__table-wrap">
          <table>
            <thead>
              <tr>
                <th>
                  <button type="button" onClick={() => handleSort("sku")}>
                    商品編號 / SKU
                  </button>
                </th>
                <th>
                  <button type="button" onClick={() => handleSort("productName")}>
                    原商品名稱
                  </button>
                </th>
                <th>寄賣商品名稱</th>
                <th>Location</th>
                <th>
                  <button type="button" onClick={() => handleSort("quantity")}>
                    現有數量
                  </button>
                </th>
                <th>價格</th>
                <th>折扣 / commission reference</th>
                <th>估算金額</th>
                <th>
                  <button
                    type="button"
                    onClick={() => handleSort("lastMovementDate")}
                  >
                    最近更新
                  </button>
                </th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10">
                    <div className="location-stock-page__empty">正在載入...</div>
                  </td>
                </tr>
              ) : visibleRows.length === 0 ? (
                <tr>
                  <td colSpan="10">
                    <div className="location-stock-page__empty">
                      此地點暫未有符合條件的商品。
                    </div>
                  </td>
                </tr>
              ) : (
                visibleRows.map((row) => (
                  <tr key={`${selectedLocationId}-${row.productId}`}>
                    <td>
                      <div className="location-stock-page__sku-stack">
                        <strong>{row.locationSku || row.centralSku || "-"}</strong>
                        {row.locationSku && row.centralSku ? (
                          <span>中央 SKU：{row.centralSku}</span>
                        ) : null}
                      </div>
                    </td>
                    <td>{row.productName}</td>
                    <td>{row.locationProductName || "-"}</td>
                    <td>
                      {row.locationName} ({row.locationCode})
                    </td>
                    <td>
                      <span className="location-stock-page__quantity">
                        {row.quantity}
                      </span>
                    </td>
                    <td>{money(row.publicPrice)}</td>
                    <td>
                      {Number(row.commissionRate || 0)}%
                      <span className="location-stock-page__muted">
                        只供內部參考
                      </span>
                    </td>
                    <td>
                      <div className="location-stock-page__sku-stack">
                        <strong>{money(row.estimatedRetailValue)}</strong>
                        <span>寄賣應收：{money(row.estimatedConsignmentValue)}</span>
                      </div>
                    </td>
                    <td>{formatDate(row.lastMovementDate)}</td>
                    <td>
                      <Link
                        className="location-stock-page__movement-link"
                        to={`/productAdmin/stock-movements?productId=${row.productId}&locationId=${selectedLocationId}`}
                      >
                        查看流水
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
};

export default LocationStockPage;
