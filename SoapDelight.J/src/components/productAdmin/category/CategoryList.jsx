import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { deleteCategory, getCategories } from '../../../redux/features/categoryAndBrand/categoryAndBrandSlice';
import { FaTrashAlt } from 'react-icons/fa';
import { confirmAlert } from "react-confirm-alert";
import "react-confirm-alert/src/react-confirm-alert.css";

const CategoryList = () => {
  const { isLoading, categories = [] } = useSelector((state) => state.category || {});
  const dispatch = useDispatch();
  window.scrollTo(0, 0);

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
    <div className="mb-8 p-4 bg-white dark:bg-gray-800 shadow rounded-lg min-h-screen">
      <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">All Categories</h3>
      <div className="overflow-x-auto">
        {categories.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center">No category found!</p>
        ) : (
          <table className="min-w-full bg-white dark:bg-gray-700 border-y border-gray-200 dark:border-gray-600 rounded-lg">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-900">
                <th className="px-4 py-2 border-b text-left text-gray-600 dark:text-gray-300">s/n</th>
                <th className="px-4 py-2 border-b text-left text-gray-600 dark:text-gray-300">Name</th>
                <th className="px-4 py-2 border-b text-left text-gray-600 dark:text-gray-300">Action</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat, index) => {
                const { _id, name, slug } = cat;
                return (
                  <tr key={_id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition duration-200">
                    <td className="px-4 py-3 border-b text-left text-gray-700 dark:text-gray-300">{index + 1}</td>
                    <td className="px-4 py-3 border-b text-left text-gray-700 dark:text-gray-300">{name}</td>
                    <td className="px-4 py-3 border-b text-left">
                      <span className="text-red-500 dark:text-red-400 cursor-pointer hover:text-red-700 dark:hover:text-red-600 transition duration-200">
                        <FaTrashAlt size={20} onClick={() => confirmDelete(slug)} />
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
