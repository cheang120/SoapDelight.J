import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import "./AddProduce.scss"
// import Loader from "../../Loader";
import ProductForm from "../productForm/ProductForm";
import {
    getBrands,
    getCategories,
  } from "../../../redux/features/categoryAndBrand/categoryAndBrandSlice";
import {
    RESET_PROD,
    createProduct,
    // selectIsLoading,
  } from "../../../redux/features/product/productSlice";

const initialState = {
    name: "",
    sku: "",
    category: "",
    brand: "",
    quantity: "",
    price: "",
    color: "",
    regularPrice: "",
  };

const AddProduct = () => {

  const { currentUser } = useSelector((state) => state.user);

    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [product, setProduct] = useState(initialState);

    const [files, setFiles] = useState([]);
    const [description, setDescription] = useState("");

    const {isLoading, message} = useSelector((state) => state.product)
    const { categories, brands } = useSelector((state) => state.category);

    const { name, sku, category, brand, price, quantity, color, regularPrice } = product;

    const userRole = currentUser?.role
    const canManageProducts = userRole === 'author' || userRole === 'admin';
    // console.log(userRole);

    useEffect(() => {
      if (canManageProducts) {
        dispatch(getCategories());
        dispatch(getBrands());
      }
    }, [canManageProducts, dispatch]);

 


    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProduct({ ...product, [name]: value });
      };

      const generateKSKU = (category) => {
        const letter = category.slice(0, 3).toUpperCase();
        const number = Date.now();
        const sku = letter + "-" + number;
        return sku;
      };


    const saveProduct = async (e) => {
        e.preventDefault();
        // console.log(product);
        // console.log(description);

        const formData = {
          name: name,
          sku: sku?.trim() || generateKSKU(category),
          category: category,
          brand: brand,
          color: color,
          quantity: Number(quantity),
          regularPrice: regularPrice,
          price: price,
          description: description,
          image: files,
        };
    
        // console.log(formData);
    
        await dispatch(createProduct(formData));
    
        // navigate("/productAdmin/all-products");
      };

      useEffect(() => {
        if (message === "Product created successfully"){
          navigate("/productAdmin/all-products");
        }
        dispatch(RESET_PROD())
      },[message, navigate,dispatch])

      const [filteredBrands, setFilteredBrands] = useState([]);
      function filterBrands(selectedCategory) {
        const newBrands = brands.filter(
          (brand) => brand.category === selectedCategory
        );
        setFilteredBrands(newBrands);
      }

      useEffect(() => {
        filterBrands(category);
        // console.log(filteredBrands);
      }, [category]);

      if (canManageProducts) {
      return (
        <section className="admin-product-page">
          <div className="admin-product-page__inner">
            <header className="admin-product-page-header">
              <p className="admin-product-kicker">商品</p>
              <div>
                <h1 className="admin-product-page-title">新增商品</h1>
                <p className="admin-product-page-subtitle">
                  建立新商品並發佈到商店。
                </p>
              </div>
            </header>

            <ProductForm
                files={files}
                setFiles={setFiles}
                setProduct={setProduct}
                product={product}
                description={description}
                setDescription={setDescription}
                handleInputChange={handleInputChange}
                saveProduct={saveProduct}
                categories={categories}
                filteredBrands={filteredBrands}
                isEditing={false}
            />
          </div>
        </section>
      )
      } else {
        return (
          <h2>你不是管理員，請以管理員身份登入。</h2>

        )
      }


}

export default AddProduct
