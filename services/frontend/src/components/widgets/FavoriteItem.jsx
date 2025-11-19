// src/components/widgets/FavoriteItem.jsx
import React from "react";

const FavoriteItem = ({ imageUrl, title, artist, percentage, onClick }) => (
  <div
    onClick={onClick}
    className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-gray-100 rounded-md transition cursor-pointer"
  >
    <div className="flex items-center gap-4 min-w-0">
      <img
        src={imageUrl}
        alt={title}
        className="w-14 h-14 rounded-full object-cover flex-shrink-0"
      />
      <div className="flex flex-col justify-center min-w-0">
        <p className="text-base font-semibold text-shadow-brand-purple-dark truncate">
          {title}
        </p>
        <p className="text-sm text-text-secondary truncate">{artist}</p>
      </div>
    </div>
    <span className="text-base font-medium text-shadow-brand-purple-dark flex-shrink-0">
      {percentage}
    </span>
  </div>
);

export default FavoriteItem;
