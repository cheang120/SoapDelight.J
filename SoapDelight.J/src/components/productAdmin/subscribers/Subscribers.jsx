import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import subscriberService from "./subscriberService";
import "./Subscribers.scss";

const statusFilters = [
  { label: "All", value: "all" },
  { label: "Registered users", value: "registered" },
  { label: "Active subscribers", value: "active" },
  { label: "Unsubscribed", value: "unsubscribed" },
  { label: "Not subscribed", value: "not_subscribed" },
  { label: "Public-only subscribers", value: "public_only" },
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
      label: "Public subscriber only",
      className: "is-public",
    };
  }

  return {
    label: "Registered",
    className: "is-registered",
  };
};

const getSubscriptionBadge = (subscriptionStatus) => {
  if (subscriptionStatus === "active") {
    return {
      label: "Active",
      className: "is-active",
    };
  }

  if (subscriptionStatus === "unsubscribed") {
    return {
      label: "Unsubscribed",
      className: "is-unsubscribed",
    };
  }

  return {
    label: "Not subscribed",
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
      const message = error.response?.data?.message || error.message || "Unable to load subscription overview";
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
          <p className="subscribers-eyebrow">SUBSCRIBERS</p>
          <h2 className="subscribers-title">Subscribers &amp; Users / 訂閱與用戶</h2>
          <p className="subscribers-subtitle">
            Review registered users, public subscribers and subscription status.
          </p>
        </div>
      </header>

      <div className="subscribers-panel">
        <div className="subscribers-toolbar">
          <div className="subscribers-filters" aria-label="Subscriber status filter">
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
            <span className="sr-only">Search subscribers</span>
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search email, name or phone"
            />
          </label>
        </div>

        <div className="subscribers-table-wrap">
          {isLoading ? (
            <p className="subscribers-empty">Loading subscription overview...</p>
          ) : rows.length === 0 ? (
            <p className="subscribers-empty">No records found for this filter.</p>
          ) : (
            <table className="subscribers-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Name / Username</th>
                  <th>Phone</th>
                  <th>Account</th>
                  <th>Subscription</th>
                  <th>Channels</th>
                  <th>Source</th>
                  <th>Registered</th>
                  <th>Subscribed</th>
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
                                {channel}
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
