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

      const confirmDelete = (slug) => {
        confirmAlert({
          title: "Delete Category",
          message: "Are you sure you want to delete this category?",
          buttons: [
            {
              label: "Delete",
              onClick: () => delCat(slug),
            },
            {
              label: "Cancel",
              // onClick: () => alert('Click No')
            },
          ],
        });
      };
      
      const delCat = async (slug) => {
        await dispatch(deleteCategory(slug));
        await dispatch(getCategories());
      };

  return (
    <div className="admin-taxonomy-panel">
      <div className="admin-taxonomy-panel-copy">
        <h3 className="admin-taxonomy-panel-title">All Categories</h3>
        <p className="admin-taxonomy-panel-subtitle">Manage existing product categories.</p>
      </div>
      <div className="admin-taxonomy-table-wrap">
        {categories.length === 0 ? (
          <p className="admin-taxonomy-empty">No category found!</p>
        ) : (
          <table className="admin-taxonomy-table">
            <thead>
              <tr>
                <th>s/n</th>
                <th>Name</th>
                <th className="admin-taxonomy-table-head-actions">Action</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat, index) => {
                const { _id, name, slug } = cat;
                return (
                  <tr key={_id}>
                    <td>{index + 1}</td>
                    <td>{name}</td>
                    <td className="admin-taxonomy-action-cell">
                      <button type="button" className="admin-taxonomy-icon-button admin-taxonomy-icon-button--delete" aria-label={`Delete ${name}`} onClick={() => confirmDelete(slug)}>
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
