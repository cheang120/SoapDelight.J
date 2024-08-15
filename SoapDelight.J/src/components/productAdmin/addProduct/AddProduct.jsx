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
    createProduct,
    // selectIsLoading,
  } from "../../../redux/features/product/productSlice";

const initialState = {
    name: "",
    category: "",
    brand: "",
    quantity: "",
    price: "",
    color: "",
    regularPrice: "",
  };

const AddProduct = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [product, setProduct] = useState(initialState);

    const [productImage, setProductImage] = useState([]);
    const [files, setFiles] = useState([]);
    const [imagePreview, setImagePreview] = useState([]);
    const [description, setDescription] = useState("");

    const {isLoading} = useSelector((state) => state.product)
    const { categories, brands } = useSelector((state) => state.category);

    const { name, category, brand, price, quantity, color, regularPrice } = product;


    useEffect(() => {
        dispatch(getCategories());
        dispatch(getBrands());
      }, [dispatch]);


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

        // if (files.length < 1) {
        //   return toast.info("Please add an image");
        // }

    
        const formData = {
          name: name,
          sku: generateKSKU(category),
          category: category,
          brand: brand,
          color: color,
          quantity: Number(quantity),
          regularPrice: regularPrice,
          price: price,
          description: description,
          // image: files,
        };
    
        // console.log(formData);
    
        await dispatch(createProduct(formData));
    
        navigate("/productAdmin/all-products");
      };

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

  return (
    <section>
      <div className='container'>
        {/* {isLoading && <Loader />} */}
        <h3 className='--mt'>Add New Product</h3>

        <ProductForm         
            // files={files}
            // setFiles={setFiles}
            product={product}
            // productImage={productImage}
            // imagePreview={imagePreview}
            // setImagePreview={setImagePreview}
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
}

export default AddProduct
