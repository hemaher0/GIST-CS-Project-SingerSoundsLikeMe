import React from "react";
import cx from "classnames";

export default function ListItem({
  image,
  alt,
  isSelected = false,
  onClick,
  children,
  actions = [], // [{ icon: IconComponent, onClick: fn, ariaLabel }]
}) {
  return (
    <div
      onClick={onClick}
      className={cx(
        "w-full flex items-center gap-4 p-3 rounded-md transition shadow-sm cursor-pointer",
        {
          "bg-purple-100": isSelected,
          "bg-white hover:bg-gray-100": !isSelected,
        }
      )}
    >
      {image && (
        <img
          src={image}
          alt={alt}
          className="w-12 h-12 rounded-full flex-shrink-0"
        />
      )}

      <div className="flex-1 min-w-0">{children}</div>

      <div className="flex gap-2 flex-shrink-0">
        {actions.map(({ icon: Icon, onClick: a11yClick, ariaLabel }, i) => (
          <button
            key={i}
            onClick={(e) => {
              e.stopPropagation();
              a11yClick();
            }}
            className="transition"
            aria-label={ariaLabel}
          >
            <Icon className="w-5 h-5" />
          </button>
        ))}
      </div>
    </div>
  );
}
