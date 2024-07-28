import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FaTrashAlt } from 'react-icons/fa';
import "react-confirm-alert/src/react-confirm-alert.css";
import ReactPaginate from "react-paginate";
import { getUsers } from "../redux/features/auth/authSlice";
import ChangeRole from "./ChangeRole";

const UserList = () => {
  const dispatch = useDispatch();
  const { users, isLoading, error, currentUser } = useSelector((state) => state.auth); // 假設 currentUser 包含當前用戶的信息
  const [currentPage, setCurrentPage] = useState(0);
  const usersPerPage = 10;

  useEffect(() => {
    dispatch(getUsers());
  }, [dispatch]);

  if (error) {
    return <p>載入資料時出錯: {error}</p>;
  }


  const handlePageClick = (data) => {
    setCurrentPage(data.selected);
  };

  const currentUsers = users.slice(
    currentPage * usersPerPage,
    (currentPage + 1) * usersPerPage
  );

  const pageCount = Math.ceil(users.length / usersPerPage);

  const confirmDelete = (id) => {
    console.log(`Delete user with id: ${id}`);
  };

  return (
    <section>
      <div className='container'>
        <div className='user-list'>
          <div className='table'>
            <div className='--flex-between'>
              <span>
                <h3>All Users</h3>
              </span>
            </div>

            <table>
              <thead>
                <tr>
                  <th>s/n</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Change Role</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(currentUsers) && currentUsers.map((user, index) => (
                  <tr key={user._id}>
                    <td>{currentPage * usersPerPage + index + 1}</td>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>
                      <ChangeRole key={`changeRole-${user._id}`} _id={user._id} email={user.email} />
                    </td>
                    <td>
                      <span>
                        <FaTrashAlt size={20} color='red' onClick={() => confirmDelete(user._id)} />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

          </div>

          <ReactPaginate
            previousLabel={"previous"}
            nextLabel={"next"}
            breakLabel={"..."}
            breakClassName={"break-me"}
            pageCount={pageCount}
            marginPagesDisplayed={2}
            pageRangeDisplayed={5}
            onPageChange={handlePageClick}
            containerClassName={"pagination"}
            subContainerClassName={"pages pagination"}
            activeClassName={"active"}
          />

        </div>
      </div>
    </section>
  );
}

export default UserList;