import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import companyProfileService from "./companyProfileService";
import "./CompanyProfile.scss";

const initialState = {
  businessName: "",
  contactName: "",
  phone: "",
  email: "",
  facebookPage: "",
  address: "",
  bankName: "",
  bankAccountName: "",
  bankAccountNumber: "",
  chequePayableTo: "",
  note: "",
};

const placeholders = {
  businessName: "SoapDelight.J",
  contactName: "馮宇莉",
  phone: "66157169",
  email: "lily124u@yahoo.com.hk",
  facebookPage: "https://www.facebook.com/p/SoapDelightJ-61555597584696/",
  bankName: "中國銀行",
  bankAccountName: "FONG U LEI",
  bankAccountNumber: "182101102291546",
  chequePayableTo: "馮宇莉",
};

const CompanyProfile = () => {
  const [formData, setFormData] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await companyProfileService.getCompanyProfile();
      setFormData({
        ...initialState,
        ...(data && typeof data === "object" ? data : {}),
      });
    } catch (error) {
      toast.error(error?.response?.data?.message || "未能載入商戶資料");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    loadProfile();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setSaving(true);
    try {
      const payload = {
        businessName: formData.businessName.trim(),
        contactName: formData.contactName.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        facebookPage: formData.facebookPage.trim(),
        address: formData.address.trim(),
        bankName: formData.bankName.trim(),
        bankAccountName: formData.bankAccountName.trim(),
        bankAccountNumber: formData.bankAccountNumber.trim(),
        chequePayableTo: formData.chequePayableTo.trim(),
        note: formData.note.trim(),
      };

      const updatedProfile = await companyProfileService.updateCompanyProfile(
        payload
      );
      setFormData({
        ...initialState,
        ...(updatedProfile && typeof updatedProfile === "object"
          ? updatedProfile
          : payload),
      });
      toast.success("商戶資料已儲存");
    } catch (error) {
      toast.error(error?.response?.data?.message || "未能儲存商戶資料");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="company-profile-page">
      <header className="company-profile-header">
        <div className="company-profile-header__copy">
          <p className="company-profile-header__eyebrow">商戶設定</p>
          <h2 className="company-profile-header__title">商戶資料</h2>
          <p className="company-profile-header__subtitle">
            這些資料會用於寄售清單、Invoice 及日後 PDF 文件。
          </p>
        </div>
      </header>

      <form className="company-profile-stack" onSubmit={handleSubmit}>
        <section className="company-profile-card">
          <div className="company-profile-card__copy">
            <h3>商戶基本資料</h3>
            <p>先設定品牌與聯絡資料，方便日後文件及對外聯絡使用。</p>
          </div>

          <div className="company-profile-grid">
            <label className="company-profile-field">
              <span>公司 / 品牌名稱</span>
              <input
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                placeholder={placeholders.businessName}
              />
            </label>

            <label className="company-profile-field">
              <span>聯絡人</span>
              <input
                name="contactName"
                value={formData.contactName}
                onChange={handleChange}
                placeholder={placeholders.contactName}
              />
            </label>

            <label className="company-profile-field">
              <span>電話</span>
              <input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder={placeholders.phone}
              />
            </label>

            <label className="company-profile-field">
              <span>電郵</span>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder={placeholders.email}
              />
            </label>

            <label className="company-profile-field company-profile-field--wide">
              <span>Facebook 專頁</span>
              <input
                name="facebookPage"
                value={formData.facebookPage}
                onChange={handleChange}
                placeholder={placeholders.facebookPage}
              />
            </label>

            <label className="company-profile-field company-profile-field--wide">
              <span>地址</span>
              <textarea
                name="address"
                rows="3"
                value={formData.address}
                onChange={handleChange}
                placeholder="請輸入地址"
              />
            </label>
          </div>
        </section>

        <section className="company-profile-card">
          <div className="company-profile-card__copy">
            <h3>Invoice / 收款資料</h3>
            <p>這些資料會作為收款及支票抬頭的基礎來源。</p>
          </div>

          <div className="company-profile-grid">
            <label className="company-profile-field">
              <span>銀行名稱</span>
              <input
                name="bankName"
                value={formData.bankName}
                onChange={handleChange}
                placeholder={placeholders.bankName}
              />
            </label>

            <label className="company-profile-field">
              <span>戶口名稱</span>
              <input
                name="bankAccountName"
                value={formData.bankAccountName}
                onChange={handleChange}
                placeholder={placeholders.bankAccountName}
              />
            </label>

            <label className="company-profile-field">
              <span>戶口號碼</span>
              <input
                name="bankAccountNumber"
                value={formData.bankAccountNumber}
                onChange={handleChange}
                placeholder={placeholders.bankAccountNumber}
              />
            </label>

            <label className="company-profile-field">
              <span>支票抬頭</span>
              <input
                name="chequePayableTo"
                value={formData.chequePayableTo}
                onChange={handleChange}
                placeholder={placeholders.chequePayableTo}
              />
            </label>

            <label className="company-profile-field company-profile-field--wide">
              <span>備註</span>
              <textarea
                name="note"
                rows="4"
                value={formData.note}
                onChange={handleChange}
                placeholder="可填寫補充說明或文件顯示備註"
              />
            </label>
          </div>
        </section>

        <div className="company-profile-actions">
          <button type="submit" disabled={loading || saving}>
            {saving ? "儲存中..." : "儲存商戶資料"}
          </button>
        </div>

        {loading && (
          <p className="company-profile-loading">載入商戶資料中...</p>
        )}
      </form>
    </section>
  );
};

export default CompanyProfile;
