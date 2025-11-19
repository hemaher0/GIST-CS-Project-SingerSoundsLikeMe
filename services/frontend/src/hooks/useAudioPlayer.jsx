import { useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { openPlayback } from "../store/playbackSlice";

export default function useAudioPlayer() {
  const dispatch = useDispatch();

  const play = (item, idx = null) => {
    dispatch(
      openPlayback({
        tracks: [
          {
            audioUrl: item.audioUrl,
            image:
              item.user?.image || item.covered_by?.image || item.image || "",
            name:
              item.covered_by?.name ||
              item.user?.name ||
              item.name ||
              "Unknown",
            songTitle: item.covered_track?.title || item.title,
          },
        ],
        index: 0,
      })
    );
  };

  return { play };
}
