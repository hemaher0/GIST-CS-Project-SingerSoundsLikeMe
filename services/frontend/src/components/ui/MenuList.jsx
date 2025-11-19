import React from "react";
import { components } from "react-select";
import { FixedSizeList as List } from "react-window";

const ITEM_HEIGHT = 35;
const MAX_VISIBLE = 8;

const MenuList = (props) => {
  const { options, children, maxHeight, getValue } = props;
  const [current] = getValue();
  const offsetIndex = Math.max(
    0,
    options.findIndex((opt) => opt.value === current?.value)
  );
  const initialOffset = offsetIndex * ITEM_HEIGHT;

  const items = React.Children.toArray(children);

  const Row = ({ index, style }) => <div style={style}>{items[index]}</div>;

  return (
    <components.MenuList {...props}>
      <List
        height={Math.min(maxHeight, ITEM_HEIGHT * MAX_VISIBLE)}
        itemCount={items.length}
        itemSize={ITEM_HEIGHT}
        initialScrollOffset={initialOffset}
        width="100%"
      >
        {Row}
      </List>
    </components.MenuList>
  );
};

export default MenuList;
