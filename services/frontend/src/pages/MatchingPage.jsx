import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../utils/apiClient.jsx";
import { useSelector, useDispatch } from "react-redux";
import { Listbox } from "@headlessui/react";
import { ChevronsUpDown } from "lucide-react";
import UploadModal from "../components/widgets/UploadModal.jsx";
import HistoryItem from "../components/widgets/HistoryItem.jsx";
import {
  addHistoryItem,
  deleteHistoryItem,
  fetchHistory,
} from "../store/historySlice";

const genderOptions = [
  { value: "all", label: "All" },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

export default function MatchingPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const history = useSelector((s) => s.history.uploaded);

  const [gender, setGender] = useState(genderOptions[0]);
  const [showModal, setShowModal] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);

  const toggleSelect = (item) => {
    setSelectedItems((prev) =>
      prev.some((i) => i.id === item.id)
        ? prev.filter((i) => i.id !== item.id)
        : [...prev, item]
    );
  };

  const handleMatch = async () => {
    if (selectedItems.length === 0) {
      return alert("Please select at least one item to match!");
    }
    setLoading(true);
    try {
      const payload = {
        input_paths: selectedItems.map((i) => i.audioUrl),
        category: "artist",
        gender: gender.value,
        k: 5,
      };
      const res = await apiClient.post("/match/", payload);
      if (res.data.status === "ok") {
        setPendingRequests(res.data.data.request_ids);
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error("Matching error:", err);
      setLoading(false);
    }
  };
  useEffect(() => {
    if (pendingRequests.length === 0) return;

    const interval = setInterval(async () => {
      try {
        const doneResults = [];
        const stillPending = [];

        for (const rid of pendingRequests) {
          const res = await apiClient.get(`/match/status/${rid}/`);
          if (res.data?.data?.status === "ok") {
            const resultRes = await apiClient.get(`/match/result/${rid}/`);
            if (resultRes.data?.status === "ok") {
              doneResults.push({
                request_id: rid,
                results: resultRes.data.data,
              });
            } else {
              stillPending.push(rid);
            }
          } else {
            stillPending.push(rid);
          }
        }

        if (stillPending.length === 0) {
          clearInterval(interval);
          setPendingRequests([]);
          setLoading(false);

          const allResults = doneResults.flatMap((r) => r.results);
          navigate("/result", {
            state: { matches: allResults },
          });
        } else {
          setPendingRequests(stillPending);
        }
      } catch (e) {}
    }, 3000);

    return () => clearInterval(interval);
  }, [pendingRequests]);
  useEffect(() => {
    dispatch(fetchHistory("uploaded"));
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-[#fef8f3] text-black font-sans px-4 py-6 overflow-y-auto">
      <h1 className="text-2xl font-bold mb-4 text-center">🎙️ Singing Match</h1>

      <div className="flex justify-center mb-6">
        <button
          onClick={() => setShowModal(true)}
          className="px-8 py-3 bg-green-600 text-white font-semibold rounded-full hover:bg-green-700 transition"
        >
          Upload
        </button>
      </div>

      <ul className="divide-y divide-gray-200 mb-6">
        {history.map((item, i) => (
          <HistoryItem
            key={i}
            item={item}
            index={i}
            disablePlay={true}
            onConvert={() =>
              dispatch(
                addHistoryItem({
                  category: "converted",
                  item: { ...item, timestamp: new Date().toISOString() },
                })
              )
            }
            onDelete={() =>
              dispatch(
                deleteHistoryItem({ category: "uploaded", index: item.id })
              )
            }
            onSelect={() => toggleSelect(item)}
            isSelected={selectedItems.some((i) => i.id === item.id)}
          />
        ))}
        {history.length === 0 && (
          <li className="px-4 py-6 text-center text-gray-500">
            You haven’t uploaded anything yet.
          </li>
        )}
      </ul>

      {/* Gender Filter */}
      <div className="flex justify-center mb-4">
        <Listbox value={gender} onChange={setGender}>
          <div className="relative w-48">
            <Listbox.Button className="w-full py-2 pl-4 pr-10 text-left bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none text-sm">
              {gender.label}
              <ChevronsUpDown className="absolute right-2 top-2.5 w-5 h-5 text-gray-400 pointer-events-none" />
            </Listbox.Button>
            <Listbox.Options className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto text-sm">
              {genderOptions.map((option) => (
                <Listbox.Option
                  key={option.value}
                  value={option}
                  className={({ active }) =>
                    `cursor-pointer px-4 py-2 ${
                      active ? "bg-purple-100 text-purple-800" : "text-gray-700"
                    }`
                  }
                >
                  {option.label}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </div>
        </Listbox>
      </div>

      <div className="flex justify-center gap-4">
        <button
          onClick={handleMatch}
          disabled={loading}
          className={`px-8 py-3 font-semibold rounded-full transition ${
            loading
              ? "bg-gray-400 text-gray-200 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {loading ? "Matching…" : "Match"}
        </button>
      </div>

      <UploadModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
}
