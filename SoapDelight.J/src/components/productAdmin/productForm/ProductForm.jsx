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
    const userRole = currentUser?.role
    const canManageProducts = userRole === 'author' || userRole === 'admin';
    // console.log(userRole);

    useEffect(() => {
      if (canManageProducts) {
        dispatch(getCategories());
        dispatch(getBrands());
      }
    }, [canManageProducts, dispatch]);

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
    <div className="admin-product-form-shell">
      <form className="admin-product-form" onSubmit={saveProduct}>
        <section className="admin-product-panel admin-product-panel--upload">
          <div className="admin-product-panel-header">
            <p className="admin-product-kicker">IMAGES</p>
            <div>
              <h2 className="admin-product-panel-title">Product images</h2>
              <p className="admin-product-panel-subtitle">
                Optional. Upload up to 5 images, or save without photos and show a placeholder.
              </p>
            </div>
          </div>
          <UploadWidget files={files} setFiles={setFiles} />

          <div className="admin-product-preview-row">
            <div className="slide-container">
              <aside>
                {files.length > 0 &&
                  files.map((image) => (
                    <div key={image} className="thumbnail">
                      <img src={image} alt="productImage" className="admin-product-thumbnail-image" />
                      <button
                        type="button"
                        className="thumbnailIconButton"
                        onClick={() => removeImage(image)}
                        aria-label="Remove image"
                      >
                        <BsTrash size={18} className="thumbnailIcon" />
                      </button>
                    </div>
                  ))}
                {files.length < 1 && (
                  <p className="--m admin-product-empty-images">
                    No product photo yet. A placeholder will be shown until you upload one.
                  </p>
                )}
              </aside>
            </div>
          </div>
        </section>

        <section className="admin-product-panel">
          <div className="admin-product-panel-header">
            <p className="admin-product-kicker">PRODUCT INFO</p>
            <div>
              <h2 className="admin-product-panel-title">Product details</h2>
              <p className="admin-product-panel-subtitle">
                Fill in the catalogue information, pricing and stock values.
              </p>
            </div>
          </div>

          <div className="admin-product-grid">
            <div className="admin-product-field admin-product-field--full">
              <label className="admin-product-label">Product Name</label>
              <input
                type="text"
                placeholder="Product name"
                name="name"
                value={product?.name}
                onChange={handleInputChange}
                className="admin-product-input"
                required
              />
            </div>

            <div className="admin-product-field">
              <label className="admin-product-label">Product Category</label>
              <select
                name="category"
                className="admin-product-input"
                value={product?.category}
                onChange={handleInputChange}
              >
                {isEditing ? <option>{product?.category}</option> : <option>Select Category</option>}
                {categories.length > 0 &&
                  categories.map((cat) => (
                    <option key={cat._id} value={cat._name}>
                      {cat.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="admin-product-field">
              <label className="admin-product-label">Product Brand</label>
              <select
                name="brand"
                value={product?.brand}
                className="admin-product-input"
                onChange={handleInputChange}
              >
                {isEditing ? <option>{product?.brand}</option> : <option>Select Brand</option>}
                {filteredBrands.length > 0 &&
                  filteredBrands.map((brand) => (
                    <option key={brand._id} value={brand.name}>
                      {brand.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="admin-product-field">
              <label className="admin-product-label">Product Color</label>
              <input
                type="text"
                placeholder="Color"
                name="color"
                className="admin-product-input"
                value={product?.color}
                onChange={handleInputChange}
              />
            </div>

            <div className="admin-product-field">
              <label className="admin-product-label">Regular Price</label>
              <input
                type="number"
                placeholder="Regular Price"
                name="regularPrice"
                className="admin-product-input"
                value={product?.regularPrice}
                onChange={handleInputChange}
              />
            </div>

            <div className="admin-product-field">
              <label className="admin-product-label">Product Price</label>
              <input
                type="number"
                placeholder="Product Price"
                name="price"
                className="admin-product-input"
                value={product?.price}
                onChange={handleInputChange}
              />
            </div>

            <div className="admin-product-field">
              <label className="admin-product-label">Product Quantity</label>
              <input
                type="number"
                placeholder="Product Quantity"
                name="quantity"
                className="admin-product-input"
                value={product?.quantity}
                onChange={handleInputChange}
              />
            </div>

            <div className="admin-product-field admin-product-field--full">
              <label className="admin-product-label">Product Description</label>
              <div className="admin-product-editor">
                <ReactQuill
                  theme="snow"
                  value={description}
                  onChange={setDescription}
                  modules={ProductForm.modules}
                  formats={ProductForm.formats}
                  className="admin-product-quill"
                />
              </div>
            </div>

            <div className="admin-product-actions admin-product-field--full">
              <button type="submit" className="admin-product-submit">
                Save Product
              </button>
            </div>
          </div>
        </section>
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
