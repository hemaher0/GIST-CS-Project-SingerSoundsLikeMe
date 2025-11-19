// src/components/widgets/UserDetail.jsx

import React, { useState } from "react";
import { Dialog } from "@headlessui/react";
import { Music, X } from "lucide-react";
import { coverDummy } from "../../data/dummyData";

export default function UserDetail({ item }) {
  const [modalCover, setModalCover] = useState(null);
  const userCovers = coverDummy.filter((c) => c.covered_by.name === item.name);

  return (
    <>
      <div className="mt-2 p-4 bg-white rounded-lg shadow">
        <div className="flex items-center gap-3 mb-3">
          <img
            src={item.image}
            alt={item.name}
            className="w-12 h-12 rounded-full object-cover"
          />
          <div>
            <p className="font-semibold text-lg">{item.name}</p>
            <p className="text-sm text-gray-500">
              {item.following} following · {item.followers} followers
            </p>
          </div>
        </div>

        <p className="text-sm font-semibold mb-2">Your Covers</p>
        {userCovers.length > 0 ? (
          <ul className="space-y-1 text-sm text-gray-700">
            {userCovers.map((c, i) => (
              <li
                key={i}
                className="flex justify-between items-center px-2 py-1 bg-gray-50 rounded hover:bg-gray-100 transition"
              >
                <span>{c.covered_track.title}</span>
                <button
                  onClick={() => setModalCover(c)}
                  className="text-gray-500 hover:text-gray-700"
                  aria-label="Listen"
                >
                  <Music className="w-5 h-5" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">No covers yet.</p>
        )}
      </div>

      {/* Audio modal */}
      <Dialog
        open={!!modalCover}
        onClose={() => setModalCover(null)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/40" aria-hidden />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <Dialog.Title className="text-lg font-semibold">
                {modalCover?.covered_by.name}’s Cover
              </Dialog.Title>
              <button
                onClick={() => setModalCover(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="mb-2 text-sm text-gray-600">
              {modalCover?.covered_track.title} by{" "}
              {modalCover?.covered_artist.name}
            </p>
            <audio controls src={modalCover?.audioUrl} className="w-full mt-2">
              Your browser does not support audio.
            </audio>
          </Dialog.Panel>
        </div>
      </Dialog>
    </>
  );
}
