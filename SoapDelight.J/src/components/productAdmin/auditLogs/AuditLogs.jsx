import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import auditLogService from "./auditLogService";
import styles from "./AuditLogs.module.scss";

const defaultFilters = {
  q: "",
  actionType: "",
  targetType: "",
  actorEmail: "",
  dateFrom: "",
  dateTo: "",
};

const actionTypeOptions = [
  { value: "", label: "全部操作" },
  { value: "order.status_updated", label: "更新訂單狀態" },
  { value: "order.refund_unshipped_submitted", label: "提交未出貨退款" },
  { value: "order.return_requested", label: "建立退貨個案" },
  { value: "order.return_refund_submitted", label: "提交已出貨退貨退款" },
  { value: "order.return_closed_no_refund", label: "退貨結案，不設退款" },
  { value: "product.created", label: "新增商品" },
  { value: "product.updated", label: "編輯商品" },
  { value: "product.deleted", label: "刪除商品" },
];

const targetTypeOptions = [
  { value: "", label: "全部目標" },
  { value: "Order", label: "訂單" },
  { value: "Product", label: "商品" },
];

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("zh-HK", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const shortId = (id) => (id ? `#${String(id).slice(-8).toUpperCase()}` : "-");

const cleanFilters = (filters) =>
  Object.fromEntries(
    Object.entries(filters).filter(([, value]) => String(value || "").trim())
  );

const JsonBlock = ({ title, value }) => (
  <div className={styles.jsonBlock}>
    <h4>{title}</h4>
    <pre>{value ? JSON.stringify(value, null, 2) : "沒有資料"}</pre>
  </div>
);

const AuditLogs = () => {
  const [filters, setFilters] = useState(defaultFilters);
  const [submittedFilters, setSubmittedFilters] = useState(defaultFilters);
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    pages: 1,
  });
  const [summary, setSummary] = useState({ totalRecords: 0 });
  const [expandedId, setExpandedId] = useState("");
  const [loading, setLoading] = useState(false);

  const activeParams = useMemo(
    () => ({
      ...cleanFilters(submittedFilters),
      page: pagination.page,
      limit: pagination.limit,
    }),
    [submittedFilters, pagination.page, pagination.limit]
  );

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await auditLogService.getAuditLogs(activeParams);
      setRecords(Array.isArray(data?.records) ? data.records : []);
      setPagination((current) => ({
        ...current,
        ...(data?.pagination || {}),
      }));
      setSummary(data?.summary || { totalRecords: 0 });
    } catch (error) {
      toast.error(error?.response?.data?.message || "未能載入操作紀錄");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeParams]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const handleSearch = (event) => {
    event.preventDefault();
    setExpandedId("");
    setPagination((current) => ({ ...current, page: 1 }));
    setSubmittedFilters(filters);
  };

  const handleClear = () => {
    setExpandedId("");
    setFilters(defaultFilters);
    setSubmittedFilters(defaultFilters);
    setPagination((current) => ({ ...current, page: 1 }));
  };

  const goToPage = (nextPage) => {
    setExpandedId("");
    setPagination((current) => ({
      ...current,
      page: Math.min(Math.max(nextPage, 1), current.pages || 1),
    }));
  };

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>系統監察</p>
          <h2 className={styles.title}>操作紀錄</h2>
          <p className={styles.subtitle}>
            顯示後台重要操作紀錄，僅供查看，不可修改。
          </p>
        </div>
        <button
          type="button"
          className={styles.refreshButton}
          onClick={loadLogs}
          disabled={loading}
        >
          {loading ? "載入中..." : "重新整理"}
        </button>
      </header>

      <form className={styles.filters} onSubmit={handleSearch}>
        <label>
          <span>關鍵字</span>
          <input
            type="search"
            name="q"
            value={filters.q}
            onChange={handleFilterChange}
            placeholder="搜尋摘要、目標或操作人"
          />
        </label>
        <label>
          <span>操作類型</span>
          <select
            name="actionType"
            value={filters.actionType}
            onChange={handleFilterChange}
          >
            {actionTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>目標類型</span>
          <select
            name="targetType"
            value={filters.targetType}
            onChange={handleFilterChange}
          >
            {targetTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>操作人 email</span>
          <input
            type="email"
            name="actorEmail"
            value={filters.actorEmail}
            onChange={handleFilterChange}
            placeholder="admin@example.com"
          />
        </label>
        <label>
          <span>開始日期</span>
          <input
            type="date"
            name="dateFrom"
            value={filters.dateFrom}
            onChange={handleFilterChange}
          />
        </label>
        <label>
          <span>結束日期</span>
          <input
            type="date"
            name="dateTo"
            value={filters.dateTo}
            onChange={handleFilterChange}
          />
        </label>
        <div className={styles.filterActions}>
          <button type="submit" className={styles.primaryButton}>
            搜尋
          </button>
          <button type="button" className={styles.secondaryButton} onClick={handleClear}>
            清除
          </button>
        </div>
      </form>

      <div className={styles.card}>
        <div className={styles.tableHeader}>
          <p>
            共 {summary.totalRecords ?? pagination.total ?? 0} 筆紀錄
          </p>
          <p>
            第 {pagination.page} / {pagination.pages || 1} 頁
          </p>
        </div>

        {loading && records.length === 0 ? (
          <div className={styles.empty}>正在載入操作紀錄...</div>
        ) : records.length === 0 ? (
          <div className={styles.empty}>暫時沒有操作紀錄</div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>時間</th>
                  <th>操作人</th>
                  <th>操作類型</th>
                  <th>目標</th>
                  <th>摘要</th>
                  <th>查看詳情</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => {
                  const isExpanded = expandedId === record._id;

                  return (
                    <React.Fragment key={record._id}>
                      <tr>
                        <td data-label="時間">{formatDateTime(record.createdAt)}</td>
                        <td data-label="操作人">
                          <strong>{record.actorName || "-"}</strong>
                          <small>{record.actorEmail || "-"}</small>
                        </td>
                        <td data-label="操作類型">
                          <span className={styles.badge}>
                            {record.actionLabel || record.actionType}
                          </span>
                          <small>{record.actionType}</small>
                        </td>
                        <td data-label="目標">
                          <strong>{record.targetLabel || shortId(record.targetId)}</strong>
                          <small>
                            {record.targetType} {record.targetId || ""}
                          </small>
                        </td>
                        <td data-label="摘要">{record.summary || "-"}</td>
                        <td data-label="查看詳情">
                          <button
                            type="button"
                            className={styles.detailButton}
                            onClick={() =>
                              setExpandedId(isExpanded ? "" : record._id)
                            }
                          >
                            {isExpanded ? "收起" : "查看詳情"}
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className={styles.detailRow}>
                          <td colSpan="6">
                            <div className={styles.detailPanel}>
                              <JsonBlock title="變更前" value={record.before} />
                              <JsonBlock title="變更後" value={record.after} />
                              <JsonBlock title="補充資料" value={record.metadata} />
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className={styles.pagination}>
          <button
            type="button"
            onClick={() => goToPage(pagination.page - 1)}
            disabled={pagination.page <= 1 || loading}
          >
            上一頁
          </button>
          <span>
            {pagination.page} / {pagination.pages || 1}
          </span>
          <button
            type="button"
            onClick={() => goToPage(pagination.page + 1)}
            disabled={pagination.page >= (pagination.pages || 1) || loading}
          >
            下一頁
          </button>
        </div>
      </div>
    </section>
  );
};

export default AuditLogs;
