import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
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
// import Loader from "../../Loader";

const EditProduct = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {isLoading, message} = useSelector((state) => state.product)
  const productEdit = useSelector(selectProduct);

  const [files, setFiles] = useState([]);
  const [product, setProduct] = useState(productEdit);
  const [description, setDescription] = useState("");

  // const { categories, brands } = useSelector((state) => state.category);


  useEffect(() => {
    dispatch(getProduct(id));
  }, [dispatch, id]);


  // useEffect(() => {
  //   dispatch(getCategories());
  //   dispatch(getBrands());
  // }, [dispatch]);



  // Filter Brands based on selectedCategory
  // const [filteredBrands, setFilteredBrands] = useState([]);

  // function filterBrands(selectedCategoryName) {
  //   const newBrands = brands.filter(
  //     (brand) => brand.category === selectedCategoryName
  //   );
  //   setFilteredBrands(newBrands);
  // }

  // useEffect(() => {
  //   filterBrands(product?.category);
  //   // console.log(filteredBrands);
  // }, [product?.category]);



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
    <section className="admin-product-page">
      <div className="admin-product-page__inner">
        <header className="admin-product-page-header">
          <p className="admin-product-kicker">PRODUCT</p>
          <div>
            <h1 className="admin-product-page-title">Edit Product</h1>
            <p className="admin-product-page-subtitle">
              Update product details, stock and shop display information.
            </p>
          </div>
        </header>

      <ProductForm
        saveProduct={saveProduct}
        product={product}
        setProduct={setProduct}
        handleInputChange={handleInputChange}
        // categories={categories}
        isEditing={true}
        // filteredBrands={filteredBrands}
        description={description}
        files={files}
        setFiles={setFiles}
        setDescription={setDescription}

      />
      </div>
    </section>
  );
};

export default EditProduct;
