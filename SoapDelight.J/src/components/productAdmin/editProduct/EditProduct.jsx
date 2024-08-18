import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
// import Loader from "../../loader/Loader";
import ProductForm from "../productForm/ProductForm";
import {
  getProduct, selectProduct,
  selectIsLoading,
  updateProduct,
  RESET_PROD,
} from "../../../redux/features/product/productSlice";
import {
  getBrands,
  getCategories,
} from "../../../redux/features/categoryAndBrand/categoryAndBrandSlice";

const EditProduct = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {isLoading, message} = useSelector((state) => state.product)
  const productEdit = useSelector(selectProduct);

  const [files, setFiles] = useState([]);
  const [product, setProduct] = useState(productEdit);
  const [productImage, setProductImage] = useState("");
  const [imagePreview, setImagePreview] = useState([]);
  const [description, setDescription] = useState("");

  const { categories, brands } = useSelector((state) => state.category);


  useEffect(() => {
    dispatch(getProduct(id));
  }, [dispatch, id]);


  useEffect(() => {
    dispatch(getCategories());
    dispatch(getBrands());
  }, [dispatch]);



  // Filter Brands based on selectedCategory
  const [filteredBrands, setFilteredBrands] = useState([]);

  function filterBrands(selectedCategoryName) {
    const newBrands = brands.filter(
      (brand) => brand.category === selectedCategoryName
    );
    setFilteredBrands(newBrands);
  }

  useEffect(() => {
    filterBrands(product?.category);
    // console.log(filteredBrands);
  }, [product?.category]);



  useEffect(() => {
    setProduct(productEdit);

    if (productEdit && productEdit.image) {
      setFiles(productEdit.image);
    }

    setDescription(
      productEdit && productEdit.description ? productEdit.description : ""
    );
  }, [productEdit]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProduct({ ...product, [name]: value });
  };

  const saveProduct = async (e) => {
    e.preventDefault();
    if (files.length < 1) {
      return toast.info("Please add an image");
    }

    const formData = {
      name: product?.name,
      category: product?.category,
      brand: product?.brand,
      color: product?.color,
      quantity: Number(product?.quantity),
      regularPrice: product?.regularPrice,
      price: product?.price,
      description: description,
      image: files,
    };

    console.log(formData);

    await dispatch(updateProduct({ id, formData }));
    // await dispatch(getProducts());
    // navigate("/productAdmin/all-products");
  };


  useEffect(() => {
    if (message === "Product updated successfully"){
      navigate("/productAdmin/all-products");
    }
    dispatch(RESET_PROD())
  },[message, navigate,dispatch])

  return (
    <div>
      {/* {isLoading && <Loader />} */}
      <h3 className="--mt">Edit Product</h3>
      <ProductForm
        saveProduct={saveProduct}
        product={product}
        handleInputChange={handleInputChange}
        categories={categories}
        isEditing={true}
        filteredBrands={filteredBrands}
        description={description}
        files={files}
        setFiles={setFiles}

        productImage={productImage}
        imagePreview={imagePreview}
        setImagePreview={setImagePreview}
        setDescription={setDescription}

      />
    </div>
  );
};

export default EditProduct;