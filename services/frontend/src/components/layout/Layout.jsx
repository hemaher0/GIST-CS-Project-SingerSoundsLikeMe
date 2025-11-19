// Layout.jsx
import React from "react";
import { useSelector } from "react-redux";
import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";
import Header from "./Header";
import Player from "../common/Player";

export default function Layout() {
  return (
    <div className="h-screen w-full flex flex-col items-center overflow-hidden relative">
      <Header />
      <main className="w-full max-w-4xl pt-20 pb-20">
        <div className="px-2 h-[calc(100vh-150px)] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <Outlet />
        </div>
      </main>
      <BottomNav />
      <Player />
    </div>
  );
}
