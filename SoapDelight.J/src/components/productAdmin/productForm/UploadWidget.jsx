import React, { useState } from 'react'
import { AiOutlineCloudUpload } from 'react-icons/ai'
import { BsTrash } from "react-icons/bs";
import { toast } from "react-toastify";


const UploadWidget = () => {
    const [selectedImages, setSelectedImages] = useState([]);
    const [images, setImages] = useState([]);
    const [progress, setProgress] = useState(0);
    const [uploading, setUploading] = useState(false);

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
