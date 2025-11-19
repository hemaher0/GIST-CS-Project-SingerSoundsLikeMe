import React from "react";

const MicrophoneIcon = (props) => (
  <svg
    width="1em"
    height="1em"
    viewBox="0 0 16 16"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d="M8 1a2 2 0 0 1 2 2v5a2 2 0 0 1-4 0V3a2 2 0 0 1 2-2z" />
    <path d="M5 8a3 3 0 0 0 6 0V3a3 3 0 0 0-6 0v5z" />
    <path d="M10 8a2 2 0 0 0-4 0v1a4 4 0 0 0 8 0V8a2 2 0 0 0-4 0z" />
    <path d="M4 10a4 4 0 0 0 8 0v-1h1v1a5 5 0 0 1-10 0v-1h1v1z" />
  </svg>
);

export default MicrophoneIcon;
