import React, { useState } from "react";
import { Dialog } from "@headlessui/react";
import { Music, X } from "lucide-react";

const CoverDetail = ({ item }) => {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className="mt-2 p-4 bg-white rounded-lg shadow">
        <div className="flex items-center gap-3 mb-3">
          <img
            src={item.covered_artist.image}
            alt={item.covered_artist.name}
            className="w-12 h-12 rounded-full object-cover"
          />
          <div>
            <p className="font-semibold text-lg">{item.covered_artist.name}</p>
            <p className="text-sm text-gray-500">{item.covered_track.title}</p>
          </div>
        </div>

        <div className="mb-2">
          <p className="text-sm font-semibold mb-1">Covered By:</p>
          <div className="flex items-center gap-2">
            <img
              src={item.covered_by.image}
              alt={item.covered_by.name}
              className="w-8 h-8 rounded-full"
            />
            <p className="text-sm text-gray-700">{item.covered_by.name}</p>
          </div>
        </div>

        <p className="text-sm text-gray-600 mt-2">Likes: {item.likes}</p>
        <p className="text-sm text-gray-600">Uploaded: {item.upload_date}</p>

        <div className="mt-3 flex justify-end">
          <button
            onClick={() => setModalOpen(true)}
            className="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-1"
          >
            <Music className="w-4 h-4" />
            Listen
          </button>
        </div>
      </div>

      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <Dialog.Title className="text-lg font-semibold">
                {item.covered_by.name}'s Cover
              </Dialog.Title>
              <button onClick={() => setModalOpen(false)}>
                <X className="w-5 h-5 text-gray-500 hover:text-gray-700" />
              </button>
            </div>
            <p className="mb-2 text-sm text-gray-600">
              {item.covered_track.title} by {item.covered_artist.name}
            </p>
            <audio controls className="w-full mt-2">
              <source src={item.audioUrl} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          </Dialog.Panel>
        </div>
      </Dialog>
    </>
  );
};

export default CoverDetail;
