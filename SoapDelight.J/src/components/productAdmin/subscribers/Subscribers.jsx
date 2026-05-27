import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import subscriberService from "./subscriberService";
import "./Subscribers.scss";

const statusFilters = [
  { label: "全部", value: "all" },
  { label: "已註冊用戶", value: "registered" },
  { label: "有效訂閱者", value: "active" },
  { label: "已取消訂閱", value: "unsubscribed" },
  { label: "未訂閱", value: "not_subscribed" },
  { label: "公開頁訂閱者", value: "public_only" },
];

const formatDate = (date) => {
  if (!date) return "-";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getAccountBadge = (accountStatus) => {
  if (accountStatus === "public_only") {
    return {
      label: "公開頁訂閱者",
      className: "is-public",
    };
  }

  return {
    label: "已註冊",
    className: "is-registered",
  };
};

const getSubscriptionBadge = (subscriptionStatus) => {
  if (subscriptionStatus === "active") {
    return {
      label: "有效",
      className: "is-active",
    };
  }

  if (subscriptionStatus === "unsubscribed") {
    return {
      label: "已取消",
      className: "is-unsubscribed",
    };
  }

  return {
    label: "未訂閱",
    className: "is-not-subscribed",
  };
};

const Subscribers = () => {
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const loadSubscribers = async () => {
    setIsLoading(true);
    try {
      const data = await subscriberService.getSubscribers({ status, q: searchTerm });
      setRows(Array.isArray(data) ? data : []);
    } catch (error) {
      const message = error.response?.data?.message || error.message || "未能載入訂閱概覽";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadSubscribers();
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [status, searchTerm]);

  return (
    <section className="subscribers-page">
      <header className="subscribers-header">
        <div className="subscribers-copy">
          <p className="subscribers-eyebrow">訂閱者</p>
          <h2 className="subscribers-title">訂閱與用戶</h2>
          <p className="subscribers-subtitle">
            查看已註冊用戶、公開頁訂閱者及訂閱狀態。
          </p>
        </div>
      </header>

      <div className="subscribers-panel">
        <div className="subscribers-toolbar">
          <div className="subscribers-filters" aria-label="訂閱狀態篩選">
            {statusFilters.map((filter) => (
              <button
                key={filter.value}
                type="button"
                className={`subscribers-filter ${status === filter.value ? "is-active" : ""}`}
                onClick={() => setStatus(filter.value)}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <label className="subscribers-search">
            <span className="sr-only">搜尋訂閱者</span>
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="搜尋電郵、姓名或電話"
            />
          </label>
        </div>

        <div className="subscribers-table-wrap">
          {isLoading ? (
            <p className="subscribers-empty">正在載入訂閱概覽...</p>
          ) : rows.length === 0 ? (
            <p className="subscribers-empty">此篩選條件下沒有紀錄。</p>
          ) : (
            <table className="subscribers-table">
              <thead>
                <tr>
                  <th>電郵</th>
                  <th>姓名 / 用戶名稱</th>
                  <th>電話</th>
                  <th>帳戶</th>
                  <th>訂閱狀態</th>
                  <th>渠道</th>
                  <th>來源</th>
                  <th>註冊日期</th>
                  <th>訂閱日期</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const accountBadge = getAccountBadge(row.accountStatus);
                  const subscriptionBadge = getSubscriptionBadge(row.subscriptionStatus);
                  return (
                    <tr
                      key={`${row.userId || "public"}-${row.subscriberId || row.email}`}
                      className={row.subscriptionStatus === "not_subscribed" ? "is-muted" : ""}
                    >
                      <td>
                        <strong className="subscribers-email">{row.email}</strong>
                      </td>
                      <td>{row.username || row.name || "-"}</td>
                      <td>{row.phone || "-"}</td>
                      <td>
                        <span className={`subscribers-badge ${accountBadge.className}`}>
                          {accountBadge.label}
                        </span>
                      </td>
                      <td>
                        <span className={`subscribers-badge ${subscriptionBadge.className}`}>
                          {subscriptionBadge.label}
                        </span>
                      </td>
                      <td>
                        {row.preferredChannels?.length ? (
                          <div className="subscribers-channel-list">
                            {row.preferredChannels.map((channel) => (
                              <span
                                key={`${row.email}-${channel}`}
                                className="subscribers-channel"
                              >
                                {channel === "email" ? "電郵" : channel === "whatsapp" ? "WhatsApp" : channel}
                              </span>
                            ))}
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td>{row.source || "-"}</td>
                      <td>{formatDate(row.registeredAt)}</td>
                      <td>{formatDate(row.subscribedAt || row.unsubscribedAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </section>
  );
};

export default Subscribers;
