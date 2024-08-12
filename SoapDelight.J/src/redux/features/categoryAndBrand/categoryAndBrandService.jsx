import axios from "axios";
import { toast } from "react-toastify";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";


const BACKEND_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL
const API_URL = `${BACKEND_URL}/api/`;

// Create Category
const createCategory = async (formData) => {
  const response = await axios.post(
    API_URL + "category/createCategory",
    formData
  );  return response.data;
};



const categoryAndBrandService = {
    createCategory,
    // createBrand,
    // getCategories,
    // getBrands,
    // deleteCategory,
    // deleteBrand,
  };

export default categoryAndBrandService;
