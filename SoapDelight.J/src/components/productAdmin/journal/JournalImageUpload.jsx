import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

const uploadPreset = import.meta.env.VITE_REACT_APP_UPLOAD_PRESET;
const uploadUrl = "https://api.cloudinary.com/v1_1/dozg9wdh1/image/upload";
const uploadFolder = "soapdelight-journal";
let activeJournalUploadKey = "";

const JournalImageUpload = ({
  label,
  value,
  alt,
  uploadKey,
  disabled = false,
  onChange,
  onUploadStateChange,
  onPendingStateChange,
  canStartUpload,
}) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const isMountedRef = useRef(true);
  const fileInputRef = useRef(null);
  const abortControllerRef = useRef(null);
  const uploadKeyRef = useRef(uploadKey);

  useEffect(() => {
    uploadKeyRef.current = uploadKey;
  }, [uploadKey]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      abortControllerRef.current?.abort();
      if (activeJournalUploadKey === uploadKeyRef.current) {
        activeJournalUploadKey = "";
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const clearPreview = ({ notifyPending = true } = {}) => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl("");
    setSelectedFile(null);
    if (notifyPending && selectedFile) {
      onPendingStateChange?.(uploadKey, false);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    onPendingStateChange?.(uploadKey, true);
  };

  const handleUpload = async () => {
    if (disabled || isUploading || !selectedFile) return;

    if (canStartUpload && !canStartUpload()) {
      toast.error("操作進行中，請稍候。");
      return;
    }

    if (activeJournalUploadKey && activeJournalUploadKey !== uploadKey) {
      toast.error("已有圖片正在上傳，請稍候。");
      return;
    }

    if (!uploadPreset) {
      toast.error("缺少 Cloudinary upload preset，暫時未能上傳圖片。");
      return;
    }

    activeJournalUploadKey = uploadKey;
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    setIsUploading(true);
    onUploadStateChange?.(uploadKey, true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("upload_preset", uploadPreset);
      formData.append("folder", uploadFolder);

      const response = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error("圖片上傳失敗，請稍後再試。");
      }

      const data = await response.json();
      if (!data?.secure_url) {
        throw new Error("Cloudinary 未有回傳圖片網址。");
      }

      if (isMountedRef.current) {
        onChange?.(data.secure_url);
        clearPreview();
        toast.success("圖片已上傳，請儲存文章以保存變更。");
      }
    } catch (error) {
      if (error.name !== "AbortError" && isMountedRef.current) {
        toast.error(error.message || "圖片上傳失敗，請稍後再試。");
      }
    } finally {
      if (activeJournalUploadKey === uploadKey) {
        activeJournalUploadKey = "";
      }
      if (isMountedRef.current) {
        onUploadStateChange?.(uploadKey, false);
        setIsUploading(false);
      }
      abortControllerRef.current = null;
    }
  };

  const handleCancelSelection = () => {
    if (isUploading) return;
    clearPreview();
  };

  const handleRemove = () => {
    if (disabled || isUploading) return;
    clearPreview();
    onChange?.("");
  };

  const displayImage = previewUrl || value;

  return (
    <div className="journal-image-upload">
      <div className="journal-image-upload__header">
        <span>{label}</span>
        {value && (
          <button type="button" onClick={handleRemove} disabled={disabled || isUploading}>
            移除圖片
          </button>
        )}
        {selectedFile && (
          <button type="button" onClick={handleCancelSelection} disabled={isUploading}>
            取消選擇
          </button>
        )}
      </div>

      <div className={`journal-image-upload__drop ${displayImage ? "has-image" : ""}`}>
        {displayImage ? (
          <img src={displayImage} alt={alt || label || "文章圖片"} />
        ) : (
          <div>
            <strong>選擇電腦圖片</strong>
            <small>支援 PNG、JPG、WEBP。每次上傳一張圖片。</small>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          disabled={disabled || isUploading}
          onChange={handleFileChange}
        />
      </div>

      <div className="journal-image-upload__actions">
        <button
          type="button"
          className="journal-admin-button journal-admin-button--secondary"
          disabled={disabled || isUploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {value || previewUrl ? "更換圖片" : "選擇圖片"}
        </button>
        <button
          type="button"
          className="journal-admin-button journal-admin-button--primary"
          disabled={disabled || isUploading || !selectedFile}
          onClick={handleUpload}
        >
          {isUploading ? "上傳中..." : "上傳圖片"}
        </button>
      </div>
    </div>
  );
};

export default JournalImageUpload;
