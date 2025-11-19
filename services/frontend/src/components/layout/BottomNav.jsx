import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { Home, Music2, Plus, Flame, User } from "lucide-react";
import UploadModal from "../widgets/UploadModal.jsx";

const navItems = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/match", label: "Match", icon: Music2 },
  { spacer: true },
  { to: "/trending", label: "Trending", icon: Flame },
  { to: "/mypage", label: "My Page", icon: User },
];

const BottomNav = () => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <nav className="fixed bottom-0 w-full h-16 bg-white border-t border-gray-200 flex justify-evenly items-center shadow-md z-40">
        {navItems.map((item, index) => {
          if (item.spacer) {
            return <div key={index} className="w-14 h-14" />;
          }

          const Icon = item.icon;

          return (
            <NavLink
              key={index}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center text-xs transition-colors duration-200 ${
                  isActive
                    ? "text-purple-600"
                    : "text-gray-400 hover:text-purple-400"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-14 h-6 transform origin-center transition-transform ${
                      isActive
                        ? "scale-110 duration-75"
                        : "duration-75 active:scale-110"
                    }`}
                  />
                  <span className="mt-1 text-xs">{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* 중앙 Create 버튼 */}
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-purple-500 text-white flex items-center justify-center shadow-xl transition-transform duration-200 hover:scale-105 active:scale-95 z-50"
      >
        <Plus className="w-8 h-8" />
      </button>

      {/* Upload Modal */}
      {showModal && (
        <UploadModal isOpen={showModal} onClose={() => setShowModal(false)} />
      )}
    </>
  );
};

export default BottomNav;
