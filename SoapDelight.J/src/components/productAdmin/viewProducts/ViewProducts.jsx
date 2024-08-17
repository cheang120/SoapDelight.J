import React, { useEffect, useState } from 'react'
import {useDispatch, useSelector} from 'react-redux'
import { deleteProduct, getProducts } from '../../../redux/features/product/productSlice'
import { selectIsLoggedIn } from '../../../redux/features/auth/authSlice'
import Search from '../../search/Search.jsx'
import { Spinner } from "../../../components/Loader.jsx";
import { FaEdit, FaTrashAlt } from "react-icons/fa";
import { AiOutlineEye } from "react-icons/ai";
import { Link } from "react-router-dom";
import { shortenText } from "../../../utils/index.jsx";
import ReactPaginate from "react-paginate";
import { confirmAlert } from "react-confirm-alert";
import "react-confirm-alert/src/react-confirm-alert.css";



const ViewProducts = () => {
  const { currentUser } = useSelector((state) => state.user);
  const [search, setSearch] = useState("");

  const dispatch = useDispatch()
  const isLoggedIn = useSelector(selectIsLoggedIn)
  const { products, isLoading, isError, message } = useSelector(
    (state) => state.product
  );

  const userRole = currentUser.role
    // console.log(userRole);

  if (userRole === 'author'){
    useEffect(() => {
      if (isLoggedIn) {
        dispatch(getProducts())
      }
      // console.log(products);
    },[isLoggedIn,dispatch])

    const delProduct = async (id) => {
      console.log(id);
      await dispatch(deleteProduct(id));
      await dispatch(getProducts());
    };

    const confirmDelete = (id) => {
      confirmAlert({
        title: "Delete Product",
        message: "Are you sure you want to delete this product.",
        buttons: [
          {
            label: "Delete",
            onClick: () => delProduct(id),
          },
          {
            label: "Cancel",
            // onClick: () => alert('Click No')
          },
        ],
      });
    };

  // Begin Pagination
  const itemsPerPage = 5;
  const [itemOffset, setItemOffset] = useState(0);
  const endOffset = itemOffset + itemsPerPage;
  const currentItems = products.slice(itemOffset, endOffset);
  const pageCount = Math.ceil(products.length / itemsPerPage);

  const handlePageClick = (event) => {
    const newOffset = (event.selected * itemsPerPage) % products.length;
    setItemOffset(newOffset);
  };
  // End Pagination
    
    return (
      <section className="py-8">
        <div className="container mx-auto">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-2xl font-semibold">All Products</h3>
              <p className="text-gray-600">
                ~ 
                <b>{products.length} Products Found</b>
              </p>
            </div>
            <div>
              <Search
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {isLoading && <Spinner />}

          <div className='overflow-x-auto'>
          {!isLoading && currentItems.length === 0 ? (
            <p>-- No product found...</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">s/n</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentItems.map((product, index) => {
                  const { _id, name, category, price, quantity } = product;
                  return (
                    <tr key={_id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{shortenText(name,16) }</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{category}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{"$"}{price}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{"$"}{price * quantity}</td>
                      <td className="flex px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span className="text-purple-600 hover:text-purple-900">
                          <Link to={`/product-details/${_id}`}>
                            <AiOutlineEye size={25} />
                          </Link>
                        </span>
                        <span className="text-green-600 hover:text-green-900 ml-4">
                          <Link to={`/productAdmin/edit-product/${_id}`}>
                            <FaEdit size={20} />
                          </Link>
                        </span>
                        <span className="text-red-600 hover:text-red-900 ml-4">
                          <FaTrashAlt size={20} onClick={() => confirmDelete(_id)} />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )} 
        </div>
        <ReactPaginate
          breakLabel="..."
          nextLabel="Next"
          onPageChange={handlePageClick}
          pageRangeDisplayed={3}
          pageCount={pageCount}
          previousLabel="Prev"
          renderOnZeroPageCount={null}
          containerClassName="flex justify-center items-center space-x-2 mt-4"
          pageLinkClassName="px-3 py-1 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-200"
          previousLinkClassName="px-3 py-1 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-200"
          nextLinkClassName="px-3 py-1 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-200"
          activeLinkClassName="px-3 py-1 border border-gray-300 rounded-md text-white bg-blue-500"
        />

        </div>
      </section>

    )

  }
}

export default ViewProducts
