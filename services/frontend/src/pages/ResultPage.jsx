import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

const ResultPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  const results = state?.matches || [];
  const isEmpty = results.length === 0;

  if (isEmpty) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600 text-lg">
          No results. Go back and try again.
        </p>
        <button
          onClick={() => navigate("/match")}
          className="mt-4 px-6 py-2 bg-green-600 text-white rounded-full hover:bg-green-700"
        >
          MATCH AGAIN
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8 bg-[#fef8f3] text-black">
      <h1 className="text-3xl font-bold text-center mb-8">
        🎤 Top Matching Artists
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.map((artist, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl shadow-md p-6 flex flex-col items-start gap-3 hover:shadow-lg transition"
          >
            <div className="text-xl font-semibold text-purple-800">
              {artist.name}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-purple-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${(artist.cosine * 100).toFixed(1)}%` }}
              />
            </div>
            <div className="text-sm text-gray-600">
              Match Score: {(artist.cosine * 100).toFixed(1)}%
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center gap-4 mt-12">
        <button
          onClick={() => navigate("/match")}
          className="px-6 py-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition"
        >
          MATCH AGAIN
        </button>
        <button
          onClick={() => navigate("/conversion")}
          className="px-6 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition"
        >
          CONVERT
        </button>
      </div>
    </div>
  );
};

export default ResultPage;
