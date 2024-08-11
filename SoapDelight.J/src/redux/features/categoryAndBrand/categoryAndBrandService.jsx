import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_URL = `${BACKEND_URL}/api/`;

// Create Category
  const createCategory = async(formData) => {
    const response = await axios.post(API_URL + "category/createCategory", formData, {
        withCredentials:true
    })
    return response.data
}

const categoryAndBrandService = {
    createCategory,
    // createBrand,
    // getCategories,
    // getBrands,
    // deleteCategory,
    // deleteBrand,
  };

export default categoryAndBrandService;
