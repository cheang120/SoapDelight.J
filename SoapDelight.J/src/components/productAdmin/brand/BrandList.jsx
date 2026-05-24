import React, { useEffect } from 'react'
import { FaTrashAlt } from 'react-icons/fa';
import { confirmAlert } from "react-confirm-alert";
import "react-confirm-alert/src/react-confirm-alert.css";
import { useDispatch, useSelector } from 'react-redux';
import { deleteBrand, getBrands, getCategories } from '../../../redux/features/categoryAndBrand/categoryAndBrandSlice';

const BrandList = () => {
    const { isLoading, brands = [] } = useSelector((state) => state.category || {});
    const dispatch = useDispatch();
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

      useEffect(() => {
          dispatch(getBrands());
        }, [dispatch]);
  
        const confirmDelete = (slug) => {
          confirmAlert({
            title: "Delete Category",
            message: "Are you sure you want to delete this category?",
            buttons: [
              {
                label: "Delete",
                onClick: () => delBrand(slug),
              },
              {
                label: "Cancel",
                // onClick: () => alert('Click No')
              },
            ],
          });
        };
        
        const delBrand = async (slug) => {
          await dispatch(deleteBrand(slug));
          await dispatch(getBrands());
        };
  
    return (
      <div className="admin-taxonomy-panel">
          <div className="admin-taxonomy-panel-copy">
            <h3 className="admin-taxonomy-panel-title">All Brands</h3>
            <p className="admin-taxonomy-panel-subtitle">Manage product brands and their parent categories.</p>
          </div>
          <div className="admin-taxonomy-table-wrap">
              {brands.length === 0 ? (
                  <p className="admin-taxonomy-empty">No brand found!</p>
              ) : (
                  <table className="admin-taxonomy-table">
                      <thead>
                          <tr>
                              <th>s/n</th>
                              <th>Name</th>
                              <th>Category</th>
                              <th className="admin-taxonomy-table-head-actions">Action</th>
                          </tr>
                      </thead>
                      <tbody>
                          {brands.map((brand, index) => {
                              const { _id, name, slug, category } = brand;
                              return (
                                  <tr key={_id}>
                                      <td>
                                          {index + 1}
                                      </td>
                                      <td>
                                          {name}
                                      </td>
                                      <td>
                                          {category}
                                      </td>
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

export default BrandList
