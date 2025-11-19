import React from "react";
import { useSelector } from "react-redux";
import { Menu } from "@headlessui/react";
import { Trash2, RefreshCw, MoreVertical } from "lucide-react";
import useAudioPlayer from "../../hooks/useAudioPlayer";

export default function HistoryItem({
  item,
  index,
  onConvert,
  onDelete,
  onSelect,
  isSelected,
  disablePlay = false,
}) {
  const { play } = useAudioPlayer();

  const historyStatus = useSelector((state) => state.history.status);
  if (!item) return null;

  if (historyStatus === "loading") {
    return <div />;
  }

  const user = item.covered_by ?? {
    name: "Unknown",
    image: "https://via.placeholder.com/40",
  };

  const title = item.covered_track?.title ?? "Untitled";
  const uploadDate = item.upload_date
    ? new Date(item.upload_date).toLocaleString()
    : "Unknown Date";

  return (
    <Menu
      as="li"
      className={`relative flex items-center p-3 hover:bg-gray-100 transition ${
        isSelected ? "bg-purple-50 border border-purple-300" : ""
      }`}
    >
      <img
        src={user.image}
        alt={user.name}
        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
      />
      <div
        className="ml-4 flex-1 cursor-pointer"
        onClick={() => {
          if (!disablePlay) play(item, index);
        }}
      >
        <p className="font-semibold text-sm truncate max-w-[12rem]">{title}</p>
        <p className="text-xs text-gray-500">
          {user.name} • {uploadDate}
        </p>
        {item.size && (
          <p className="text-xs text-gray-500">
            {(item.size / 1024).toFixed(1)} KB
          </p>
        )}
      </div>

      {onSelect && (
        <button
          onClick={onSelect}
          className={`ml-2 px-3 py-1 text-xs rounded-full border font-medium transition ${
            isSelected
              ? "bg-red-100 text-red-700 border-red-200 hover:bg-red-200"
              : "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200"
          }`}
        >
          {isSelected ? "Clear" : "Select"}
        </button>
      )}

      <Menu.Button className="ml-2 p-2 text-gray-500 hover:text-gray-700">
        <MoreVertical className="w-5 h-5" />
      </Menu.Button>

      <Menu.Items className="absolute right-3 top-14 mt-1 w-32 bg-white border rounded shadow-lg z-50">
        {onConvert && (
          <Menu.Item>
            {({ active }) => (
              <button
                onClick={onConvert}
                className={`${
                  active ? "bg-gray-100" : ""
                } w-full px-3 py-2 text-sm flex items-center gap-2`}
              >
                <RefreshCw className="w-4 h-4 text-blue-500" />
                Convert
              </button>
            )}
          </Menu.Item>
        )}
        <Menu.Item>
          {({ active }) => (
            <button
              onClick={onDelete}
              className={`${
                active ? "bg-gray-100" : ""
              } w-full px-3 py-2 text-sm text-red-600 flex items-center gap-2`}
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          )}
        </Menu.Item>
      </Menu.Items>
    </Menu>
  );
}
