import React, { useState } from 'react'
import { AiOutlineCloudUpload } from 'react-icons/ai'
import { BsTrash } from "react-icons/bs";
import { toast } from "react-toastify";


const UploadWidget = ({ files, setFiles }) => {
    const [selectedImages, setSelectedImages] = useState([]);
    const [images, setImages] = useState([]);
    const [progress, setProgress] = useState(0);
    const [uploading, setUploading] = useState(false);

    const upload_preset = import.meta.env.VITE_REACT_APP_UPLOAD_PRESET
    const url = "https://api.cloudinary.com/v1_1/dozg9wdh1/image/upload"

    const addImages = (e) => {
        const selectedFiles = e.target.files;
        const selectedFilesArray = Array.from(selectedFiles);
    
        const imagesArray = selectedFilesArray.map((file) => {
          return URL.createObjectURL(file);
        });
    
        setImages((previousImages) => previousImages.concat(selectedFilesArray));
        console.log(images);
        setSelectedImages((previousImages) => previousImages.concat(imagesArray));
    
        // FOR BUG IN CHROME
        e.target.value = "";
    };

    const removeImage = (image) => {
        const imageIndex = selectedImages.indexOf(image);
        setSelectedImages(selectedImages.filter((img) => img !== image));
    
        setImages(images.filter((img, index) => index !== imageIndex));
        URL.revokeObjectURL(image);
    };



    const uploadImages = async () => {
        setUploading(true);
        // console.log(images);
        let imageUrls = [];
        const formData = new FormData();
        for (let i = 0; i < images.length; i++) {
          let file = images[i];
          formData.append("file", file);
          formData.append("upload_preset", upload_preset);
          formData.append("folder", "soapdelight-product");
    
          fetch(url, {
            method: "POST",
            body: formData,
          })
            .then((response) => {
              return response.json();
            })
            .then((data) => {
                console.log(data);
              imageUrls.push(data.secure_url);
              setProgress(imageUrls.length);
    
            if (imageUrls.length === images.length) {
                setFiles((prevFiles) => prevFiles.concat(imageUrls));
                setUploading(false);
                console.log(files);
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
    <div>
      <div className='mb-5'>
        <label className='uploadWidget'>
            <AiOutlineCloudUpload size={35} />
            <br />
            <span>Click to upload Up to 5 images</span>
            <input
                type="file"
                name="images"
                onChange={addImages}
                multiple
                accept="image/png , image/jpeg, image/webp"
            />

        </label>
        <br />
        {selectedImages.length > 0 &&
            (selectedImages.length > 5 ? (
                <p className='error'>
                    You can't upload more than 5 images! <br />
                    <span>
                        please remove <b> {selectedImages.length - 5} </b> of them.
                    </span>
                </p>
            ) : (
                    <div className="--center-all">
                        <button
                            className="--btn --btn-danger"
                            disabled={uploading}
                            onClick={() => {
                            uploadImages();
                            }}
                        >
                            {uploading
                            ? `Uploading... ${progress} of ${selectedImages.length}`
                            : `Upload ${selectedImages.length} Image${
                                selectedImages.length === 1 ? "" : "s"
                            }`}
                        </button>
                    </div>
            ))
        }
            {/* View Selected Images */}
            <div className={selectedImages.length > 0 ? "images" : ""}>
                {selectedImages !== 0 &&
                    selectedImages.map((image,index) => {
                        return (
                            <div key={image} className='iamge'>
                                <img src={image} alt="productImage"  width={200}/>
                                <div className='flex justify-between'>
                                    <p className='flex items-center justify-center px-10'>{index + 1}</p>
                                    <button className="--btn" onClick={() => removeImage(image)}>
                                        <BsTrash size={25} onClick={() => removeImage(image)}/>
                                    </button>
                                </div>

                            </div>
                        )
                    })
                }
            </div>
      </div>
    </div>
  )
}

export default UploadWidget
