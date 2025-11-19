import React from "react";
import ListItem from "../common/ListItem";
import useAudioPlayer from "../../hooks/useAudioPlayer";

const CoverItem = ({ item, onSelect, isSelected }) => {
  const { playingId, play } = useAudioPlayer();

  const handleClick = () => {
    onSelect(item);
    play(item);
  };

  return (
    <ListItem
      image={item.covered_by.image}
      alt={item.covered_by.name}
      onClick={handleClick}
      isSelected={isSelected}
    >
      <p className="font-semibold text-sm truncate">
        {item.covered_track.title}
      </p>
      <p className="text-xs text-gray-500">
        {item.covered_by.name} · {item.likes} likes
      </p>
    </ListItem>
  );
};

export default CoverItem;
