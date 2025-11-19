import React from "react";

const Tab = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-full font-semibold text-sm transition border ${
      active
        ? "bg-brand-purple text-white border-brand-purple"
        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
    }`}
  >
    {label}
  </button>
);

export default Tab;
