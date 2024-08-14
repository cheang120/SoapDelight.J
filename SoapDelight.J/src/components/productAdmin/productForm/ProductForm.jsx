import React from 'react'
import "./ProductForm.scss"

const ProductForm = ({saveProduct, product,handleInputChange}) => {
  return (
    <div className='add-product'>
      <h3>Upload Widget Placeholder</h3>

      <div>
        <br />
        <form onSubmit={saveProduct}>
            <label>Product Name:</label>
            <input
                type="text"
                placeholder="Product name"
                name="name"
                value={product?.name}
                onChange={handleInputChange}
            />

            <label>Product Category:</label>
            <select
                name="category"
                // value={product?.category}
                className="form-control"
                // onChange={handleInputChange}
            >
                {/* {isEditing ? (
                <option>{product?.category}</option>
                ) : (
                <option>Select Category</option>
                )}
                {categories.length > 0 &&
                categories.map((cat) => (
                    <option key={cat._id} value={cat._name}>
                    {cat.name}
                    </option>
                ))} */}
            </select>
        </form>
      </div>
    </div>
  )
}

export default ProductForm
