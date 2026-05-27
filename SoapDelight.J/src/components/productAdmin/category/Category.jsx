import React, { useEffect } from "react";
import CategoryList from "./CategoryList";
import CreateCategory from "./CreateCategory";
import { useDispatch, useSelector } from "react-redux";
import { getCategories } from "../../../redux/features/categoryAndBrand/categoryAndBrandSlice";
import "./Category.scss";

const Category = () => {
  const dispatch = useDispatch();
  const { categories } = useSelector((state) => state.category);

  const reloadCategory = () => {
    dispatch(getCategories());
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <section className="admin-taxonomy-page">
      <header className="admin-taxonomy-header">
        <div className="admin-taxonomy-copy">
          <p className="admin-taxonomy-eyebrow">分類</p>
          <h2 className="admin-taxonomy-title">建立分類</h2>
          <p className="admin-taxonomy-subtitle">
            新增及管理商品分類。
          </p>
        </div>
      </header>

      <div className="admin-taxonomy-stack">
        <CreateCategory reloadCategory={reloadCategory} />

        <CategoryList />
      </div>
    </section>
  );
};

export default Category;
