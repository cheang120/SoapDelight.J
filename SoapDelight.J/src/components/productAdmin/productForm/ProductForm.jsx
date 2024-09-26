import React, { useEffect, useState } from 'react'
import "./ProductForm.scss"
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import UploadWidget from './UploadWidget';
import { BsTrash } from 'react-icons/bs';
import { useSelector,useDispatch } from 'react-redux';
import { getBrands, getCategories } from '../../../redux/features/categoryAndBrand/categoryAndBrandSlice';
import { selectProduct } from '../../../redux/features/product/productSlice';

const ProductForm = ({
    saveProduct, 
    isEditing,
    product,
    setProduct,
    handleInputChange, 
    // categories,
    // filteredBrands,
    description,
    setDescription,
    files,
    setFiles
}) => {


    const dispatch = useDispatch();
    const [filteredBrands, setFilteredBrands] = useState([]);

    const { categories, brands } = useSelector((state) => state.category);
    const { currentUser } = useSelector((state) => state.user);
    const userRole = currentUser.role
    // console.log(userRole);

    if (userRole === 'author') {
      useEffect(() => {
        dispatch(getCategories());
        dispatch(getBrands());
      }, [dispatch]);
    }

    // const handleInputChange = (e) => {
    //     const { name, value } = e.target;
    //     selectProduct({ ...product, [name]: value });
    // };

    
    function filterBrands(selectedCategory) {
      const newBrands = brands.filter(
        (brand) => brand.category === selectedCategory
      );
      setFilteredBrands(newBrands);
    }

    useEffect(() => {
      filterBrands(product?.category);
      // console.log(filteredBrands);
    }, [product?.category]);



    const removeImage = (image) => {
        console.log(image);
        setFiles(files.filter((img, index) => img !== image));
      };
    
  return (
    <div className="max-w-md bg-white dark:bg-gray-800 p-8 shadow-lg rounded-lg">
        {/* <h3 className="text-xl font-bold mb-4">Upload Widget Placeholder</h3> */}
        <UploadWidget files={files} setFiles={setFiles} />

        <form onSubmit={saveProduct}>
            <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Product Images:</label>
                <div className='slide-container'>
                    <aside>
                        {files.length > 0 &&
                            files.map((image) => (
                                <div key={image} className="thumbnail">
                                    <img src={image} alt="productImage" className='h-32 mb-5' />
                                    <div>
                                        <BsTrash size={25} className='thumbnailIcon' onClick={() => removeImage(image)} />
                                    </div>
                                </div>
                            ))
                        }
                        {files.length < 1 && (
                            <p className='--m'>No image set for this product.</p>
                        )}
                    </aside>
                </div>
            </div>

            <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Product Name:</label>
                <input
                    type="text"
                    placeholder="Product name"
                    name="name"
                    value={product?.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-white"
                    required
                />
            </div>

            <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Product Category:</label>
                <select
                    name="category"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-white"
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
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Product Brand:</label>
                <select
                    name="brand"
                    value={product?.brand}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-white"
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
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Product Color:</label>
                <input
                    type="text"
                    placeholder="Color"
                    name="color"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-white"
                    value={product?.color}
                    onChange={handleInputChange}
                />
            </div>

            <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Regular Price:</label>
                <input
                    type="number"
                    placeholder="Regular Price"
                    name="regularPrice"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-white"
                    value={product?.regularPrice}
                    onChange={handleInputChange}
                />
            </div>

            <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Product Price:</label>
                <input
                    type="number"
                    placeholder="Product Price"
                    name="price"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-white"
                    value={product?.price}
                    onChange={handleInputChange}
                />
            </div>

            <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Product Quantity:</label>
                <input
                    type="number"
                    placeholder="Product Quantity"
                    name="quantity"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-white"
                    value={product?.quantity}
                    onChange={handleInputChange}
                />
            </div>

            <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Product Description:</label>
                <ReactQuill
                    theme="snow"
                    value={description}
                    onChange={setDescription}
                    modules={ProductForm.modules}
                    formats={ProductForm.formats}
                    className="dark:bg-gray-900 dark:text-white h-64"
                />
            </div>

            <div className="mt-28">
                <button
                    type="submit"
                    className="w-full bg-pink-500 dark:bg-pink-700 text-white py-2 rounded-lg hover:bg-pink-600 dark:hover:bg-pink-800 transition duration-300 z-50"
                >
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
