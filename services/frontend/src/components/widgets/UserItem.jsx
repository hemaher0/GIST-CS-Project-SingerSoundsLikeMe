import React from "react";
import ListItem from "../common/ListItem";

const UserItem = ({ item, onSelect, isSelected }) => {
  return (
    <ListItem
      image={item.image}
      alt={item.name}
      onClick={() => onSelect(item)}
      isSelected={isSelected}
    >
      <p className="font-semibold text-sm truncate">{item.name}</p>
      <p className="text-xs text-gray-500">{item.followers} followers</p>
    </ListItem>
  );
};

export default UserItem;
