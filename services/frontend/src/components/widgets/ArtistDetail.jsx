import React, { useRef, useState } from "react";

const ArtistDetail = ({ item, onConvert, onMatch }) => {
  const [modalSong, setModalSong] = useState(null);
  const dialogRef = useRef(null);

  const openDialog = (song) => {
    setModalSong(song);
    dialogRef.current?.showModal();
  };

  const closeDialog = () => {
    dialogRef.current?.close();
    setModalSong(null);
  };

  return (
    <>
      <div className="mt-4 p-4 bg-white rounded-xl shadow-md">
        <div className="flex items-start justify-between mb-4">
          {/* 프로필 및 이름 */}
          <div className="flex items-center gap-4">
            <img
              src={item.image}
              alt={item.name}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div>
              <p className="text-lg font-bold">{item.name}</p>
              <p className="text-sm text-gray-500 capitalize">{item.gender}</p>
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex flex-col items-end gap-2">
            <div className="flex gap-2">
              <button
                onClick={onMatch}
                className="px-3 py-1 text-xs bg-emerald-600 text-white rounded-full hover:bg-emerald-700"
              >
                Match
              </button>
              <button
                onClick={onConvert}
                className="px-3 py-1 text-xs bg-indigo-600 text-white rounded-full hover:bg-indigo-700"
              >
                Convert
              </button>
            </div>
          </div>
        </div>

        {/* 통계 */}
        <div className="text-sm text-gray-700 space-y-1 mb-3">
          <p>
            <strong>Matches:</strong> {item.matchCount}
          </p>
          <p>
            <strong>Conversions:</strong> {item.convertCount}
          </p>
        </div>

        {/* 트랙 목록 */}
        <div>
          <p className="font-semibold text-sm mb-1 text-gray-800">Songs</p>
          <ul className="space-y-1 text-sm text-gray-700">
            {item.tracks?.map((track, idx) => (
              <li
                key={idx}
                className="flex justify-between items-center px-2 py-1 bg-gray-50 rounded hover:bg-gray-100 transition"
              >
                <span>{track.title}</span>
                <button
                  onClick={() => openDialog(track)}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Details"
                >
                  ⋯
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* dialog 모달 */}
      <dialog
        ref={dialogRef}
        className="rounded-lg shadow-xl backdrop:bg-black/40 p-5 w-80 max-w-full"
      >
        {modalSong && (
          <div>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-md font-semibold">
                "{modalSong.title}" Info
              </h2>
              <button
                onClick={closeDialog}
                className="text-gray-400 hover:text-gray-600 text-lg"
              >
                ✕
              </button>
            </div>
            <div className="text-sm text-gray-700 space-y-2">
              <p>
                <strong>Album:</strong> {modalSong.albumName || "N/A"}
              </p>
              <p>
                <strong>Released:</strong> {modalSong.releaseDate || "N/A"}
              </p>
              <p>
                <strong>YouTube:</strong> {modalSong.youtubeUrl || "N/A"}
              </p>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
};

export default ArtistDetail;
