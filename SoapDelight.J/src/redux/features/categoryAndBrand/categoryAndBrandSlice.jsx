import { createSlice,createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import categoryAndBrandService from "./categoryAndBrandService.jsx";


 const initialState = {
    categories:[],
    isError:false,
    isSuccess:false,
    isLoading:false,
    message:""
}



export const createCategory = createAsyncThunk(
  "category/create",
  async (formData, thunkAPI) => {
    try {
      return await categoryAndBrandService.createCategory(formData);
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      console.log(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get all Cat
export const getCategories = createAsyncThunk(
  "category/getCategories",
  async (_, thunkAPI) => {
    try {
      return await categoryAndBrandService.getCategories();
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      console.log(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Delete a Cat
export const deleteCategory = createAsyncThunk(
  "category/delete",
  async (slug, thunkAPI) => {
    try {
      return await categoryAndBrandService.deleteCategory(slug);
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      console.log(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

  const categoryAndBrandSlice = createSlice({
    name: "category",
    initialState,
    reducers: {
      RESET_CAT(state) {
          state.isError = false;
          state.isSuccess = false;
          state.isLoading = false;
          state.message = "";
        },
    },
    extraReducers:(builder) => {
      builder
          // create category
        .addCase(createCategory.pending, (state) => {
          state.isLoading = true;
        })
        .addCase(createCategory.fulfilled, (state, action) => {
          state.isLoading = false;
          state.isSuccess = true;
          state.isError = false;
          toast.success("Category Created successfully");
          // console.log(action.payload);

        })
        .addCase(createCategory.rejected, (state, action) => {
          state.isLoading = false;
          state.isError = true;
          state.message = action.payload;
          toast.error(action.payload);
        })
          // create category
        .addCase(getCategories.pending, (state) => {
          state.isLoading = true;
        })
        .addCase(getCategories.fulfilled, (state, action) => {
          state.isLoading = false;
          state.isSuccess = true;
          state.isError = false;
          state.categories = action.payload
          console.log(action.payload);

        })
        .addCase(getCategories.rejected, (state, action) => {
          state.isLoading = false;
          state.isError = true;
          state.message = action.payload;
          toast.error(action.payload);
        })
        //   Delete cat
        .addCase(deleteCategory.pending, (state) => {
          state.isLoading = true;
        })
        .addCase(deleteCategory.fulfilled, (state, action) => {
          state.isLoading = false;
          state.isSuccess = true;
          state.isError = false;
          toast.success(action.payload);
          console.log(action.payload);
        })
        .addCase(deleteCategory.rejected, (state, action) => {
          state.isLoading = false;
          state.isError = true;
          state.message = action.payload;
          toast.error(action.payload);
        })
    }
  });



export const {RESET_CAT} = categoryAndBrandSlice.actions

export default categoryAndBrandSlice.reducer;
