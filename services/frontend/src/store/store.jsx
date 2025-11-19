import { configureStore } from "@reduxjs/toolkit";
import playbackReducer from "./playbackSlice";
import userReducer from "./userSlice";
import historyReducer from "./historySlice";
import authReducer from "./authSlice";

export const store = configureStore({
  reducer: {
    playback: playbackReducer,
    user: userReducer,
    history: historyReducer,
    auth: authReducer,
  },
});
