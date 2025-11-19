import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../../utils/apiClient";
export const fetchCurrentUser = createAsyncThunk(
  "user/fetchCurrentUser",
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiClient.get("/users/me/");
      if (res.data.status === "ok") {
        return res.data.data;
      } else {
        return rejectWithValue(res.data.detail || "Failed to fetch user");
      }
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  },
  {
    condition: (_, { getState }) => {
      const {
        auth: { token },
        user: { status },
      } = getState();
      return Boolean(token) && status === "idle";
    },
  }
);

const initialState = {
  currentUser: null,
  status: "idle",
  error: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCurrentUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.currentUser = action.payload;
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export default userSlice.reducer;
