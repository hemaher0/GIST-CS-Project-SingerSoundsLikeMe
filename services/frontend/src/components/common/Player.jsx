import React, { useRef, useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  selectCurrentTrack,
  selectIsVisible,
  selectShowPlayerModal,
  selectLoop,
  selectShuffle,
  playNextTrack,
  playPrevTrack,
  toggleLoop,
  closePlayback,
  openPlayerModal,
  closePlayerModal,
} from "../../store/playbackSlice";
import { ChevronDown, X, Play, Pause, Repeat, Repeat1 } from "lucide-react";
import AudioPlayer from "react-h5-audio-player";
import "react-h5-audio-player/lib/styles.css";

export default function Player() {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentTrack);
  const isVisible = useSelector(selectIsVisible);
  const showPlayerModal = useSelector(selectShowPlayerModal);
  const loop = useSelector(selectLoop);
  const shuffle = useSelector(selectShuffle);
  const playerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [touchStartX, setTouchStartX] = useState(null);
  const modalRef = useRef(null);

  // Sync play/pause state
  useEffect(() => {
    const audioEl = playerRef.current?.audio?.current;
    if (audioEl) {
      const onPlay = () => setIsPlaying(true);
      const onPause = () => setIsPlaying(false);
      audioEl.addEventListener("play", onPlay);
      audioEl.addEventListener("pause", onPause);
      return () => {
        audioEl.removeEventListener("play", onPlay);
        audioEl.removeEventListener("pause", onPause);
      };
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showPlayerModal &&
        modalRef.current &&
        !modalRef.current.contains(event.target)
      ) {
        dispatch(closePlayerModal());
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showPlayerModal, dispatch]);

  if (!isVisible || !user) return null;

  const handleToggleModal = () => {
    if (showPlayerModal) dispatch(closePlayerModal());
    else dispatch(openPlayerModal());
  };

  const togglePlayPause = async (e) => {
    e.stopPropagation();
    const audioEl = playerRef.current?.audio?.current;
    if (audioEl) {
      try {
        if (audioEl.paused) await audioEl.play();
        else audioEl.pause();
      } catch (err) {
        console.warn("Playback error:", err);
      }
    }
  };

  // swipe for prev/next in bar mode
  const handleTouchStart = (e) => setTouchStartX(e.touches[0].clientX);
  const handleTouchEnd = (e) => {
    if (touchStartX == null) return;
    const diff = e.changedTouches[0].clientX - touchStartX;
    if (diff > 50) dispatch(playPrevTrack());
    else if (diff < -50) dispatch(playNextTrack());
    setTouchStartX(null);
  };

  return (
    <>
      {/* modal background */}
      {showPlayerModal && (
        <div
          className="fixed inset-0 bg-black/30 z-40"
          onClick={handleToggleModal}
        />
      )}

      {/* player container */}
      <div
        className={`fixed z-50 transition-all ${
          showPlayerModal
            ? "inset-0 flex items-center justify-center"
            : "bottom-20 left-0 right-0"
        }`}
        {...(!showPlayerModal
          ? { onTouchStart: handleTouchStart, onTouchEnd: handleTouchEnd }
          : {})}
      >
        <div
          ref={modalRef}
          className={`transition-all ${
            showPlayerModal
              ? "relative bg-white rounded-2xl p-4 w-[90vw] max-w-md shadow-2xl"
              : "bg-white border-t border-gray-200 p-3 shadow-lg"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* collapse button in modal */}
          {showPlayerModal && (
            <button
              onClick={() => dispatch(closePlayerModal())}
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-800"
              aria-label="Collapse modal"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          )}

          {/* HEADER: click this wrapper to open modal in bar mode */}
          <div
            className={`${
              showPlayerModal
                ? "flex flex-col items-center text-center mb-4"
                : "flex items-center justify-between cursor-pointer mb-2"
            }`}
            onClick={() => !showPlayerModal && handleToggleModal()}
          >
            {/* track info */}
            <div className="flex items-center gap-3">
              <img
                src={user.image}
                alt={user.name}
                className={
                  showPlayerModal
                    ? "w-16 h-16 rounded-full mb-4"
                    : "w-10 h-10 rounded-full"
                }
              />
              <div className={showPlayerModal ? "" : "flex flex-col"}>
                <p
                  className={
                    showPlayerModal
                      ? "text-base font-bold mb-1 max-w-[12rem] truncate"
                      : "text-sm font-semibold max-w-[12rem] truncate"
                  }
                >
                  {user.songTitle}
                </p>
                <p
                  className={
                    showPlayerModal
                      ? "text-sm text-gray-700"
                      : "text-xs text-gray-500"
                  }
                >
                  {user.name}
                </p>
              </div>
            </div>

            {/* control buttons in bar mode */}
            {!showPlayerModal && (
              <div
                className="flex items-center gap-3 z-10"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => dispatch(toggleLoop())}
                  className={`transition ${
                    loop ? "text-purple-600" : "text-gray-500"
                  }`}
                  aria-label="Loop"
                >
                  {loop ? (
                    <Repeat1 className="w-5 h-5" />
                  ) : (
                    <Repeat className="w-5 h-5" />
                  )}
                </button>
                <button
                  onClick={togglePlayPause}
                  className="text-gray-500 hover:text-gray-700 transition"
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6" />
                  ) : (
                    <Play className="w-6 h-6" />
                  )}
                </button>
                <button
                  onClick={() => dispatch(closePlayback())}
                  className="text-gray-500 hover:text-gray-700 transition"
                  aria-label="Close playback"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            )}
          </div>

          {/* audio player (slider) */}
          <div className="w-full" onClick={(e) => e.stopPropagation()}>
            <AudioPlayer
              ref={playerRef}
              autoPlay
              src={user.audioUrl}
              layout={showPlayerModal ? "stacked" : "horizontal"}
              showJumpControls={showPlayerModal}
              customAdditionalControls={showPlayerModal ? undefined : []}
              customVolumeControls={showPlayerModal ? undefined : []}
              showDownloadProgress={false}
              header=""
              className={
                showPlayerModal
                  ? "rhap_theme-minimal !p-1"
                  : "custom-slim-bar !p-0"
              }
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
          </div>
        </div>
      </div>
    </>
  );
}
