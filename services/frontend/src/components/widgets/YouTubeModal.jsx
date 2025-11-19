import React, { useRef, useEffect } from "react";
import { Dialog } from "@headlessui/react";

const YouTubeModal = ({ youtubeId, onClose }) => {
  const panelRef = useRef(null);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  if (!youtubeId) return null;

  return (
    <Dialog open={!!youtubeId} onClose={onClose} className="relative z-50">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/60" aria-hidden="true" />

      {/* Centered Panel */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel
          ref={panelRef}
          className="relative bg-white rounded-lg overflow-hidden w-[320px] h-[180px] shadow-lg"
        >
          <iframe
            className="w-full h-full"
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
            frameBorder="0"
            allow="autoplay; encrypted-media"
            allowFullScreen
            title="YouTube Player"
          />

          <button
            onClick={onClose}
            className="absolute top-1 right-1 text-white text-lg bg-black/50 rounded-full px-2 hover:bg-black/70 transition"
            aria-label="Close video"
          >
            ✕
          </button>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default YouTubeModal;
