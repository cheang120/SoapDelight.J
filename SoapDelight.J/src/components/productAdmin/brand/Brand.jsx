import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  RESET_CAT, getBrands,
//   getCategories,
} from "../../../redux/features/categoryAndBrand/categoryAndBrandSlice";
import CreateBrand from "./CreateBrand";
import BrandList from "./BrandList";
import "./Brand.scss";

const Brand = () => {
  const dispatch = useDispatch();
  const { brands } = useSelector((state) => state.category);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const reloadBrands = () => {
    dispatch(getBrands());
  };

  return (
    <section className="admin-taxonomy-page">
      <header className="admin-taxonomy-header">
        <div className="admin-taxonomy-copy">
          <p className="admin-taxonomy-eyebrow">品牌</p>
          <h2 className="admin-taxonomy-title">建立品牌</h2>
          <p className="admin-taxonomy-subtitle">
            新增及管理商品品牌與所屬分類。
          </p>
        </div>
      </header>

      <div className="admin-taxonomy-stack">
        <CreateBrand reloadBrands={reloadBrands} />

        <BrandList />
      </div>
    </section>
  );
};

export default Brand;
