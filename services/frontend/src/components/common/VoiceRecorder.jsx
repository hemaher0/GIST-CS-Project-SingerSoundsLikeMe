import React, { useState, useRef } from "react";

const VoiceRecorder = ({ onUpload, children }) => {
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const file = new File([blob], `recording_${Date.now()}.webm`, {
          type: "audio/webm",
        });
        onUpload && onUpload(file);
      };

      mr.start();
      setRecording(true);
    } catch (err) {
      console.error("녹음 시작 오류:", err);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  return children({
    recording,
    startRecording,
    stopRecording,
  });
};

export default VoiceRecorder;
