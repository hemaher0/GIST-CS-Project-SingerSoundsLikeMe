import React, { useState } from "react";
import { Dialog } from "@headlessui/react";
import { CircleEllipsis, X, Youtube } from "lucide-react";

const TrackDetail = ({ item, onYouTubeClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { image, title, artistName, albumName, releaseDate, youtubeUrl } = item;

  const extractYoutubeId = (url) => {
    const match = url.match(/(?:v=|youtu\.be\/)([^&]+)/);
    return match ? match[1] : null;
  };

  return (
    <>
      <div className="mt-2 p-4 bg-white rounded-lg shadow flex items-start gap-4">
        <img
          src={image || ""}
          alt={title}
          className="w-16 h-16 rounded-md object-cover"
        />
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-bold text-lg">{title}</p>
              <p className="text-sm text-gray-600">{artistName}</p>
            </div>
            <div className="flex gap-2 items-center">
              {youtubeUrl && (
                <button
                  onClick={() => {
                    const id = extractYoutubeId(youtubeUrl);
                    if (id) onYouTubeClick(id);
                  }}
                  className="text-red-500 hover:text-red-700"
                  aria-label="Watch on YouTube"
                >
                  <Youtube className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(true)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="More"
              >
                <CircleEllipsis className="w-5 h-5" />
              </button>
            </div>
          </div>
          <p className="text-xs mt-2 text-gray-500">Released: {releaseDate}</p>
        </div>
      </div>

      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <Dialog.Title className="text-lg font-semibold">
                {title}
              </Dialog.Title>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-1">Album: {albumName}</p>
            <p className="text-sm text-gray-600 mb-1">
              Released: {releaseDate}
            </p>
          </Dialog.Panel>
        </div>
      </Dialog>
    </>
  );
};

export default TrackDetail;
