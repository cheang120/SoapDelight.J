import axios from "axios";
import { toast } from "react-toastify";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_BASE_URL } from "../../../utils/apiBase";


const API_URL = `${API_BASE_URL}/`;

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
const deleteCategory = async (categoryId) => {
  const response = await axios.delete(
    API_URL + "category/" + encodeURIComponent(categoryId)
  );
  return response.data.message;
};

// Create Brand
const createBrand = async (formData) => {
  const response = await axios.post(API_URL + "brand/createBrand", formData);
  return response.data;
};

// Get all Categories
const getBrands = async () => {
  const response = await axios.get(API_URL + "brand/getBrands");
  return response.data;
};

// Delete a Cat
const deleteBrand = async (brandId) => {
  const response = await axios.delete(
    API_URL + "brand/" + encodeURIComponent(brandId)
  );
  return response.data.message;
};



const categoryAndBrandService = {
    createCategory,
    createBrand,
    getCategories,
    getBrands,
    deleteCategory,
    deleteBrand,
  };

export default categoryAndBrandService;
