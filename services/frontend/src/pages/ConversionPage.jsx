import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../utils/apiClient.jsx";
import { useSelector, useDispatch } from "react-redux";
import UploadModal from "../components/widgets/UploadModal.jsx";
import HistoryItem from "../components/widgets/HistoryItem.jsx";
import {
  addHistoryItem,
  deleteHistoryItem,
  fetchHistory,
} from "../store/historySlice";
import { AsyncPaginate } from "react-select-async-paginate";
import MenuList from "../components/ui/MenuList";
import { loadSingerOptions } from "../hooks/searchArtist";
import useAudioPlayer from "../hooks/useAudioPlayer.jsx";

export default function ConversionPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const uploaded = useSelector((s) => s.history.uploaded);
  const converted = useSelector((s) => s.history.converted);
  const { play } = useAudioPlayer();

  const [showModal, setShowModal] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [singer, setSinger] = useState("");
  const [requestId, setRequestId] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const wsRef = useRef(null);

  useEffect(() => {
    dispatch(fetchHistory("uploaded"));
    dispatch(fetchHistory("converted"));
  }, [dispatch]);

  const handleSelect = (item) => {
    setSelectedId((prev) => (prev === item.id ? null : item.id));
  };
  useEffect(() => {
    if (!requestId) return;

    const interval = setInterval(async () => {
      try {
        const res = await apiClient.get(`/convert/status/${requestId}/`);
        const status = res.data.data.status;
        if (status === "ok") {
          const res2 = await apiClient.get(`/convert/result/${requestId}/`);
          const url = res2.data.data.audioUrl;

          const item = {
            id: requestId,
            audioUrl: url,
            timestamp: new Date().toISOString(),
          };
          dispatch(addHistoryItem({ category: "converted", item }));
          setAudioUrl(url);
          cleanup(false); // 웹소켓 유지용
        }
      } catch {}
    }, 3000);

    return () => clearInterval(interval);
  }, [requestId]);

  const handleConvert = async () => {
    if (!selectedId || !singer) return;
    setIsLoading(true);
    try {
      const chosen = uploaded.find((x) => x.id === selectedId);
      const fileUrl = `${window.location.origin}${chosen.audioUrl}`;
      const resp = await fetch(fileUrl);
      const audioBlob = await resp.blob();
      const form = new FormData();
      form.append("file", audioBlob, chosen.original_name || "audio.wav");
      form.append("target_artist", singer);

      const res = await apiClient.post("/convert/", form);
      const rid = res.data.data.request_id;
      setRequestId(rid);
      setAudioUrl(null);

      const proto = window.location.protocol === "https:" ? "wss" : "ws";
      const ws = new WebSocket(
        `${proto}://${window.location.host}/ws/convert/${rid}`
      );
      wsRef.current = ws;

      ws.onmessage = (evt) => {
        const msg = JSON.parse(evt.data);
        if (msg.audioUrl) {
          const item = {
            id: new Date().toISOString(),
            audioUrl: msg.audioUrl,
            timestamp: new Date().toISOString(),
          };
          dispatch(addHistoryItem({ category: "converted", item }));
          setAudioUrl(msg.audioUrl);
          cleanup();
        }
      };
    } catch {
      cleanup();
    }
  };

  const cleanup = () => {
    wsRef.current?.close();
    setIsLoading(false);
    setSinger("");
    setSelectedId(null);
    setRequestId(null);
  };

  return (
    <div className="min-h-screen bg-[#fef8f3] text-black flex flex-col">
      <div className="flex justify-center p-4 border-b">
        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-2 bg-green-600 text-white rounded-full hover:bg-green-700"
        >
          Upload Audio
        </button>
      </div>

      <div className="flex-1 overflow-auto px-4 py-2">
        {uploaded.map((item, idx) => (
          <HistoryItem
            key={item.id}
            index={idx}
            item={item}
            disablePlay={true}
            isSelected={selectedId === item.id}
            onSelect={() => handleSelect(item)}
            onDelete={() =>
              dispatch(
                deleteHistoryItem({ category: "uploaded", index: item.id })
              )
            }
          />
        ))}
      </div>

      <div className="sticky bottom-0 bg-[#fef8f3] border-t p-4">
        <div className="max-w-md mx-auto space-y-3">
          <AsyncPaginate
            components={{ MenuList }}
            value={singer ? { value: singer, label: singer } : null}
            loadOptions={loadSingerOptions}
            additional={{ page: 0 }}
            onChange={(opt) => setSinger(opt?.value || "")}
            placeholder="Select singer…"
            isClearable
            menuPlacement="top"
          />
          {audioUrl ? (
            <button
              onClick={() => play({ audioUrl })}
              className="w-full py-2 rounded-full bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
            >
              ▶ Play
            </button>
          ) : (
            <button
              onClick={handleConvert}
              disabled={!selectedId || !singer || isLoading}
              className={`w-full py-2 rounded-full font-semibold transition ${
                !selectedId || !singer || isLoading
                  ? "bg-gray-400 text-gray-200"
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
              }`}
            >
              {isLoading ? "Converting…" : "Convert"}
            </button>
          )}
        </div>
      </div>

      <UploadModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
}
