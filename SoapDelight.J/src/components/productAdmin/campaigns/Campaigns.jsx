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
  if (status === "sent") return "已發送";
  if (status === "failed") return "失敗";
  if (status === "test_sent") return "測試已發送";
  return "草稿";
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
  const previewButtonLabel = formData.buttonLabel || "立即選購";

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
      const message = error.response?.data?.message || error.message || "未能載入推廣電郵";
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
      const message = error.response?.data?.message || error.message || "未能載入合資格收件人數量";
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
      toast.error("只有草稿推廣電郵可以編輯。");
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
      toast.success("推廣電郵草稿已儲存。");
      await loadCampaigns();
    } catch (error) {
      const message = error.response?.data?.message || error.message || "未能儲存推廣電郵";
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
      toast.error("請先儲存為草稿，再寄送測試電郵。");
      return;
    }

    setIsTesting(true);
    try {
      await campaignService.sendTestCampaign(selectedCampaign._id, testEmail);
      toast.success("測試電郵已寄出。");
      await loadCampaigns();
    } catch (error) {
      const message = error.response?.data?.message || error.message || "未能寄送測試電郵";
      toast.error(message);
    } finally {
      setIsTesting(false);
    }
  };

  const sendToSubscribers = async () => {
    if (!canSend) {
      toast.error("請先儲存此推廣電郵。");
      return;
    }

    const confirmed = window.confirm(
      `將此推廣電郵寄給 ${eligibleRecipientCount} 位有效電郵訂閱者？此操作無法復原。`
    );
    if (!confirmed) return;

    setIsSending(true);
    try {
      const data = await campaignService.sendCampaign(selectedCampaign._id);
      toast.success(
        `推廣電郵已寄給 ${data.sentCount || 0} 位訂閱者。失敗：${data.failedCount || 0}。`
      );
      setSelectedCampaign(data.campaign);
      await loadCampaigns();
      await loadEligibleRecipientCount();
    } catch (error) {
      const message = error.response?.data?.message || error.message || "未能寄送推廣電郵";
      toast.error(message);
    } finally {
      setIsSending(false);
    }
  };

  const deleteDraft = async (campaign) => {
    const confirmed = window.confirm(`刪除推廣電郵草稿「${campaign.title}」？`);
    if (!confirmed) return;

    try {
      await campaignService.deleteCampaign(campaign._id);
      toast.success("草稿已刪除。");
      if (selectedCampaign?._id === campaign._id) {
        resetForm();
      }
      await loadCampaigns();
    } catch (error) {
      const message = error.response?.data?.message || error.message || "未能刪除草稿";
      toast.error(message);
    }
  };

  return (
    <section className="campaigns-page">
      <header className="campaigns-header">
        <p className="campaigns-eyebrow">電郵</p>
        <h2 className="campaigns-title">推廣電郵</h2>
        <p className="campaigns-subtitle">
          建立並寄送推廣電郵給有效訂閱者。
        </p>
      </header>

      <div className="campaigns-grid">
        <form className="campaigns-panel campaigns-form" onSubmit={saveDraft}>
          <div className="campaigns-panel-heading">
            <h3>{isSavedDraft ? "編輯推廣草稿" : "建立推廣草稿"}</h3>
            <p>請先儲存草稿，才寄送測試或正式發送給訂閱者。</p>
          </div>

          <label className="campaigns-field">
            <span>推廣標題</span>
            <input
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="春季手作皂優惠"
              disabled={!isEditableDraft}
              required
            />
          </label>

          <label className="campaigns-field">
            <span>電郵主旨</span>
            <input
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder="SoapDelight.J 最新消息"
              disabled={!isEditableDraft}
              required
            />
          </label>

          <label className="campaigns-field campaigns-field--full">
            <span>訊息內容</span>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="輸入新品、優惠或公告內容。"
              disabled={!isEditableDraft}
              required
            />
          </label>

          <label className="campaigns-field">
            <span>優惠碼（選填）</span>
            <input
              name="couponCode"
              value={formData.couponCode}
              onChange={handleChange}
              placeholder="TESTB"
              disabled={!isEditableDraft}
            />
          </label>

          <label className="campaigns-field">
            <span>按鈕文字（選填）</span>
            <input
              name="buttonLabel"
              value={formData.buttonLabel}
              onChange={handleChange}
              placeholder="立即選購"
              disabled={!isEditableDraft}
            />
          </label>

          <label className="campaigns-field campaigns-field--full">
            <span>按鈕連結（選填）</span>
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
              {isSaving ? "儲存中..." : isSavedDraft ? "更新草稿" : "儲存草稿"}
            </button>
            <button
              type="button"
              className="campaigns-button campaigns-button--secondary"
              onClick={resetForm}
            >
              新草稿
            </button>
          </div>
        </form>

        <aside className="campaigns-panel campaigns-preview">
          <div className="campaigns-panel-heading">
            <h3>電郵預覽</h3>
            <p>此預覽會使用正式推廣電郵範本的內容。</p>
          </div>

          <div className="campaigns-preview-card">
            <p className="campaigns-preview-subject">
              {formData.subject || "電郵主旨"}
            </p>
            <h4>{formData.title || "推廣標題"}</h4>
            <p>{formData.message || "推廣訊息會顯示在這裡。"}</p>
            {formData.couponCode && (
              <div className="campaigns-coupon-preview">
                優惠碼：<strong>{formData.couponCode.toUpperCase()}</strong>
              </div>
            )}
            {formData.buttonLink && (
              <a href={formData.buttonLink} className="campaigns-preview-button">
                {previewButtonLabel}
              </a>
            )}
            <p className="campaigns-preview-footer">
              你會收到此電郵，是因為你已訂閱 SoapDelight.J 最新消息。
              每封訂閱電郵都會包含取消訂閱連結。
            </p>
          </div>

          <div className="campaigns-test-box">
            <label className="campaigns-field">
              <span>測試電郵</span>
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
              {isTesting ? "寄送中..." : "寄送測試電郵"}
            </button>
          </div>

          <div className="campaigns-recipient-count">
            <span>合資格電郵收件人</span>
            <strong>
              {isLoadingRecipientCount ? "載入中..." : eligibleRecipientCount}
            </strong>
            {eligibleRecipientCount === 0 && !isLoadingRecipientCount && (
              <p>暫未有有效電郵訂閱者。</p>
            )}
          </div>

          <button
            type="button"
            className="campaigns-button campaigns-button--send"
            onClick={sendToSubscribers}
            disabled={isSending || !canSend || isLoadingRecipientCount}
          >
            {isSending ? "寄送中..." : isSent ? "已發送" : "寄送給訂閱者"}
          </button>
        </aside>
      </div>

      <div className="campaigns-panel">
        <div className="campaigns-panel-heading">
          <h3>推廣電郵紀錄</h3>
          <p>已發送的推廣電郵會保留為紀錄；草稿仍可編輯或刪除。</p>
        </div>

        <div className="campaigns-table-wrap">
          {isLoading ? (
            <p className="campaigns-empty">正在載入推廣電郵...</p>
          ) : campaigns.length === 0 ? (
            <p className="campaigns-empty">暫未有推廣電郵。</p>
          ) : (
            <table className="campaigns-table">
              <thead>
                <tr>
                  <th>標題</th>
                  <th>主旨</th>
                  <th>狀態</th>
                  <th>已發送</th>
                  <th>失敗</th>
                  <th>發送時間</th>
                  <th>建立時間</th>
                  <th>操作</th>
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
                          {campaign.status === "sent" ? "查看" : "載入 / 編輯"}
                        </button>
                        {campaign.status === "draft" && (
                          <button
                            type="button"
                            className="campaigns-mini-button campaigns-mini-button--danger"
                            onClick={() => deleteDraft(campaign)}
                          >
                            刪除草稿
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
