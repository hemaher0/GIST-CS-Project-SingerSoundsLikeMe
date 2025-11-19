import React, { useEffect, useState } from "react";
import { Dialog } from "@headlessui/react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../../store/authSlice";

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentUser, status } = useSelector((state) => state.user);
  const [isOpen, setIsOpen] = useState(false);

  const logoutHandler = () => {
    dispatch(logout());
    setIsOpen(false);
    navigate("/login", { replace: true });
  };

  if (status === "loading") {
    return (
      <header className="w-full flex items-center justify-between px-4 py-3 bg-white shadow-sm fixed top-0 z-40">
        <h1 className="text-lg font-semibold text-gray-800">App</h1>
        <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
      </header>
    );
  }

  // 에러 시 fallback
  if (status === "failed" || !currentUser) {
    return (
      <header className="w-full flex items-center justify-between px-4 py-3 bg-white shadow-sm fixed top-0 z-40">
        <h1 className="text-lg font-semibold text-gray-800">App</h1>
        <div className="text-red-500">Error loading user</div>
      </header>
    );
  }

  const { name, image, email, followers, following } = currentUser;
  return (
    <>
      {/* 헤더 */}
      <header className="w-full flex items-center justify-between px-4 py-3 bg-white shadow-sm fixed top-0 z-40">
        <h1 className="text-lg font-semibold text-gray-800">App</h1>
        <img
          src={image}
          alt={name}
          className="w-10 h-10 rounded-full object-cover border border-gray-300 cursor-pointer"
          onClick={() => setIsOpen(true)}
        />
      </header>

      {/* 프로필 모달 */}
      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        className="relative z-50"
      >
        {/* 배경 블러 */}
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-xl">
            <Dialog.Title className="text-xl font-bold text-gray-800 mb-4">
              User Profile
            </Dialog.Title>

            <div className="flex flex-col items-center">
              <img
                src={image}
                alt={name}
                className="w-24 h-24 rounded-full object-cover border-2 border-gray-200 mb-4"
              />
              <p className="text-lg font-semibold">{name}</p>
              <p className="text-sm text-gray-500 mb-4">{email}</p>
              <div className="flex gap-8">
                <div className="text-center">
                  <p className="text-2xl font-bold">{followers}</p>
                  <p className="text-xs text-gray-500">Followers</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{following}</p>
                  <p className="text-xs text-gray-500">Following</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="mt-6 w-full py-2 bg-blue-600 text-white font-medium rounded-full hover:bg-blue-700 transition"
            >
              Close
            </button>
            <button
              onClick={logoutHandler}
              className="w-full py-2 bg-red-500 text-white font-medium rounded-full hover:bg-red-600 transition"
            >
              Log out
            </button>
          </Dialog.Panel>
        </div>
      </Dialog>
    </>
  );
};
export default Header;
