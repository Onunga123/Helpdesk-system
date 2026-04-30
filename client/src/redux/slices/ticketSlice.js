import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import API_URL from "../../config/api";

const TICKETS_API_URL = `${API_URL}/api/tickets`;

const getToken = () => localStorage.getItem("token");

export const getTickets = createAsyncThunk("tickets/getAll", async (filters = {}, thunkAPI) => {
  try {
    const params = new URLSearchParams(filters).toString();
    const { data } = await axios.get(TICKETS_API_URL + "?" + params, { headers: { Authorization: "Bearer " + getToken() } });
    return data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to fetch tickets");
  }
});

export const createTicket = createAsyncThunk("tickets/create", async (ticketData, thunkAPI) => {
  try {
    const { data } = await axios.post(TICKETS_API_URL, ticketData, { headers: { Authorization: "Bearer " + getToken() } });
    return data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to create ticket");
  }
});

export const updateTicket = createAsyncThunk("tickets/update", async ({ id, updates }, thunkAPI) => {
  try {
    const { data } = await axios.put(TICKETS_API_URL + "/" + id, updates, { headers: { Authorization: "Bearer " + getToken() } });
    return data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to update ticket");
  }
});

export const addComment = createAsyncThunk("tickets/addComment", async ({ id, comment }, thunkAPI) => {
  try {
    const { data } = await axios.post(TICKETS_API_URL + "/" + id + "/comments", { comment }, { headers: { Authorization: "Bearer " + getToken() } });
    return data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to add comment");
  }
});

const ticketSlice = createSlice({
  name: "tickets",
  initialState: { tickets: [], ticket: null, isLoading: false, isError: false, isSuccess: false, message: "" },
  reducers: {
    resetTickets: (state) => { state.isLoading = false; state.isError = false; state.isSuccess = false; state.message = ""; },
    clearTicket: (state) => { state.ticket = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getTickets.pending, (state) => { state.isLoading = true; })
      .addCase(getTickets.fulfilled, (state, action) => { state.isLoading = false; state.tickets = action.payload; })
      .addCase(getTickets.rejected, (state, action) => { state.isLoading = false; state.isError = true; state.message = action.payload; })
      .addCase(createTicket.pending, (state) => { state.isLoading = true; })
      .addCase(createTicket.fulfilled, (state, action) => { state.isLoading = false; state.isSuccess = true; state.tickets.unshift(action.payload); })
      .addCase(createTicket.rejected, (state, action) => { state.isLoading = false; state.isError = true; state.message = action.payload; })
      .addCase(updateTicket.fulfilled, (state, action) => { state.ticket = action.payload; const index = state.tickets.findIndex((t) => t._id === action.payload._id); if (index !== -1) state.tickets[index] = action.payload; })
      .addCase(addComment.fulfilled, (state, action) => { state.ticket = action.payload; });
  },
});

export const { resetTickets, clearTicket } = ticketSlice.actions;
export default ticketSlice.reducer;
