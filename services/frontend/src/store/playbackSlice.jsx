// playbackSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  playlist: [], // 전체 곡 목록
  currentIndex: 0, // 현재 재생 중인 곡의 인덱스
  isVisible: false, // 플레이어 바 표시 여부
  showPlayerModal: false, // 모달 확장 여부
  loop: false, // 반복 재생
  shuffle: false, // 셔플 재생
};

const playbackSlice = createSlice({
  name: "playback",
  initialState,
  reducers: {
    // 페이로드가 { tracks: [...], index } 형태이거나, 단일 트랙 객체일 수 있음
    openPlayback: (state, action) => {
      const payload = action.payload;
      if (payload?.tracks && Array.isArray(payload.tracks)) {
        state.playlist = payload.tracks;
        state.currentIndex = payload.index ?? 0;
      } else if (payload) {
        state.playlist = [payload]; // 단일 트랙도 배열로 감싸기
        state.currentIndex = 0;
      }
      state.isVisible = true;
      state.showPlayerModal = false;
    },

    // 다음/이전 트랙 재생 (셔플·루프 옵션 고려)
    playNextTrack: (state) => {
      const len = state.playlist.length;
      if (len === 0) return;
      if (state.shuffle) {
        state.currentIndex = Math.floor(Math.random() * len);
      } else {
        state.currentIndex =
          state.currentIndex < len - 1
            ? state.currentIndex + 1
            : state.loop
            ? 0
            : state.currentIndex;
      }
    },
    playPrevTrack: (state) => {
      const len = state.playlist.length;
      if (len === 0) return;
      if (state.shuffle) {
        state.currentIndex = Math.floor(Math.random() * len);
      } else {
        state.currentIndex =
          state.currentIndex > 0
            ? state.currentIndex - 1
            : state.loop
            ? len - 1
            : state.currentIndex;
      }
    },

    // 루프/셔플 토글
    toggleLoop: (state) => {
      state.loop = !state.loop;
    },
    toggleShuffle: (state) => {
      state.shuffle = !state.shuffle;
    },

    // 플레이어 UI 토글
    openPlayerModal: (state) => {
      state.showPlayerModal = true;
    },
    closePlayerModal: (state) => {
      state.showPlayerModal = false;
    },
    closePlayback: (state) => {
      Object.assign(state, initialState);
    },

    // 🔥 새로 추가: 플레이리스트에 곡 추가·삭제
    addToPlaylist: (state, action) => {
      state.playlist.push(action.payload);
    },
    removeFromPlaylist: (state, action) => {
      const id = action.payload;
      const idx = state.playlist.findIndex((t) => t.id === id);
      if (idx !== -1) {
        state.playlist.splice(idx, 1);
        // currentIndex 보정
        if (state.currentIndex >= state.playlist.length) {
          state.currentIndex = state.playlist.length - 1;
        }
      }
    },
  },
});

export const {
  openPlayback,
  playNextTrack,
  playPrevTrack,
  toggleLoop,
  toggleShuffle,
  openPlayerModal,
  closePlayerModal,
  closePlayback,
  addToPlaylist,
  removeFromPlaylist,
} = playbackSlice.actions;

// Selector
export const selectCurrentTrack = (state) =>
  state.playback.playlist[state.playback.currentIndex] ?? null;
export const selectIsVisible = (state) => state.playback.isVisible;
export const selectShowPlayerModal = (state) => state.playback.showPlayerModal;
export const selectLoop = (state) => state.playback.loop;
export const selectShuffle = (state) => state.playback.shuffle;

export default playbackSlice.reducer;
