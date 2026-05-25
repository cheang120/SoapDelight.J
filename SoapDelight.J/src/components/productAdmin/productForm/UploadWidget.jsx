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
            toast.success("Image upload complete");
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
        <span>Choose product images</span>
        <small>Use the file picker below to upload up to 5 images.</small>

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
            You can't upload more than 5 images! <br />
            <span>
              please remove <b>{selectedImages.length - 5}</b> of them.
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
                ? `Uploading... ${progress} of ${selectedImages.length}`
                : `Upload ${selectedImages.length} Image${
                    selectedImages.length === 1 ? "" : "s"
                  }`}
            </button>
          </div>
        ))}

      <div className={selectedImages.length > 0 ? "images" : ""}>
        {selectedImages.length > 0 &&
          selectedImages.map((image, index) => {
            return (
              <div key={image} className="image">
                <img src={image} alt="productImage" width={200} />
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
