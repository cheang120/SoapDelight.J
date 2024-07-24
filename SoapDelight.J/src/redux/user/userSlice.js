import {createSlice} from '@reduxjs/toolkit'

const initialState = {
    currentUser:null,
    error:null,
    loading:false,
    isLoggedIn:false,
    user:null,
    users:[],
    twoFactor:false,
    isError:false,
    isSuccess:false,
    isLoading:false,
    message:"",
    verifiedUsers: 0,
    suspendedUsers: 0,
}

const userSlice = createSlice({
    name:'user',
    initialState,
    reducers:{
        signInStart: (state) => {
            state.loading = true;
            state.error = null
        },
        signInSuccess: (state, action) => {
            state.currentUser = action.payload;
            state.loading = false;
            state.error = null
        },
        signInFailure: (state,action) => {
            state.loading = false;
            state.error = action.payload
        },
        signoutSuccess: (state) => {
            state.currentUser = null;
            state.error = null;
            state.loading = false;
          },
        updateStart: (state) => {
            state.loading = true;
            state.error = null;
        },
        updateSuccess: (state, action) => {
            state.currentUser = action.payload;
            state.loading = false;
            state.error = null;
        },
        updateFailure: (state, action) => {
            state.loading = false;
            state.error = action.payload;
        },
        deleteUserStart: (state) => {
            state.loading = true;
            state.error = null;
          },
          deleteUserSuccess: (state) => {
            state.currentUser = null;
            state.loading = false;
            state.error = null;
          },
          deleteUserFailure: (state, action) => {
            state.loading = false;
            state.error = action.payload;
          },
          verifyUserStart: (state) => {
            state.loading = true;
            state.error = null;
          },
          verifyUserSuccess: (state) => {
            state.currentUser = null;
            state.loading = false;
            state.error = null;
          },
          verifyUserFailure: (state, action) => {
            state.loading = false;
            state.error = action.payload;
          },
          forgotStart: (state) => {
            state.loading = true;
            state.error = null;
          },
          forgotSuccess: (state) => {
            state.currentUser = null;
            state.loading = false;
            state.error = null;
          },
          forgotFailure: (state, action) => {
            state.loading = false;
            state.error = action.payload;
          },

    }
})

export const {
    signInStart,
    signInSuccess,
    signInFailure,  
    signoutSuccess,
    updateStart,
    updateSuccess,
    updateFailure, 
    deleteUserStart,
    deleteUserSuccess,
    deleteUserFailure,
    forgotStart,
    forgotSuccess,
    forgotFailure
} = userSlice.actions

export default userSlice.reducer