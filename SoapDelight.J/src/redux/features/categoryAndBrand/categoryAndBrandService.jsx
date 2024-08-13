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

// Get all Categories
const getCategories = async () => {
  const response = await axios.get(API_URL + "category/getCategories");
  return response.data;
};

// Delete a Cat
const deleteCategory = async (slug) => {
  const response = await axios.delete(API_URL + "category/" + slug);
  return response.data.message;
};

// Create Brand
const createBrand = async (formData) => {
  const response = await axios.post(API_URL + "brand/createBrand", formData);
  return response.data;
};



const categoryAndBrandService = {
    createCategory,
    createBrand,
    getCategories,
    // getBrands,
    deleteCategory,
    // deleteBrand,
  };

export default categoryAndBrandService;
