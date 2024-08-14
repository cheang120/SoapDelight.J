import React from 'react'
import "./ProductForm.scss"

const ProductForm = ({
    saveProduct, 
    product,
    handleInputChange, 
    categories,
    isEditing
}) => {
  return (
<div className="max-w-md   bg-white p-8 shadow-lg rounded-lg">
    <h3 className="text-xl font-bold mb-4">Upload Widget Placeholder</h3>

    <form onSubmit={saveProduct}>
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
                <option value="">Select Category</option>
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

export default ProductForm
