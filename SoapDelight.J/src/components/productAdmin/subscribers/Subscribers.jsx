import React, { useEffect, useState } from "react";
import { FaTrashAlt } from "react-icons/fa";
import { toast } from "react-toastify";
import subscriberService from "./subscriberService";
import "./Subscribers.scss";

const statusFilters = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Unsubscribed", value: "unsubscribed" },
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

const Subscribers = () => {
  const [subscribers, setSubscribers] = useState([]);
  const [status, setStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const loadSubscribers = async () => {
    setIsLoading(true);
    try {
      const data = await subscriberService.getSubscribers({ status, q: searchTerm });
      setSubscribers(Array.isArray(data) ? data : []);
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Unable to load subscribers";
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

  const handleStatusChange = async (subscriber, nextStatus) => {
    try {
      await subscriberService.updateSubscriber(subscriber._id, { status: nextStatus });
      toast.success(nextStatus === "active" ? "Subscriber marked active" : "Subscriber unsubscribed");
      await loadSubscribers();
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Unable to update subscriber";
      toast.error(message);
    }
  };

  const handleDelete = async (subscriber) => {
    const shouldDelete = window.confirm(`Delete subscriber "${subscriber.email}"?`);
    if (!shouldDelete) return;

    try {
      await subscriberService.deleteSubscriber(subscriber._id);
      toast.success("Subscriber deleted");
      await loadSubscribers();
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Unable to delete subscriber";
      toast.error(message);
    }
  };

  return (
    <section className="subscribers-page">
      <header className="subscribers-header">
        <div className="subscribers-copy">
          <p className="subscribers-eyebrow">SUBSCRIBERS</p>
          <h2 className="subscribers-title">Newsletter Subscribers</h2>
          <p className="subscribers-subtitle">
            Review customers who opted in for email updates and future WhatsApp messages.
          </p>
          <p className="subscribers-link-note">
            Public subscribe page: <code>/subscribe</code>
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
            <p className="subscribers-empty">Loading subscribers...</p>
          ) : subscribers.length === 0 ? (
            <p className="subscribers-empty">No subscribers found</p>
          ) : (
            <table className="subscribers-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Channels</th>
                  <th>Status</th>
                  <th>Source</th>
                  <th>Subscribed</th>
                  <th className="subscribers-table-head-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((subscriber) => {
                  const isActive = subscriber.status === "active";
                  return (
                    <tr key={subscriber._id} className={!isActive ? "is-muted" : ""}>
                      <td>
                        <strong className="subscribers-email">{subscriber.email}</strong>
                      </td>
                      <td>{subscriber.name || "-"}</td>
                      <td>{subscriber.phone || "-"}</td>
                      <td>
                        <div className="subscribers-channel-list">
                          {(subscriber.preferredChannels || ["email"]).map((channel) => (
                            <span key={channel} className="subscribers-channel">
                              {channel}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <span className={`subscribers-badge ${isActive ? "is-active" : "is-muted"}`}>
                          {isActive ? "Active" : "Unsubscribed"}
                        </span>
                      </td>
                      <td>{subscriber.source || "website"}</td>
                      <td>{formatDate(subscriber.lastSubscribedAt || subscriber.createdAt)}</td>
                      <td className="subscribers-action-cell">
                        <button
                          type="button"
                          className="subscribers-action-button"
                          onClick={() => handleStatusChange(subscriber, isActive ? "unsubscribed" : "active")}
                        >
                          {isActive ? "Mark unsubscribed" : "Mark active"}
                        </button>
                        <button
                          type="button"
                          className="subscribers-icon-button subscribers-icon-button--delete"
                          aria-label={`Delete subscriber ${subscriber.email}`}
                          onClick={() => handleDelete(subscriber)}
                        >
                          <FaTrashAlt size={15} />
                        </button>
                      </td>
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
