import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
// import Loader from "../../loader/Loader";
import ProductForm from "../productForm/ProductForm";
import {
  getProduct, selectProduct,
  updateProduct,
  RESET_PROD,
} from "../../../redux/features/product/productSlice";
import inventoryService from "../inventory/inventoryService.js";
// import Loader from "../../Loader";

const EditProduct = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const productEdit = useSelector(selectProduct);

  const [files, setFiles] = useState([]);
  const [product, setProduct] = useState(productEdit);
  const [description, setDescription] = useState("");
  const [inventoryOverview, setInventoryOverview] = useState(null);
  const [inventoryMapping, setInventoryMapping] = useState({
    locationSku: "",
    locationProductName: "",
    commissionRate: 30,
  });

  // const { categories, brands } = useSelector((state) => state.category);


  useEffect(() => {
    dispatch(getProduct({ id, options: { includeDiscontinued: true } }));
  }, [dispatch, id]);

  useEffect(() => {
    let shouldIgnore = false;

    const loadProductInventory = async () => {
      try {
        const data = await inventoryService.getProductInventory(id);
        if (shouldIgnore) return;

        setInventoryOverview(data);
        setInventoryMapping({
          locationSku: data?.macauBaptistSku || "",
          locationProductName:
            data?.locations?.find(
              (location) => location.locationCode === "MACAU_BAPTIST"
            )?.locationProductName || data?.name || "",
          commissionRate: data?.macauBaptistCommissionRate ?? 30,
        });
      } catch (error) {
        if (shouldIgnore) return;
        setInventoryOverview(null);
        toast.error(
          error?.response?.data?.message || "未能載入存貨資料"
        );
      }
    };

    loadProductInventory();

    return () => {
      shouldIgnore = true;
    };
  }, [id]);


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
    setProduct(
      productEdit
        ? { ...productEdit, productStatus: productEdit.productStatus || "active" }
        : productEdit
    );

    if (productEdit && Array.isArray(productEdit.image)) {
      setFiles(productEdit.image);
    } else {
      setFiles([]);
    }

    setDescription(
      productEdit && productEdit.description ? productEdit.description : ""
    );
  }, [productEdit]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProduct({ ...product, [name]: type === "checkbox" ? checked : value });
  };

  const handleInventoryMappingChange = (e) => {
    const { name, value } = e.target;
    setInventoryMapping((current) => ({ ...current, [name]: value }));
  };

  const saveProduct = async (e) => {
    e.preventDefault();

    const formData = {
      name: product?.name,
      sku: product?.sku || "",
      category: product?.category,
      brand: product?.brand,
      color: product?.color?.trim() || "",
      quantity: Number(product?.quantity),
      regularPrice: product?.regularPrice,
      price: product?.price,
      description: description,
      image: files,
      productStatus: product?.productStatus || "active",
      isFeatured: Boolean(product?.isFeatured),
      featuredOrder: Number(product?.featuredOrder || 0),
    };

    const result = await dispatch(updateProduct({ id, formData }));

    if (!updateProduct.fulfilled.match(result)) return;

    try {
      await inventoryService.updateProductLocationMapping(id, {
        locationCode: "MACAU_BAPTIST",
        locationSku: inventoryMapping.locationSku,
        locationProductName: inventoryMapping.locationProductName || product?.name,
        commissionRate: inventoryMapping.commissionRate,
      });
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          "商品已儲存，但寄賣參考資料未能儲存"
      );
      return;
    }

    dispatch(RESET_PROD());
    navigate("/productAdmin/all-products");
  };

  useEffect(() => () => {
    dispatch(RESET_PROD());
  }, [dispatch]);

  return (
    <section className="admin-product-page">
      <div className="admin-product-page__inner">
        <header className="admin-product-page-header">
          <p className="admin-product-kicker">商品</p>
          <div>
            <h1 className="admin-product-page-title">編輯商品</h1>
            <p className="admin-product-page-subtitle">
              更新商品詳情、存貨參考及商店顯示資料。
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
        inventoryOverview={inventoryOverview}
        inventoryMapping={inventoryMapping}
        handleInventoryMappingChange={handleInventoryMappingChange}

      />
      </div>
    </section>
  );
};

export default EditProduct;
