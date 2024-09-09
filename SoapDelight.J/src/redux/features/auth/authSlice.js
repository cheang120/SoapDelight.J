import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { toast } from "react-toastify";
import authService from "./authService";
import axios from 'axios';

const initialState = {
  auth:{
    isLoading:false,
    isLoggedIn:false,
    isSuccess:false,
    message:"",
    user:null,
    wishlist:[],
    users:[],
    twoFactor:false,
    isError:false,
    verifiedUsers: 0,
    suspendedUsers: 0,
    currentUsers:null
  }

}

export const SEND_VERIFICATION_EMAIL = 'SEND_VERIFICATION_EMAIL';

// signup User
export const signup = createAsyncThunk(
  '/api/auth/signup',
  async (userData, thunkAPI) => {
    try {
      return  await authService.signup(userData);

    } catch (error) {
      const message =
        (error.response && error.response.data && error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);


// send Verification Email
export const sendVerificationEmail = createAsyncThunk(
  SEND_VERIFICATION_EMAIL,
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/auth/sendVerificationEmail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // 填寫必要的郵件參數
          subject: 'Verification Email',
          send_to: 'user@example.com',
          reply_to: 'no-reply@example.com',
          template: 'verification',
          url: '/verify'
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      return data.message;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// verify User
export const verifyUser = createAsyncThunk(
  "auth/verifyUser",
  async (verificationToken, thunkAPI) => {
    try {
      return await authService.verifyUser(verificationToken)
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }

)

// forgot Password
export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async (userData, thunkAPI) => {
    try {
      return await authService.forgotPassword(userData);
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Reset Password
export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async ({ userData, resetToken }, thunkAPI) => {
      try {
          const response = await axios.patch(
              `/api/auth/resetPassword/${resetToken}`,
              userData
          );
          return response.data.message;
      } catch (error) {
          const message =
              (error.response &&
                  error.response.data &&
                  error.response.data.message) ||
              error.message ||
              error.toString();
          return thunkAPI.rejectWithValue(message);
      }
  }
);


// Get Login Status
export const getLoginStatus = createAsyncThunk(
  "auth/getLoginStatus",
  async (_, thunkAPI) => {
    try {
      return await authService.getLoginStatus();
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);


export const getUsers = createAsyncThunk('auth/getUsers', async () => {
  try {
    const response = await axios.get('/api/auth/getUsers');
    const usersData = response.data.users.map(user => ({
      ...user,
      role: user.role // 假設從 API 中取得了使用者的角色資料
    }));
    
    return usersData;
  } catch (error) {
    throw error;
  }
});



export const login = createAsyncThunk('auth/login', async (credentials) => {
  const response = await axios.post('/api/login', credentials);
  return response.data;
});

export const upgradeUser = createAsyncThunk(
  "auth/upgradeUser",
  async (currentUsers, thunkAPI) => {
    try {
      const response = await axios.post('/api/auth/upgradeUser', { id: currentUsers.id, role: currentUsers.role });
      return response.data;
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const deleteUser = createAsyncThunk(
  'auth/deleteUser',
  async (userId, thunkAPI) => {
    try {
      const response = await axios.delete(`/api/user/deleteUser/${userId}`);
      return response.data;
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// ADD TO WISHLIST
export const addToWishlist = createAsyncThunk(
  "auth/addToWishlist",
  async (productData, thunkAPI) => {
    try {
      return await authService.addToWishlist(productData);
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get Wishlist
export const getWishlist = createAsyncThunk(
  "auth/getWishlist",
  async (_, thunkAPI) => {
    try {
      return await authService.getWishlist();
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// remove from Wishlist
export const removeFromWishlist = createAsyncThunk(
  "auth/removeFromWishlist",
  async (productId, thunkAPI) => {
    try {
      return await authService.removeFromWishlist(productId);
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);


const authSlice = createSlice({
  name: "auth",
  initialState:{
    users: [],
    isLoading: false,
    error: null,
  },
  reducers: {
    RESET(state){
        state.isError = false;
        state.isSuccess=false;
        state.isLoading=false;
        state.message=""
    },
    CALC_VERIFIED_USER(state, action) {
      const array = [];
      state.users.map((user) => {
        const { isVerified } = user;
        return array.push(isVerified);
      });
      let count = 0;
      array.forEach((item) => {
        if (item === true) {
          count += 1;
        }
      });
      state.verifiedUsers = count;
    },
    CALC_SUSPENDED_USER(state, action) {
      const array = [];
      state.users.map((user) => {
        const { role } = user;
        return array.push(role);
      });
      let count = 0;
      array.forEach((item) => {
        if (item === "suspended") {
          count += 1;
        }
      });
      state.suspendedUsers = count;
    },
  },
  extraReducers: (builder) => {
    builder
        // Signup User
      .addCase(signup.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(signup.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.isLoggedIn = true;
        state.user = action.payload;
        toast.success("Registration Successful");
        console.log(action.payload);
      })
      .addCase(signup.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        state.user = null;
        toast.error(action.payload);
      })

      .addCase(sendVerificationEmail.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(sendVerificationEmail.fulfilled, (state, action) => {
        state.isLoading = false;
        // handle successful email verification
      })
      .addCase(sendVerificationEmail.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = action.payload;
      })

        // Login User
        .addCase(login.pending, (state) => {
            state.isLoading = true;
        })
        .addCase(login.fulfilled, (state, action) => {
            state.isLoading = false;
            state.isSuccess = true;
            state.isLoggedIn = true;
            state.user = action.payload;
            toast.success("Login Successful");
            console.log(action.payload);
        })
        .addCase(login.rejected, (state, action) => {
            state.isLoading = false;
            state.isError = true;
            state.message = action.payload;
            state.user = null;
            toast.error(action.payload);
            if (action.payload.includes("New browser")) {
                state.twoFactor = true;
            }
        })

        // Logout User
        // .addCase(logout.pending, (state) => {
        //     state.isLoading = true;
        // })
        // .addCase(logout.fulfilled, (state, action) => {
        //     state.isLoading = false;
        //     state.isSuccess = true;
        //     state.isLoggedIn = false;
        //     state.user = null;
        //     toast.success(action.payload);
        // })
        // .addCase(logout.rejected, (state, action) => {
        //     state.isLoading = false;
        //     state.isError = true;
        //     state.message = action.payload;
        //     toast.error(action.payload);
        // })

        // Get Login Status
        // .addCase(getLoginStatus.pending, (state) => {
        //     state.isLoading = true;
        // })
        // .addCase(getLoginStatus.fulfilled, (state, action) => {
        //     state.isLoading = false;
        //     state.isSuccess = true;
        //     state.isLoggedIn = action.payload;
        //     console.log(action.payload);
        // })
        // .addCase(getLoginStatus.rejected, (state, action) => {
        //     state.isLoading = false;
        //     state.isError = true;
        //     state.message = action.payload;
        //     // console.log(action.payload);
        // })

      // Get User
      // .addCase(getUser.pending, (state) => {
      //   state.isLoading = true;
      // })
      // .addCase(getUser.fulfilled, (state, action) => {
      //   state.isLoading = false;
      //   state.isSuccess = true;
      //   state.isLoggedIn = true;
      //   state.user = action.payload;
      // })
      // .addCase(getUser.rejected, (state, action) => {
      //   state.isLoading = false;
      //   state.isError = true;
      //   state.message = action.payload;
      //   toast.error(action.payload);
      // })

      // Update user
      // .addCase(updateUser.pending, (state) => {
      //   state.isLoading = true;
      // })
      // .addCase(updateUser.fulfilled, (state, action) => {
      //   state.isLoading = false;
      //   state.isSuccess = true;
      //   state.isLoggedIn = true;
      //   state.user = action.payload;
      //   toast.success("User Updated");
      // })
      // .addCase(updateUser.rejected, (state, action) => {
      //   state.isLoading = false;
      //   state.isError = true;
      //   state.message = action.payload;
      //   toast.error(action.payload);
      // })

      // send Verification Email
      // .addCase(sendVerificationEmail.pending, (state) => {
      //   state.isLoading = true;
      // })
      // .addCase(sendVerificationEmail.fulfilled, (state, action) => {
      //   state.isLoading = false;
      //   state.isSuccess = true;
      //   state.message = action.payload;
      //   toast.success(action.payload);
      // })
      // .addCase(sendVerificationEmail.rejected, (state, action) => {
      //   state.isLoading = false;
      //   state.isError = true;
      //   state.message = action.payload;
      //   toast.error(action.payload);
      // })

      // verify User
      .addCase(verifyUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(verifyUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.message = action.payload;
        toast.success(action.payload);
      })
      .addCase(verifyUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        toast.error(action.payload);
      })

      // change Password
      // .addCase(changePassword.pending, (state) => {
      //   state.isLoading = true;
      // })
      // .addCase(changePassword.fulfilled, (state, action) => {
      //   state.isLoading = false;
      //   state.isSuccess = true;
      //   state.message = action.payload;
      //   toast.success(action.payload);
      // })
      // .addCase(changePassword.rejected, (state, action) => {
      //   state.isLoading = false;
      //   state.isError = true;
      //   state.message = action.payload;
      //   toast.error(action.payload);
      // })

       // forgotPassword
       .addCase(forgotPassword.pending, (state) => {
         state.isLoading = true;
       })
       .addCase(forgotPassword.fulfilled, (state, action) => {
         state.isLoading = false;
         state.isSuccess = true;
         state.message = action.payload;
         toast.success(action.payload);
       })
       .addCase(forgotPassword.rejected, (state, action) => {
         state.isLoading = false;
         state.isError = true;
         state.message = action.payload;
         toast.error(action.payload);
       })

         // resetPassword
         .addCase(resetPassword.pending, (state) => {
          state.isLoading = true;
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
          state.isLoading = false;
          state.isSuccess = true;
          state.message = action.payload;
          toast.success(action.payload);
      })
      .addCase(resetPassword.rejected, (state, action) => {
          state.isLoading = false;
          state.isError = true;
          state.message = action.payload;
          toast.error(action.payload);
      })

      // Get Users
      .addCase(getUsers.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.users = action.payload;
      })
      .addCase(getUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        toast.error(action.payload);
      })

      

      // deleteUser
      .addCase(deleteUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.message = action.payload;
        toast.success(action.payload);
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        toast.error(action.payload);
      })

      // upgradeUser
      // .addCase(upgradeUser.pending, (state) => {
      //   state.isLoading = true;
      // })
      // .addCase(upgradeUser.fulfilled, (state, action) => {
      //   state.isLoading = false;
      //   state.isSuccess = true;
      //   state.message = action.payload;
      //   toast.success(action.payload);
      // })
      // .addCase(upgradeUser.rejected, (state, action) => {
      //   state.isLoading = false;
      //   state.isError = true;
      //   state.message = action.payload;
      //   toast.error(action.payload);
      // })





      // loginWithGoogle
      // .addCase(loginWithGoogle.pending, (state) => {
      //   state.isLoading = true;
      // })
      // .addCase(loginWithGoogle.fulfilled, (state, action) => {
      //   state.isLoading = false;
      //   state.isSuccess = true;
      //   state.isLoggedIn = true;
      //   state.user = action.payload;
      //   toast.success("Login Successful");
      // })
      // .addCase(loginWithGoogle.rejected, (state, action) => {
      //   state.isLoading = false;
      //   state.isError = true;
      //   state.message = action.payload;
      //   state.user = null;
      //   toast.error(action.payload);
      // });

            // 处理其他异步操作的状态
      // 处理 upgradeUser 的状态
      .addCase(upgradeUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(upgradeUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        // 更新用户状态
        const index = state.users.findIndex(user => user.id === action.payload.id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
        toast.success("User upgraded successfully");
      })
      .addCase(upgradeUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        toast.error(action.payload);
      })
      // Add to wishlist
      .addCase(addToWishlist.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(addToWishlist.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.message = action.payload;
        toast.success(action.payload);
        console.log(action.payload);
      })
      .addCase(addToWishlist.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        toast.error(action.payload);
      })
      // getWishlist
      .addCase(getWishlist.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getWishlist.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.wishlist = action.payload.wishlist;
      })
      .addCase(getWishlist.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        toast.error(action.payload);
      })
      // removeFromWishlist
      .addCase(removeFromWishlist.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(removeFromWishlist.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.message = action.payload;
        toast.success(action.payload);
      })
      .addCase(removeFromWishlist.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        toast.error(action.payload);
      })


      
       
  }
});

export const {RESET,CALC_VERIFIED_USER, CALC_SUSPENDED_USER} = authSlice.actions

export const selectIsLoggedIn = (state) => state.auth.isLoggedIn
export const selectUser = (state) => state.auth.user

export default authSlice.reducer