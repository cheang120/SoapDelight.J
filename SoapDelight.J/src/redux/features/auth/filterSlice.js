import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  filteredUsers: [],
};

const filterSlice = createSlice({
  name: "filter",
  initialState,
  reducers: {
    FILTER_USERS(state, action) {
      const { users, searchTerm } = action.payload;
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      
      const tempUsers = users.filter(
        (user) =>
          {
            // 新增：确保 username 和 email 已定义
            const username = user.username ? user.username.toLowerCase() : "";
            const email = user.email ? user.email.toLowerCase() : "";
            
            return (
              username.includes(lowerCaseSearchTerm) ||
              email.includes(lowerCaseSearchTerm)
            );
          }
      );
      state.filteredUsers = tempUsers;
    },
  },
});

export const { FILTER_USERS } = filterSlice.actions;

export const selectUsers = (state) => state.filter.filteredUsers;

export default filterSlice.reducer;