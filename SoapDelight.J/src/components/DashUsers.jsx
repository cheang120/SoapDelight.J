import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FaTrashAlt } from 'react-icons/fa';
import "react-confirm-alert/src/react-confirm-alert.css";
import ReactPaginate from "react-paginate";
import { getUsers, deleteUser } from "../redux/features/auth/authSlice";
import ChangeRole from "./ChangeRole";
import { FILTER_USERS, selectUsers } from '../redux/features/auth/filterSlice';
import { Button, Modal } from 'flowbite-react';

const UserList = () => {
  const dispatch = useDispatch();
  const { users, isLoading, error, currentUser } = useSelector((state) => state.auth);
  const filteredUsers = useSelector(selectUsers);
  const [currentPage, setCurrentPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const usersPerPage = 10;
  const [showModal, setShowModal] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState(null);

  useEffect(() => {
    dispatch(getUsers());
  }, [dispatch]);

  useEffect(() => {
    if (users.length > 0) {
      dispatch(FILTER_USERS({ users, searchTerm }));
    }
  }, [users, searchTerm, dispatch]);

  if (error) {
    return <p className="text-red-500">載入資料時出錯: {error}</p>;
  }

  const handlePageClick = (data) => {
    setCurrentPage(data.selected);
  };

  const currentUsers = filteredUsers.slice(
    currentPage * usersPerPage,
    (currentPage + 1) * usersPerPage
  );

  const pageCount = Math.ceil(filteredUsers.length / usersPerPage);

  const handleDeleteClick = (id) => {
    setDeleteUserId(id);
    setShowModal(true);
  };

  const confirmDelete = async () => {
    setShowModal(false);
    try {
      dispatch(deleteUser.pending());
      const res = await fetch(`/api/auth/deleteUser/${deleteUserId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        dispatch(deleteUser.rejected(data.message));
      } else {
        dispatch(deleteUser.fulfilled(data));
        window.location.reload(); 
      }
    } catch (error) {
      dispatch(deleteUser.rejected(error.message));
    }
  };

  return (
    <section className="py-8 bg-gray-100 min-h-screen overflow-y-scroll overflow-x-scroll">
      <div className="max-w-1000 mx-auto px-4">
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-gray-700">All Users</h3>
            <input 
              type="text" 
              className="border border-gray-300 rounded-lg px-4 py-2"
              placeholder="Search by username or email"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="px-6 py-3 border-b-2 border-gray-300 text-left text-sm leading-4 text-gray-600 uppercase tracking-wider">
                    S/N
                  </th>
                  <th className="px-6 py-3 border-b-2 border-gray-300 text-left text-sm leading-4 text-gray-600 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 border-b-2 border-gray-300 text-left text-sm leading-4 text-gray-600 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 border-b-2 border-gray-300 text-left text-sm leading-4 text-gray-600 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 border-b-2 border-gray-300 text-left text-sm leading-4 text-gray-600 uppercase tracking-wider">
                    Change Role
                  </th>
                  <th className="px-6 py-3 border-b-2 border-gray-300 text-left text-sm leading-4 text-gray-600 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(currentUsers) && currentUsers.map((user, index) => (
                  <tr key={user._id} className="hover:bg-gray-100">
                    <td className="px-6 py-2 whitespace-no-wrap border-b border-gray-200" data-label="S/N">
                      {currentPage * usersPerPage + index + 1}
                    </td>
                    <td className="px-6 py-2 whitespace-no-wrap border-b border-gray-200" data-label="Name">
                      {user.username}
                    </td>
                    <td className="px-6 py-2 whitespace-no-wrap border-b border-gray-200" data-label="Email">
                      {user.email}
                    </td>
                    <td className="px-6 py-2 whitespace-no-wrap border-b border-gray-200" data-label="Role">
                      {user.role}
                    </td>
                    <td className="px-6 py-2 whitespace-no-wrap border-b border-gray-200" data-label="Change Role">
                      <ChangeRole key={`changeRole-${user._id}`} _id={user._id} email={user.email} />
                    </td>
                    <td className="px-6 py-2 whitespace-no-wrap border-b border-gray-200" data-label="Action">
                      <span className="cursor-pointer text-red-600">
                        <FaTrashAlt 
                          size={20} 
                          onClick={() => handleDeleteClick(user._id)} 
                        />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6">
            <ReactPaginate
              previousLabel={"Previous"}
              nextLabel={"Next"}
              breakLabel={"..."}
              breakClassName={"break-me"}
              pageCount={pageCount}
              marginPagesDisplayed={2}
              pageRangeDisplayed={5}
              onPageChange={handlePageClick}
              containerClassName={"pagination flex justify-center mt-4"}
              pageClassName={"page-item"}
              pageLinkClassName={"page-link bg-white border-gray-300 text-gray-700 hover:bg-gray-200 px-3 py-1 rounded"}
              previousClassName={"page-item"}
              previousLinkClassName={"page-link bg-white border-gray-300 text-gray-700 hover:bg-gray-200 px-3 py-1 rounded"}
              nextClassName={"page-item"}
              nextLinkClassName={"page-link bg-white border-gray-300 text-gray-700 hover:bg-gray-200 px-3 py-1 rounded"}
              activeClassName={"active"}
              activeLinkClassName={"bg-blue-500 text-white"}
            />
          </div>
        </div>
      </div>
      
      <Modal show={showModal} onClose={() => setShowModal(false)}>
        <Modal.Header>確認刪除</Modal.Header>
        <Modal.Body>
          <p>你確定要刪除此用戶嗎？此操作不可撤銷。</p>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={confirmDelete} color="failure">
            確認
          </Button>
          <Button onClick={() => setShowModal(false)}>
            取消
          </Button>
        </Modal.Footer>
      </Modal>
    </section>
  );
}

export default UserList;