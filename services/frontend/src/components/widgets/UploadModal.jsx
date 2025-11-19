// src/components/features/UploadModal.jsx
import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Dialog } from "@headlessui/react";
import { X, Mic, UploadCloud, Trash2, Play, Pause } from "lucide-react";
import FileUpload from "../common/FileUpload";
import VoiceRecorder from "../common/VoiceRecorder";
import ListItem from "../common/ListItem";
import { addHistoryItem } from "../../store/historySlice";

import {
  createObjectUrlEntry,
  revokeObjectUrl,
  uploadToServer,
} from "../../hooks/uploadHelpers";

export default function UploadModal({ isOpen, onClose }) {
  const [uploaded, setUploaded] = useState([]);
  const [playingIdx, setPlayingIdx] = useState(null);
  const audioRef = useRef(null);
  const panelRef = useRef(null);

  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);
  const currentUser = useSelector((state) => state.user.currentUser);

  const clearAll = () => {
    uploaded.forEach(({ url }) => revokeObjectUrl(url));
    setUploaded([]);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlayingIdx(null);
  };

  const handleClose = () => {
    clearAll();
    onClose();
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isOpen && panelRef.current && !panelRef.current.contains(e.target)) {
        handleClose();
      }
    };
    const handleKey = (e) => {
      if (e.key === "Escape" && isOpen) handleClose();
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isOpen]);

  const handleFile = (file) => {
    setUploaded((prev) => [...prev, createObjectUrlEntry(file)]);
  };

  const handleDelete = (idx) => {
    const entry = prev[idx];
    revokeObjectUrl(entry.url);
    setUploaded((prev) => prev.filter((_, i) => i !== idx));
    if (playingIdx === idx && audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setPlayingIdx(null);
    }
  };

  const togglePlay = (idx) => {
    const { url } = uploaded[idx];
    if (playingIdx === idx) {
      audioRef.current.pause();
      audioRef.current = null;
      setPlayingIdx(null);
    } else {
      if (audioRef.current) audioRef.current.pause();
      const audio = new Audio(url);
      audio.play().catch(() => {});
      audioRef.current = audio;
      setPlayingIdx(idx);
    }
  };

  const handleSubmit = async () => {
    for (let { file } of uploaded) {
      try {
        const { filename, path } = await uploadToServer(file, token);
        dispatch(
          addHistoryItem({
            category: "uploaded",
            item: {
              id: filename,
              covered_by: {
                name: currentUser?.name || "Unknown",
                image: currentUser?.image || "/default-avatar.png",
              },
              covered_track: {
                title: file.name.replace(/\.\w+$/, ""),
              },
              upload_date: new Date().toISOString(),
              audioUrl: path,
              type: "uploaded",
            },
          })
        );
      } catch (err) {
        console.error("Upload failed:", err);
      }
    }
    handleClose();
  };
  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel
          ref={panelRef}
          className="w-full max-w-md bg-white rounded-2xl p-6 space-y-4 shadow-xl"
        >
          {/* Header */}
          <div className="flex justify-between items-center">
            <Dialog.Title className="text-lg font-semibold">
              Upload Audio or Record Voice
            </Dialog.Title>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700 transition"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Upload prompt */}
          {uploaded.length === 0 && (
            <FileUpload onUpload={handleFile}>
              {({ openFileDialog }) => (
                <div
                  onClick={openFileDialog}
                  className="flex items-center justify-center gap-2 py-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition"
                >
                  <UploadCloud className="w-6 h-6 text-gray-400" />
                  <span className="text-gray-500">Click to upload a file</span>
                </div>
              )}
            </FileUpload>
          )}

          {/* Voice recorder */}
          <VoiceRecorder onUpload={handleFile}>
            {({ recording, startRecording, stopRecording }) => (
              <button
                onClick={() => (recording ? stopRecording() : startRecording())}
                className={`w-full flex items-center justify-center gap-2 py-2 rounded-full font-medium shadow transition ${
                  recording
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "bg-indigo-500 hover:bg-indigo-600 text-white"
                }`}
              >
                <Mic className="w-5 h-5" />
                {recording ? "Stop Recording" : "Record Voice"}
              </button>
            )}
          </VoiceRecorder>

          {/* Uploaded list */}
          {uploaded.length > 0 && (
            <div className="mt-2 space-y-2 max-h-48 overflow-auto">
              {uploaded.map(({ file, url }, idx) => (
                <ListItem
                  key={idx}
                  isSelected={false}
                  actions={[
                    {
                      icon: playingIdx === idx ? Pause : Play,
                      onClick: () => togglePlay(idx),
                      ariaLabel:
                        playingIdx === idx ? "Pause audio" : "Play audio",
                    },
                    {
                      icon: Trash2,
                      onClick: () => handleDelete(idx),
                      ariaLabel: "Delete file",
                    },
                  ]}
                >
                  <p className="truncate text-sm">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </ListItem>
              ))}
              <FileUpload onUpload={handleFile}>
                {({ openFileDialog }) => (
                  <div
                    onClick={openFileDialog}
                    className="flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition"
                  >
                    <UploadCloud className="w-5 h-5 text-gray-500" />
                    <span className="text-gray-600 text-sm">
                      Upload another file
                    </span>
                  </div>
                )}
              </FileUpload>
            </div>
          )}

          {/* Done button */}
          <button
            onClick={handleSubmit}
            className="mt-4 w-full py-2 font-medium rounded-full bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            Done
          </button>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
