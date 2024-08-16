import React from 'react'
import "./ProductForm.scss"
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import UploadWidget from './UploadWidget';
import { BsTrash } from 'react-icons/bs';

const ProductForm = ({
    saveProduct, 
    product,
    handleInputChange, 
    categories,
    isEditing,
    filteredBrands,
    description,
    setDescription,
    files,
    setFiles
}) => {

    const removeImage = (image) => {
        console.log(image);
        setFiles(files.filter((img, index) => img !== image));
      };
    
  return (
    <div className="max-w-md   bg-white p-8 shadow-lg rounded-lg">
        {/* <h3 className="text-xl font-bold mb-4">Upload Widget Placeholder</h3> */}
        <UploadWidget files={files} setFiles={setFiles} />

        <form onSubmit={saveProduct}>
            <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Product Images:</label>
                <div className='slide-container'>
                    <aside>
                        {files.length > 0 &&
                            files.map((image) => (
                                <div key={image} className="thumbnail">
                                    <img src={image} alt="productImage"  className='h-32 mb-5'/>
                                    <div>
                                        <BsTrash size={25} className='thumbnailIcon' onClick={() => removeImage(image)}/>
                                    </div>
                                </div>
                            ))
                        }
                        {files.length < 1 && (
                            <p className='--m'>No image set for this poduct.</p>
                        )}
                    </aside>
                </div>
            </div>
            <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Product Name:</label>
                <input
                    type="text"
                    placeholder="Product name"
                    name="name"
                    value={product?.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                />
            </div>

            <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Product Category:</label>
                <select
                    name="category"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={product?.category}
                    onChange={handleInputChange}
                >
                        {isEditing ? (
                        <option>{product?.category}</option>
                    ) : (
                        <option>Select Category</option>
                    )}
                        {categories.length > 0 &&
                        categories.map((cat) => (
                            <option key={cat._id} value={cat._name}>
                            {cat.name}
                            </option>
                        ))}
                    </select>
            </div>

            <div className="mb-4">

                    <label className="block text-gray-700 text-sm font-bold mb-2">Product Brand:</label>
                    <select
                        name="brand"
                        value={product?.brand}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onChange={handleInputChange}
                    >
                        {isEditing ? (
                        <option>{product?.brand}</option>
                        ) : (
                        <option>Select Brand</option>
                        )}

                        {filteredBrands.length > 0 &&
                        filteredBrands.map((brand) => (
                            <option key={brand._id} value={brand.name}>
                            {brand.name}
                            </option>
                        ))}
                    </select>
            </div>

            <div className="mb-4">
                <label  className="block text-gray-700 text-sm font-bold mb-2">Product Color:</label>
                <input
                    type="text"
                    placeholder="Color"
                    name="color"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"

                    value={product?.color}
                    onChange={handleInputChange}
                />        
            </div>

            <div className="mb-4">
                <label  className="block text-gray-700 text-sm font-bold mb-2">Regular Price:</label>
                <input
                    type="number"
                    placeholder="Regular Price"
                    name="regularPrice"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"

                    value={product?.regularPrice}
                    onChange={handleInputChange}
                />      
            </div>

            <div className="mb-4">
                <label  className="block text-gray-700 text-sm font-bold mb-2">Product Price:</label>
                <input
                    type="number"
                    placeholder="Regular Price"
                    name="price"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"

                    value={product?.price}
                    onChange={handleInputChange}
                />      
            </div>

            <div className="mb-4">
                <label  className="block text-gray-700 text-sm font-bold mb-2">Product Quantity:</label>
                <input
                    type="number"
                    placeholder="Regular Quantity"
                    name="quantity"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"

                    value={product?.quantity}
                    onChange={handleInputChange}
                />      
            </div>

            <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Product Description:</label>
                <ReactQuill
                    theme="snow"
                    value={description}
                    onChange={setDescription}
                    modules={ProductForm.modules}
                    formats={ProductForm.formats}
                    
                />
            </div>


            <div className="mt-6">
                <button 
                    type="submit" 
                    className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition duration-300">
                    Save Product
                </button>
            </div>
        </form>
    </div>
    )
    }

ProductForm.modules = {
    toolbar: [
      [{ header: "1" }, { header: "2" }, { font: [] }],
      [{ size: [] }],
      ["bold", "italic", "underline", "strike", "blockquote"],
      [{ align: [] }],
      [{ color: [] }, { background: [] }],
      [
        { list: "ordered" },
        { list: "bullet" },
        { indent: "-1" },
        { indent: "+1" },
      ],
      ["clean"],
    ],
  };
  ProductForm.formats = [
    "header",
    "font",
    "size",
    "bold",
    "italic",
    "underline",
    "strike",
    "blockquote",
    "color",
    "background",
    "list",
    "bullet",
    "indent",
    "link",
    "video",
    "image",
    "code-block",
    "align",
  ];

export default ProductForm
