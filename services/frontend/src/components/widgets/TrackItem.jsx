import React from "react";
import ListItem from "../common/ListItem";

const TrackItem = ({ item, onSelect, isSelected }) => {
  const { image, title, artistName } = item;
  return (
    <ListItem
      image={image || ""}
      alt={title}
      onClick={() => onSelect(item)}
      isSelected={isSelected}
    >
      <p className="font-semibold text-sm truncate">{title}</p>
      <p className="text-xs text-gray-500">{artistName}</p>
    </ListItem>
  );
};

export default TrackItem;
