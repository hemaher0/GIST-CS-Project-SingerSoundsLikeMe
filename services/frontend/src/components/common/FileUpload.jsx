import React, { useRef } from "react";

const FileUpload = ({ onUpload, children }) => {
  const inputRef = useRef(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (file && onUpload) onUpload(file);
    e.target.value = null;
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={handleChange}
      />

      {children({ openFileDialog: handleClick })}
    </>
  );
};

export default FileUpload;
