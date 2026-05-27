import React, { useState } from "react";
import { AiOutlineCloudUpload } from "react-icons/ai";
import { BsTrash } from "react-icons/bs";
import { toast } from "react-toastify";

const UploadWidget = ({ files, setFiles }) => {
  const [selectedImages, setSelectedImages] = useState([]);
  const [images, setImages] = useState([]);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const upload_preset = import.meta.env.VITE_REACT_APP_UPLOAD_PRESET;
  const url = "https://api.cloudinary.com/v1_1/dozg9wdh1/image/upload";

  const addImages = (e) => {
    const selectedFiles = e.target.files;

    if (!selectedFiles || selectedFiles.length === 0) {
      return;
    }

    const selectedFilesArray = Array.from(selectedFiles);
    const imagesArray = selectedFilesArray.map((file) => URL.createObjectURL(file));

    setImages((previousImages) => previousImages.concat(selectedFilesArray));
    setSelectedImages((previousImages) => previousImages.concat(imagesArray));

    e.target.value = "";
  };

  const removeImage = (image) => {
    const imageIndex = selectedImages.indexOf(image);

    setSelectedImages(selectedImages.filter((img) => img !== image));
    setImages(images.filter((img, index) => index !== imageIndex));
    URL.revokeObjectURL(image);
  };

  const uploadImages = async () => {
    if (images.length === 0) {
      return;
    }

    setUploading(true);

    const imageUrls = [];

    for (let i = 0; i < images.length; i++) {
      const file = images[i];
      const formData = new FormData();

      formData.append("file", file);
      formData.append("upload_preset", upload_preset);
      formData.append("folder", "soapdelight-product");

      fetch(url, {
        method: "POST",
        body: formData,
      })
        .then((response) => response.json())
        .then((data) => {
          imageUrls.push(data.secure_url);
          setProgress(imageUrls.length);

          if (imageUrls.length === images.length) {
            setFiles((prevFiles) => prevFiles.concat(imageUrls));
            setUploading(false);
            toast.success("圖片上傳完成");
            setImages([]);
            setSelectedImages([]);
            setProgress(0);
          }
        })
        .catch((error) => {
          setUploading(false);
          toast.error(error.message);
          console.log(error);
        });
    }
  };

  return (
    <div className="admin-upload-widget">
      <div className="uploadWidget uploadWidgetNative">
        <AiOutlineCloudUpload size={35} />
        <span>選擇商品圖片</span>
        <small>使用下方檔案選擇器，上傳最多 5 張圖片。</small>

        <input
          className="uploadNativeInput"
          type="file"
          name="images"
          onChange={addImages}
          multiple
          accept="image/png,image/jpeg,image/webp"
        />
      </div>

      {selectedImages.length > 0 &&
        (selectedImages.length > 5 ? (
          <p className="error">
            最多只可上傳 5 張圖片！<br />
            <span>
              請移除其中 <b>{selectedImages.length - 5}</b> 張。
            </span>
          </p>
        ) : (
          <div className="--center-all">
            <button
              className="upload-btn"
              disabled={uploading}
              onClick={uploadImages}
              type="button"
            >
              {uploading
                ? `上傳中... ${progress} / ${selectedImages.length}`
                : `上傳 ${selectedImages.length} 張圖片`}
            </button>
          </div>
        ))}

      <div className={selectedImages.length > 0 ? "images" : ""}>
        {selectedImages.length > 0 &&
          selectedImages.map((image, index) => {
            return (
              <div key={image} className="image">
                <img src={image} alt="商品圖片" width={200} />
                <div className="flex justify-between">
                  <p className="flex items-center justify-center px-10">
                    {index + 1}
                  </p>
                  <button
                    className="--btn"
                    onClick={() => removeImage(image)}
                    type="button"
                  >
                    <BsTrash size={25} />
                  </button>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default UploadWidget;
