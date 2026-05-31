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
  
        const confirmDelete = (brand) => {
          confirmAlert({
            title: "刪除品牌",
            message: `確定要刪除「${brand.name}」嗎？`,
            buttons: [
              {
                label: "刪除",
                onClick: () => delBrand(brand._id),
              },
              {
                label: "取消",
                // onClick: () => alert('Click No')
              },
            ],
          });
        };
        
        const delBrand = async (brandId) => {
          await dispatch(deleteBrand(brandId));
          await dispatch(getBrands());
        };
  
    return (
      <div className="admin-taxonomy-panel">
          <div className="admin-taxonomy-panel-copy">
            <h3 className="admin-taxonomy-panel-title">所有品牌</h3>
            <p className="admin-taxonomy-panel-subtitle">管理商品品牌與所屬分類。</p>
          </div>
          <div className="admin-taxonomy-table-wrap">
              {brands.length === 0 ? (
                  <p className="admin-taxonomy-empty">暫未有品牌。</p>
              ) : (
                  <table className="admin-taxonomy-table">
                      <thead>
                          <tr>
                              <th>序號</th>
                              <th>名稱</th>
                              <th>分類</th>
                              <th className="admin-taxonomy-table-head-actions">操作</th>
                          </tr>
                      </thead>
                      <tbody>
                          {brands.map((brand, index) => {
                              const { _id, name, category } = brand;
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
                                          <button type="button" className="admin-taxonomy-icon-button admin-taxonomy-icon-button--delete" aria-label={`刪除 ${name}`} onClick={() => confirmDelete(brand)}>
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
