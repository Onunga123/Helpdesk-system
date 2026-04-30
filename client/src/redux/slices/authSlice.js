import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import API_URL from "../../config/api";

const AUTH_API_URL = `${API_URL}/api/auth`;

const userFromStorage = localStorage.getItem("user")
  ? JSON.parse(localStorage.getItem("user"))
  : null;

export const loginUser = createAsyncThunk("auth/login", async ({ email, password }, thunkAPI) => {
  try {
    const { data } = await axios.post(AUTH_API_URL + "/login", { email, password });
    localStorage.setItem("token", data.data.token);
    localStorage.setItem("user", JSON.stringify(data.data));
    return data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Login failed");
  }
});

export const registerUser = createAsyncThunk("auth/register", async (userData, thunkAPI) => {
  try {
    const { data } = await axios.post(AUTH_API_URL + "/register", userData);
    localStorage.setItem("token", data.data.token);
    localStorage.setItem("user", JSON.stringify(data.data));
    return data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Registration failed");
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: userFromStorage,
    isLoading: false,
    isError: false,
    isSuccess: false,
    message: "",
  },
  reducers: {
    logout: (state) => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      state.user = null;
      state.isLoading = false;
      state.isError = false;
      state.isSuccess = false;
      state.message = "";
    },
    resetAuth: (state) => {
      state.isLoading = false;
      state.isError = false;
      state.isSuccess = false;
      state.message = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => { state.isLoading = true; state.isError = false; })
      .addCase(loginUser.fulfilled, (state, action) => { state.isLoading = false; state.isSuccess = true; state.user = action.payload; })
      .addCase(loginUser.rejected, (state, action) => { state.isLoading = false; state.isError = true; state.message = action.payload; state.user = null; })
      .addCase(registerUser.pending, (state) => { state.isLoading = true; state.isError = false; })
      .addCase(registerUser.fulfilled, (state, action) => { state.isLoading = false; state.isSuccess = true; state.user = action.payload; })
      .addCase(registerUser.rejected, (state, action) => { state.isLoading = false; state.isError = true; state.message = action.payload; });
  },
});

export const { logout, resetAuth } = authSlice.actions;
export default authSlice.reducer;
