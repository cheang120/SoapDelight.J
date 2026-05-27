import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import campaignService from "./campaignService";
import "./Campaigns.scss";

const initialForm = {
  title: "",
  subject: "",
  message: "",
  couponCode: "",
  buttonLabel: "",
  buttonLink: "",
};

const formatDate = (date) => {
  if (!date) return "-";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getStatusLabel = (status) => {
  if (status === "sent") return "Sent";
  if (status === "failed") return "Failed";
  if (status === "test_sent") return "Test sent";
  return "Draft";
};

const Campaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [formData, setFormData] = useState(initialForm);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [testEmail, setTestEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [eligibleRecipientCount, setEligibleRecipientCount] = useState(0);
  const [isLoadingRecipientCount, setIsLoadingRecipientCount] = useState(false);

  const selectedStatus = selectedCampaign?.status || "draft";
  const isEditableDraft = selectedStatus === "draft";
  const isSavedDraft = Boolean(selectedCampaign?._id);
  const isSent = selectedStatus === "sent";
  const previewButtonLabel = formData.buttonLabel || "Shop Now";

  const canSend = useMemo(
    () => isSavedDraft && !isSent && eligibleRecipientCount > 0,
    [eligibleRecipientCount, isSavedDraft, isSent]
  );

  const loadCampaigns = async () => {
    setIsLoading(true);
    try {
      const data = await campaignService.getCampaigns();
      setCampaigns(Array.isArray(data) ? data : []);
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Unable to load campaigns";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadEligibleRecipientCount = async () => {
    setIsLoadingRecipientCount(true);
    try {
      const data = await campaignService.getEligibleRecipientCount();
      setEligibleRecipientCount(Number(data?.count || 0));
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Unable to load recipient count";
      toast.error(message);
      setEligibleRecipientCount(0);
    } finally {
      setIsLoadingRecipientCount(false);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    loadCampaigns();
    loadEligibleRecipientCount();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setFormData(initialForm);
    setSelectedCampaign(null);
    setTestEmail("");
  };

  const getPayload = () => ({
    ...formData,
    couponCode: formData.couponCode.trim().toUpperCase(),
  });

  const saveDraft = async (event) => {
    event.preventDefault();

    if (!isEditableDraft) {
      toast.error("Only draft campaigns can be edited.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = getPayload();
      const savedCampaign = isSavedDraft
        ? await campaignService.updateCampaign(selectedCampaign._id, payload)
        : await campaignService.createCampaign(payload);

      setSelectedCampaign(savedCampaign);
      setFormData({
        title: savedCampaign.title || "",
        subject: savedCampaign.subject || "",
        message: savedCampaign.message || "",
        couponCode: savedCampaign.couponCode || "",
        buttonLabel: savedCampaign.buttonLabel || "",
        buttonLink: savedCampaign.buttonLink || "",
      });
      toast.success("Campaign draft saved.");
      await loadCampaigns();
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Unable to save campaign";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const loadCampaign = (campaign) => {
    setSelectedCampaign(campaign);
    setFormData({
      title: campaign.title || "",
      subject: campaign.subject || "",
      message: campaign.message || "",
      couponCode: campaign.couponCode || "",
      buttonLabel: campaign.buttonLabel || "",
      buttonLink: campaign.buttonLink || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const sendTest = async () => {
    if (!isSavedDraft) {
      toast.error("Please save this campaign as a draft before sending a test email.");
      return;
    }

    setIsTesting(true);
    try {
      await campaignService.sendTestCampaign(selectedCampaign._id, testEmail);
      toast.success("Test email sent.");
      await loadCampaigns();
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Unable to send test email";
      toast.error(message);
    } finally {
      setIsTesting(false);
    }
  };

  const sendToSubscribers = async () => {
    if (!canSend) {
      toast.error("Please save this campaign before sending.");
      return;
    }

    const confirmed = window.confirm(
      `Send this campaign to ${eligibleRecipientCount} active email subscribers? This cannot be undone.`
    );
    if (!confirmed) return;

    setIsSending(true);
    try {
      const data = await campaignService.sendCampaign(selectedCampaign._id);
      toast.success(
        `Campaign sent to ${data.sentCount || 0} subscribers. Failed: ${data.failedCount || 0}.`
      );
      setSelectedCampaign(data.campaign);
      await loadCampaigns();
      await loadEligibleRecipientCount();
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Unable to send campaign";
      toast.error(message);
    } finally {
      setIsSending(false);
    }
  };

  const deleteDraft = async (campaign) => {
    const confirmed = window.confirm(`Delete draft campaign "${campaign.title}"?`);
    if (!confirmed) return;

    try {
      await campaignService.deleteCampaign(campaign._id);
      toast.success("Draft campaign deleted.");
      if (selectedCampaign?._id === campaign._id) {
        resetForm();
      }
      await loadCampaigns();
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Unable to delete campaign";
      toast.error(message);
    }
  };

  return (
    <section className="campaigns-page">
      <header className="campaigns-header">
        <p className="campaigns-eyebrow">EMAIL</p>
        <h2 className="campaigns-title">Email Campaigns / 電郵推廣</h2>
        <p className="campaigns-subtitle">
          Create and send promotional emails to active subscribers.
        </p>
      </header>

      <div className="campaigns-grid">
        <form className="campaigns-panel campaigns-form" onSubmit={saveDraft}>
          <div className="campaigns-panel-heading">
            <h3>{isSavedDraft ? "Edit campaign draft" : "Create campaign draft"}</h3>
            <p>Save a draft before sending tests or delivering to subscribers.</p>
          </div>

          <label className="campaigns-field">
            <span>Campaign title</span>
            <input
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Spring handmade soap offer"
              disabled={!isEditableDraft}
              required
            />
          </label>

          <label className="campaigns-field">
            <span>Email subject</span>
            <input
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder="A gentle update from SoapDelight.J"
              disabled={!isEditableDraft}
              required
            />
          </label>

          <label className="campaigns-field campaigns-field--full">
            <span>Message</span>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Share a short product update, offer or announcement."
              disabled={!isEditableDraft}
              required
            />
          </label>

          <label className="campaigns-field">
            <span>Coupon code optional</span>
            <input
              name="couponCode"
              value={formData.couponCode}
              onChange={handleChange}
              placeholder="TESTB"
              disabled={!isEditableDraft}
            />
          </label>

          <label className="campaigns-field">
            <span>Button label optional</span>
            <input
              name="buttonLabel"
              value={formData.buttonLabel}
              onChange={handleChange}
              placeholder="Shop Now"
              disabled={!isEditableDraft}
            />
          </label>

          <label className="campaigns-field campaigns-field--full">
            <span>Button link optional</span>
            <input
              name="buttonLink"
              value={formData.buttonLink}
              onChange={handleChange}
              placeholder="https://soapdelight-j.onrender.com/shop"
              disabled={!isEditableDraft}
            />
          </label>

          <div className="campaigns-actions campaigns-field--full">
            <button type="submit" className="campaigns-button" disabled={isSaving || !isEditableDraft}>
              {isSaving ? "Saving..." : isSavedDraft ? "Update Draft" : "Save Draft"}
            </button>
            <button
              type="button"
              className="campaigns-button campaigns-button--secondary"
              onClick={resetForm}
            >
              New Draft
            </button>
          </div>
        </form>

        <aside className="campaigns-panel campaigns-preview">
          <div className="campaigns-panel-heading">
            <h3>Email preview</h3>
            <p>This preview uses the same content sent through the campaign email template.</p>
          </div>

          <div className="campaigns-preview-card">
            <p className="campaigns-preview-subject">
              {formData.subject || "Email subject"}
            </p>
            <h4>{formData.title || "Campaign title"}</h4>
            <p>{formData.message || "Your campaign message will appear here."}</p>
            {formData.couponCode && (
              <div className="campaigns-coupon-preview">
                Coupon code: <strong>{formData.couponCode.toUpperCase()}</strong>
              </div>
            )}
            {formData.buttonLink && (
              <a href={formData.buttonLink} className="campaigns-preview-button">
                {previewButtonLabel}
              </a>
            )}
            <p className="campaigns-preview-footer">
              You are receiving this email because you subscribed to SoapDelight.J updates.
              Every subscriber email includes an unsubscribe link.
            </p>
          </div>

          <div className="campaigns-test-box">
            <label className="campaigns-field">
              <span>Test email</span>
              <input
                type="email"
                value={testEmail}
                onChange={(event) => setTestEmail(event.target.value)}
                placeholder="admin@example.com"
              />
            </label>
            <button
              type="button"
              className="campaigns-button campaigns-button--secondary"
              onClick={sendTest}
              disabled={isTesting || !isSavedDraft}
            >
              {isTesting ? "Sending..." : "Send Test Email"}
            </button>
          </div>

          <div className="campaigns-recipient-count">
            <span>Eligible email recipients</span>
            <strong>
              {isLoadingRecipientCount ? "Loading..." : eligibleRecipientCount}
            </strong>
            {eligibleRecipientCount === 0 && !isLoadingRecipientCount && (
              <p>No active email subscribers available.</p>
            )}
          </div>

          <button
            type="button"
            className="campaigns-button campaigns-button--send"
            onClick={sendToSubscribers}
            disabled={isSending || !canSend || isLoadingRecipientCount}
          >
            {isSending ? "Sending..." : isSent ? "Campaign Sent" : "Send to Subscribers"}
          </button>
        </aside>
      </div>

      <div className="campaigns-panel">
        <div className="campaigns-panel-heading">
          <h3>Campaign history</h3>
          <p>Sent campaigns remain as records. Draft campaigns can still be edited or deleted.</p>
        </div>

        <div className="campaigns-table-wrap">
          {isLoading ? (
            <p className="campaigns-empty">Loading campaigns...</p>
          ) : campaigns.length === 0 ? (
            <p className="campaigns-empty">No campaigns yet.</p>
          ) : (
            <table className="campaigns-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Subject</th>
                  <th>Status</th>
                  <th>Sent</th>
                  <th>Failed</th>
                  <th>Sent at</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign) => (
                  <tr key={campaign._id}>
                    <td>{campaign.title}</td>
                    <td>{campaign.subject}</td>
                    <td>
                      <span className={`campaigns-status is-${campaign.status || "draft"}`}>
                        {getStatusLabel(campaign.status)}
                      </span>
                    </td>
                    <td>{campaign.sentCount || 0}</td>
                    <td>{campaign.failedCount || 0}</td>
                    <td>{formatDate(campaign.sentAt)}</td>
                    <td>{formatDate(campaign.createdAt)}</td>
                    <td>
                      <div className="campaigns-row-actions">
                        <button
                          type="button"
                          className="campaigns-mini-button"
                          onClick={() => loadCampaign(campaign)}
                        >
                          {campaign.status === "sent" ? "View" : "Load/Edit"}
                        </button>
                        {campaign.status === "draft" && (
                          <button
                            type="button"
                            className="campaigns-mini-button campaigns-mini-button--danger"
                            onClick={() => deleteDraft(campaign)}
                          >
                            Delete Draft
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </section>
  );
};

export default Campaigns;
