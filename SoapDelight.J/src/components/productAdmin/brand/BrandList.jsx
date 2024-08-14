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
  <div className="mb-8 p-4 bg-white shadow rounded-lg">
    <h3 className="text-xl font-semibold mb-4 text-gray-800">All Brands</h3>
    <div className="overflow-x-auto">
      {brands.length === 0 ? (
        <p className="text-gray-500 text-center">No brand found!</p>
      ) : (
        <table className="min-w-full bg-white border-y border-gray-200 rounded-lg">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 border-b text-left text-gray-600">s/n</th>
              <th className="px-4 py-2 border-b text-left text-gray-600">Name</th>
              <th className="px-4 py-2 border-b text-left text-gray-600">Category</th>
              <th className="px-4 py-2 border-b text-left text-gray-600">Action</th>
            </tr>
          </thead>
          <tbody>
            {brands.map((brand, index) => {
              const { _id, name,slug ,category} = brand;
              return (
                <tr key={_id} className="hover:bg-gray-50 transition duration-200">
                  <td className="px-4 py-3 border-b text-left text-gray-700">{index + 1}</td>
                  <td className="px-4 py-3 border-b text-left text-gray-700">{name}</td>
                  <td className="px-4 py-3 border-b text-left text-gray-700">{category}</td>
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

export default BrandList
