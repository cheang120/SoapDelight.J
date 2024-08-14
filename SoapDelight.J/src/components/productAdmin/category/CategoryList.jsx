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
<div className="mb-8 p-4 bg-white shadow rounded-lg">
  <h3 className="text-xl font-semibold mb-4 text-gray-800">All Categories</h3>
  <div className="overflow-x-auto">
    {categories.length === 0 ? (
      <p className="text-gray-500 text-center">No category found!</p>
    ) : (
      <table className="min-w-full bg-white border-y border-gray-200 rounded-lg">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-4 py-2 border-b text-left text-gray-600">s/n</th>
            <th className="px-4 py-2 border-b text-left text-gray-600">Name</th>
            <th className="px-4 py-2 border-b text-left text-gray-600">Action</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((cat, index) => {
            const { _id, name,slug } = cat;
            return (
              <tr key={_id} className="hover:bg-gray-50 transition duration-200">
                <td className="px-4 py-3 border-b text-left text-gray-700">{index + 1}</td>
                <td className="px-4 py-3 border-b text-left text-gray-700">{name}</td>
                <td className="px-4 py-3 border-b text-left">
                  <span className="text-red-500 cursor-pointer hover:text-red-700 transition duration-200">
                    <FaTrashAlt size={20}  onClick={() => confirmDelete(slug)}/>
                  </span>
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
