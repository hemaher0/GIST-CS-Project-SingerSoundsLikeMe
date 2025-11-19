import React, { useState, useRef } from "react";
import MicrophoneIcon from "../components/icons/MicrophoneIcon";

const RecordingPage = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioList, setAudioList] = useState([]);
  const [selectedAudio, setSelectedAudio] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current);
        const url = URL.createObjectURL(audioBlob);
        const name = `Recorded ${new Date().toLocaleTimeString()}`;
        const newAudio = { name, url };
        setAudioList((prev) => [...prev, newAudio]);
        setSelectedAudio(newAudio); // 선택도 업데이트
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      alert("Unable to access microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
    }
  };

  const handleRecordClick = () => {
    isRecording ? stopRecording() : startRecording();
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const validTypes = ["audio/wav", "audio/mpeg", "audio/mp4", "audio/x-m4a"];
    if (!validTypes.includes(file.type)) {
      alert("Only .wav, .mp3, .m4a files allowed.");
      return;
    }

    const url = URL.createObjectURL(file);
    const newAudio = { name: file.name, url };
    setAudioList((prev) => [...prev, newAudio]);
    setSelectedAudio(newAudio);
  };

  const handleDelete = () => {
    if (!selectedAudio) return;
    setAudioList((prev) =>
      prev.filter((item) => item.url !== selectedAudio.url)
    );
    setSelectedAudio(null);
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "#333",
        color: "white",
      }}
    >
      {/* 왼쪽: 앨범 박스 */}
      <div
        style={{
          flex: "0 0 320px",
          backgroundColor: "#222",
          padding: 20,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
        }}
      >
        <h2 style={{ fontSize: 20 }}>🎵 Audio Player</h2>

        {/* 공용 재생바 */}
        {selectedAudio ? (
          <>
            <strong style={{ textAlign: "center" }}>
              {selectedAudio.name}
            </strong>
            <audio
              ref={audioRef}
              controls
              src={selectedAudio.url}
              style={{ width: "100%" }}
            />
          </>
        ) : (
          <div style={{ opacity: 0.6 }}>No audio selected</div>
        )}

        {/* 녹음 / 업로드 버튼 */}
        <button
          onClick={handleRecordClick}
          style={{
            marginTop: 40,
            backgroundColor: isRecording ? "red" : "#6b46c1",
            color: "white",
            borderRadius: "9999px",
            height: "48px",
            width: "160px",
            fontWeight: "bold",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 10,
          }}
        >
          <MicrophoneIcon />
          {isRecording ? "Stop" : "Record"}
        </button>

        <label
          style={{
            backgroundColor: "#e2e8f0",
            color: "#111",
            borderRadius: "9999px",
            height: "48px",
            width: "160px",
            fontWeight: "bold",
            fontSize: 16,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            cursor: "pointer",
          }}
        >
          Upload Audio
          <input
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            style={{ display: "none" }}
          />
        </label>
      </div>

      {/* 오른쪽: 오디오 리스트 */}
      <div style={{ flex: 1, padding: 24, overflowY: "auto" }}>
        <h2 style={{ fontSize: 20, marginBottom: 12 }}>📃 Audio List</h2>
        {audioList.length === 0 && (
          <div style={{ opacity: 0.5 }}>No audio files yet.</div>
        )}
        {audioList.map((audio, idx) => {
          const isSelected = selectedAudio?.url === audio.url;
          return (
            <div
              key={idx}
              style={{
                marginBottom: 20,
                padding: 12,
                borderRadius: 10,
                backgroundColor: isSelected ? "#4b5563" : "#2d2d2d",
              }}
            >
              {/* 👉 선택된 항목에만 버튼 표시 */}
              {isSelected && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 10,
                    marginBottom: 6,
                  }}
                >
                  <a
                    href={audio.url}
                    download={audio.name}
                    style={{
                      backgroundColor: "#4ade80",
                      color: "black",
                      borderRadius: 6,
                      padding: "4px 10px",
                      fontSize: 14,
                      textDecoration: "none",
                      fontWeight: "bold",
                    }}
                  >
                    ⬇ Download
                  </a>
                  <button
                    onClick={() => {
                      setAudioList((prev) => prev.filter((_, i) => i !== idx));
                      if (selectedAudio?.url === audio.url)
                        setSelectedAudio(null);
                    }}
                    style={{
                      backgroundColor: "#ef4444",
                      color: "white",
                      borderRadius: 6,
                      padding: "4px 10px",
                      fontSize: 14,
                      fontWeight: "bold",
                      cursor: "pointer",
                    }}
                  >
                    ❌ Delete
                  </button>
                </div>
              )}

              {/* 항목 이름 */}
              <div
                onClick={() => setSelectedAudio(audio)}
                style={{
                  cursor: "pointer",
                  fontWeight: "bold",
                  opacity: isSelected ? 1 : 0.8,
                }}
              >
                {audio.name}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecordingPage;
