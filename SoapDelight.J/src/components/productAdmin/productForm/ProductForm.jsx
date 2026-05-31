import { useEffect, useState } from 'react'
import "./ProductForm.scss"
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import UploadWidget from './UploadWidget';
import { BsTrash } from 'react-icons/bs';
import { useSelector,useDispatch } from 'react-redux';
import { getBrands, getCategories } from '../../../redux/features/categoryAndBrand/categoryAndBrandSlice';

const formatMoney = (value) =>
  `$${Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const ProductForm = ({
    saveProduct, 
    isEditing,
    product,
    handleInputChange, 
    // categories,
    // filteredBrands,
    description,
    setDescription,
    files,
    setFiles,
    inventoryOverview,
    inventoryMapping,
    handleInventoryMappingChange,
}) => {


    const dispatch = useDispatch();
    const [filteredBrands, setFilteredBrands] = useState([]);

    const { categories, brands } = useSelector((state) => state.category);
    const { currentUser } = useSelector((state) => state.user);
    const userRole = currentUser?.role
    const canManageProducts = userRole === 'author' || userRole === 'admin';
    // console.log(userRole);

    useEffect(() => {
      if (canManageProducts) {
        dispatch(getCategories());
        dispatch(getBrands());
      }
    }, [canManageProducts, dispatch]);

    // const handleInputChange = (e) => {
    //     const { name, value } = e.target;
    //     selectProduct({ ...product, [name]: value });
    // };

    
    function filterBrands(selectedCategory) {
      const newBrands = brands.filter(
        (brand) => brand.category === selectedCategory
      );
      setFilteredBrands(newBrands);
    }

    useEffect(() => {
      filterBrands(product?.category);
      // console.log(filteredBrands);
    }, [product?.category]);



    const removeImage = (image) => {
        console.log(image);
        setFiles(files.filter((img, index) => img !== image));
      };

    const rawCommissionRate = inventoryMapping?.commissionRate;
    const macauCommissionRate =
      rawCommissionRate === "" || rawCommissionRate === undefined || rawCommissionRate === null
        ? Number(inventoryOverview?.macauBaptistCommissionRate ?? 30)
        : Number(rawCommissionRate);
    const publicPrice = Number(product?.price || inventoryOverview?.publicPrice || 0);
    const internalNetPrice = publicPrice * (1 - macauCommissionRate / 100);
    const stockCards = [
      {
        label: "中央存貨",
        value: inventoryOverview?.centralStock ?? 0,
      },
      {
        label: "網店存貨",
        value: inventoryOverview?.onlineStock ?? 0,
      },
      {
        label: "澳浸存貨",
        value: inventoryOverview?.macauBaptistStock ?? 0,
      },
      {
        label: "總存貨",
        value: inventoryOverview?.totalStock ?? 0,
      },
      {
        label: "內部淨價",
        value: formatMoney(internalNetPrice),
        helper: "只供內部參考",
      },
    ];
    
  return (
    <div className="admin-product-form-shell">
      <form className="admin-product-form" onSubmit={saveProduct}>
        <section className="admin-product-panel admin-product-panel--upload">
          <div className="admin-product-panel-header">
            <p className="admin-product-kicker">圖片</p>
            <div>
              <h2 className="admin-product-panel-title">商品圖片</h2>
              <p className="admin-product-panel-subtitle">
                選填。最多可上傳 5 張圖片；未有相片時會顯示 placeholder。
              </p>
            </div>
          </div>
          <UploadWidget files={files} setFiles={setFiles} />

          <div className="admin-product-preview-row">
            <div className="slide-container">
              <aside>
                {files.length > 0 &&
                  files.map((image) => (
                    <div key={image} className="thumbnail">
                      <img src={image} alt="商品圖片" className="admin-product-thumbnail-image" />
                      <button
                        type="button"
                        className="thumbnailIconButton"
                        onClick={() => removeImage(image)}
                        aria-label="移除圖片"
                      >
                        <BsTrash size={18} className="thumbnailIcon" />
                      </button>
                    </div>
                  ))}
                {files.length < 1 && (
                  <p className="--m admin-product-empty-images">
                    暫未有商品相片。上傳前會顯示「相片稍後補上」placeholder。
                  </p>
                )}
              </aside>
            </div>
          </div>
        </section>

        <section className="admin-product-panel">
          <div className="admin-product-panel-header">
            <p className="admin-product-kicker">商品資料</p>
            <div>
              <h2 className="admin-product-panel-title">商品詳情</h2>
              <p className="admin-product-panel-subtitle">
                填寫商品目錄資料、價格及基本庫存資料。
              </p>
            </div>
          </div>

          <div className="admin-product-grid">
            <div className="admin-product-field admin-product-field--full">
              <label className="admin-product-label">商品名稱</label>
              <input
                type="text"
                placeholder="商品名稱"
                name="name"
                value={product?.name}
                onChange={handleInputChange}
                className="admin-product-input"
                required
              />
            </div>

            <div className="admin-product-field admin-product-field--full">
              <label className="admin-product-label">
                中央 SKU
              </label>
              <input
                type="text"
                placeholder="選填中央 SKU"
                name="sku"
                value={product?.sku || ""}
                onChange={handleInputChange}
                className="admin-product-input"
              />
            </div>

            <div className="admin-product-field">
              <label className="admin-product-label">商品分類</label>
              <select
                name="category"
                className="admin-product-input"
                value={product?.category}
                onChange={handleInputChange}
              >
                {isEditing ? <option>{product?.category}</option> : <option>選擇分類</option>}
                {categories.length > 0 &&
                  categories.map((cat) => (
                    <option key={cat._id} value={cat._name}>
                      {cat.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="admin-product-field">
              <label className="admin-product-label">商品品牌</label>
              <select
                name="brand"
                value={product?.brand}
                className="admin-product-input"
                onChange={handleInputChange}
              >
                {isEditing ? <option>{product?.brand}</option> : <option>選擇品牌</option>}
                {filteredBrands.length > 0 &&
                  filteredBrands.map((brand) => (
                    <option key={brand._id} value={brand.name}>
                      {brand.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="admin-product-field">
              <label className="admin-product-label">商品顏色（選填）</label>
              <input
                type="text"
                placeholder="選填，例如：藍色 / 啡色 / 可留空"
                name="color"
                className="admin-product-input"
                value={product?.color}
                onChange={handleInputChange}
              />
            </div>

            <div className="admin-product-field">
              <label className="admin-product-label">原價</label>
              <input
                type="number"
                placeholder="原價"
                name="regularPrice"
                className="admin-product-input"
                value={product?.regularPrice}
                onChange={handleInputChange}
              />
            </div>

            <div className="admin-product-field">
              <label className="admin-product-label">售價</label>
              <input
                type="number"
                placeholder="售價"
                name="price"
                className="admin-product-input"
                value={product?.price}
                onChange={handleInputChange}
              />
            </div>

            <div className="admin-product-field">
              <label className="admin-product-label">商品數量</label>
              <input
                type="number"
                placeholder="商品數量"
                name="quantity"
                className="admin-product-input"
                value={product?.quantity}
                onChange={handleInputChange}
              />
            </div>

            <div className="admin-product-field">
              <label className="admin-product-label">商品狀態</label>
              <select
                name="productStatus"
                className="admin-product-input"
                value={product?.productStatus || "active"}
                onChange={handleInputChange}
              >
                <option value="active">正常上架</option>
                <option value="out_of_stock">缺貨</option>
                <option value="discontinued">停產</option>
              </select>
              <small className="admin-product-field-hint">
                缺貨仍會顯示在前台但不可加入購物車；停產會於前台隱藏，後台仍保留。
              </small>
            </div>

            <div className="admin-product-field">
              <label className="admin-product-label">首頁推薦</label>
              <label className="flex min-h-11 items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-800 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100">
                <input
                  type="checkbox"
                  name="isFeatured"
                  checked={Boolean(product?.isFeatured)}
                  onChange={handleInputChange}
                  className="h-4 w-4"
                />
                設為首頁推薦商品
              </label>
              <small className="admin-product-field-hint">
                推薦商品會在首頁右側主卡片輪播；停產商品不會在前台顯示。
              </small>
            </div>

            <div className="admin-product-field">
              <label className="admin-product-label">推薦排序</label>
              <input
                type="number"
                min="0"
                step="1"
                placeholder="例如 1、2、3"
                name="featuredOrder"
                className="admin-product-input"
                value={product?.featuredOrder ?? 0}
                onChange={handleInputChange}
              />
              <small className="admin-product-field-hint">
                數字越細越優先；相同排序會按商品狀態及建立時間排列。
              </small>
            </div>

            <div className="admin-product-field admin-product-field--full">
              <label className="admin-product-label">商品描述</label>
              <div className="admin-product-editor">
                <ReactQuill
                  theme="snow"
                  value={description}
                  onChange={setDescription}
                  modules={ProductForm.modules}
                  formats={ProductForm.formats}
                  className="admin-product-quill"
                />
              </div>
            </div>

          </div>
        </section>

        <section className="admin-product-panel">
          <div className="admin-product-panel-header">
            <p className="admin-product-kicker">存貨</p>
            <div>
              <h2 className="admin-product-panel-title">
                存貨及寄賣資料
              </h2>
              <p className="admin-product-panel-subtitle">
                此處只顯示存貨數量；如需調整或調貨，請使用存貨流動紀錄。
                <br />
                所有數量變動都應透過存貨流動紀錄。
              </p>
            </div>
          </div>

          {isEditing ? (
            <>
              <div className="admin-inventory-stock-grid">
                {stockCards.map((item) => (
                  <div key={item.label} className="admin-inventory-stock-card">
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                    {item.helper && <small>{item.helper}</small>}
                  </div>
                ))}
              </div>

              <div className="admin-product-grid admin-inventory-edit-grid">
                <div className="admin-product-field">
                  <label className="admin-product-label">
                    澳門浸信書局 SKU
                  </label>
                  <input
                    type="text"
                    name="locationSku"
                    placeholder="選填寄賣點 SKU"
                    className="admin-product-input"
                    value={inventoryMapping?.locationSku || ""}
                    onChange={handleInventoryMappingChange}
                  />
                </div>

                <div className="admin-product-field">
                  <label className="admin-product-label">
                    澳浸貨品名稱
                  </label>
                  <input
                    type="text"
                    name="locationProductName"
                    placeholder={product?.name || "選填寄賣點貨品名稱"}
                    className="admin-product-input"
                    value={inventoryMapping?.locationProductName || ""}
                    onChange={handleInventoryMappingChange}
                  />
                </div>

                <div className="admin-product-field">
                  <label className="admin-product-label">
                    澳浸佣金
                  </label>
                  <input
                    type="number"
                    name="commissionRate"
                    min="0"
                    step="0.01"
                    className="admin-product-input"
                    value={inventoryMapping?.commissionRate ?? 30}
                    onChange={handleInventoryMappingChange}
                  />
                  <p className="admin-product-field-note">
                    只供內部參考
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="admin-product-info-note">
              請先儲存商品，再編輯寄賣參考資料。
            </div>
          )}
        </section>

        <div className="admin-product-actions">
          <button type="submit" className="admin-product-submit">
            儲存商品
          </button>
        </div>
      </form>
    </div>
  )
}

ProductForm.modules = {
    toolbar: [
      [{ header: "1" }, { header: "2" }, { font: [] }],
      [{ size: [] }],
      ["bold", "italic", "underline", "strike", "blockquote"],
      [{ align: [] }],
      [{ color: [] }, { background: [] }],
      [
        { list: "ordered" },
        { list: "bullet" },
        { indent: "-1" },
        { indent: "+1" },
      ],
      ["clean"],
    ],
  };
  ProductForm.formats = [
    "header",
    "font",
    "size",
    "bold",
    "italic",
    "underline",
    "strike",
    "blockquote",
    "color",
    "background",
    "list",
    "bullet",
    "indent",
    "link",
    "video",
    "image",
    "code-block",
    "align",
  ];

export default ProductForm
