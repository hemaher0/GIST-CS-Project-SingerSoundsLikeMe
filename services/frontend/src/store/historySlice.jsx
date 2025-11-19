import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../../utils/apiClient";

export const deleteHistoryItem = createAsyncThunk(
  "history/deleteHistoryItem",
  async ({ category, id }, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/uploads/${id}/`);
      return { category, id };
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const fetchHistory = createAsyncThunk(
  "history/fetchHistory",
  async (category, { rejectWithValue }) => {
    try {
      const res = await apiClient.get("/users/me/files/");

      if (res.data.status !== "ok" || !Array.isArray(res.data.data)) {
        return rejectWithValue(res.data);
      }

      const raw = res.data.data.filter(
        (it) => it?.type === category && it?.original_name
      );

      const items = raw.map((it) => ({
        id: it.id,
        covered_by: it.user
          ? {
              name: it.user.name,
              image: it.user.image,
              id: it.user.id,
            }
          : {
              name: "Unknown",
              image: "https://via.placeholder.com/40",
              id: null,
            },
        covered_track: {
          title: it.original_name?.replace(/\.\w+$/, "") ?? "Untitled",
        },
        upload_date: it.upload_date
          ? new Date(it.upload_date * 1000).toISOString()
          : new Date().toISOString(),
        audioUrl: it.audioUrl ?? "",
        type: it.type ?? "uploaded",
      }));

      return { category, items };
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

const initialState = {
  uploaded: [],
  converted: [],
  matched: [],
  status: "idle",
  error: null,
};

const historySlice = createSlice({
  name: "history",
  initialState,
  reducers: {
    addHistoryItem(state, { payload: { category, item } }) {
      state[category].push(item);
    },
    setHistoryItems(state, { payload: { category, items } }) {
      state[category] = items;
    },
    clearHistoryCategory(state, { payload: category }) {
      state[category] = [];
    },
    clearAllHistory(state) {
      Object.keys(state).forEach((cat) => {
        state[cat] = [];
      });
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(deleteHistoryItem.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(deleteHistoryItem.fulfilled, (state, { payload }) => {
        const { category, id } = payload;
        state[category] = state[category].filter((item) => item.id !== id);
        state.status = "succeeded";
      })
      .addCase(deleteHistoryItem.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchHistory.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchHistory.fulfilled, (state, action) => {
        const { category, items } = action.payload;
        state[category] = items;
        state.status = "succeeded";
      })
      .addCase(fetchHistory.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export const {
  addHistoryItem,
  setHistoryItems,
  clearHistoryCategory,
  clearAllHistory,
} = historySlice.actions;
export default historySlice.reducer;
