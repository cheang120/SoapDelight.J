import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { deleteCategory, getCategories } from '../../../redux/features/categoryAndBrand/categoryAndBrandSlice';
import { FaTrashAlt } from 'react-icons/fa';
import { confirmAlert } from "react-confirm-alert";
import "react-confirm-alert/src/react-confirm-alert.css";

const CategoryList = () => {
  const { isLoading, categories = [] } = useSelector((state) => state.category || {});
  const dispatch = useDispatch();

    useEffect(() => {
        window.scrollTo(0, 0);
        dispatch(getCategories());
      }, [dispatch]);

      const confirmDelete = (category) => {
        confirmAlert({
          title: "刪除分類",
          message: `確定要刪除「${category.name}」嗎？`,
          buttons: [
            {
              label: "刪除",
              onClick: () => delCat(category._id),
            },
            {
              label: "取消",
              // onClick: () => alert('Click No')
            },
          ],
        });
      };
      
      const delCat = async (categoryId) => {
        await dispatch(deleteCategory(categoryId));
        await dispatch(getCategories());
      };

  return (
    <div className="admin-taxonomy-panel">
      <div className="admin-taxonomy-panel-copy">
        <h3 className="admin-taxonomy-panel-title">所有分類</h3>
        <p className="admin-taxonomy-panel-subtitle">管理現有商品分類。</p>
      </div>
      <div className="admin-taxonomy-table-wrap">
        {categories.length === 0 ? (
          <p className="admin-taxonomy-empty">暫未有分類。</p>
        ) : (
          <table className="admin-taxonomy-table">
            <thead>
              <tr>
                <th>序號</th>
                <th>名稱</th>
                <th className="admin-taxonomy-table-head-actions">操作</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat, index) => {
                const { _id, name } = cat;
                return (
                  <tr key={_id}>
                    <td>{index + 1}</td>
                    <td>{name}</td>
                    <td className="admin-taxonomy-action-cell">
                      <button type="button" className="admin-taxonomy-icon-button admin-taxonomy-icon-button--delete" aria-label={`刪除 ${name}`} onClick={() => confirmDelete(slug)}>
                        <FaTrashAlt size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default CategoryList
