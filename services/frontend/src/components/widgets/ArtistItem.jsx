import React from "react";
import ListItem from "../common/ListItem";

export default function ArtistItem({ item, onSelect, isSelected }) {
  return (
    <ListItem
      image={item.image}
      alt={item.name}
      onClick={() => onSelect(item)}
      isSelected={isSelected}
    >
      <p className="font-semibold text-sm truncate">{item.name}</p>
      <p className="text-xs text-gray-500">
        {item.matchCount != null
          ? `${item.matchCount} matches`
          : `${item.convertCount} conversions`}
      </p>
    </ListItem>
  );
}
