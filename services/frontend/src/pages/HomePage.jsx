import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mic, User, Repeat, Folder, Music2, Zap, Star } from "lucide-react";

const FeatureCard = ({ navigate, title, icon, to }) => (
  <div
    onClick={() => navigate(to)}
    className="bg-white p-4 rounded-xl shadow-md flex flex-col items-center justify-center gap-2 cursor-pointer hover:shadow-lg transition"
  >
    {icon}
    <span className="text-sm font-medium">{title}</span>
  </div>
);

const RecentActivity = ({ audios, onSelect }) => (
  <div className="mb-6">
    <h2 className="text-lg font-semibold mb-2">Recent Activity</h2>
    {audios.length === 0 ? (
      <p className="text-sm text-gray-500">No recent recordings</p>
    ) : (
      <ul className="space-y-2">
        {audios.map((audio, idx) => (
          <li
            key={idx}
            onClick={() => onSelect(audio)}
            className="p-2 bg-white rounded-md shadow hover:bg-gray-100 cursor-pointer"
          >
            🎵 {audio.name}
          </li>
        ))}
      </ul>
    )}
  </div>
);

const MiniRecorderPlayer = ({ audio }) => (
  <div className="mt-4 bg-white p-4 rounded-xl shadow">
    <h3 className="text-sm font-semibold mb-2">Selected Audio</h3>
    {audio ? (
      <>
        <p className="text-sm font-medium mb-1">{audio.name}</p>
        <audio controls src={audio.url} className="w-full" />
      </>
    ) : (
      <p className="text-sm text-gray-500">No audio selected</p>
    )}
  </div>
);

// TODO: 이 부분은 실제 데이터로 대체 필요
// 더미 데이터로 섹션을 구성
const DummySection = ({ title, items }) => (
  <div className="my-6">
    <h2 className="text-lg font-semibold mb-2">{title}</h2>
    <div className="grid grid-cols-2 gap-4">
      {items.map((item, idx) => (
        <div
          key={idx}
          className="bg-white p-3 rounded-md shadow flex flex-col items-center"
        >
          <img
            src={item.image}
            alt={item.name}
            className="w-16 h-16 rounded-full mb-2"
          />
          <p className="text-sm font-medium text-center">{item.name}</p>
        </div>
      ))}
    </div>
  </div>
);

const HomePage = () => {
  const navigate = useNavigate();
  const [selectedAudio, setSelectedAudio] = useState(null);

  // TODO: 최근 녹음 목록을 localStorage 등에서 불러오기
  const dummyAudios = [
    { name: "recording_01.wav", url: "sample1.mp3" },
    { name: "recording_02.wav", url: "sample2.mp3" },
  ];

  // TODO: 아래 데이터는 모두 더미로 작동 중임
  const dummyPlaylist = [
    { name: "IU Playlist", image: "https://picsum.photos/100?1" },
    { name: "Zico Style", image: "https://picsum.photos/100?2" },
  ];

  const dummyFavorites = [
    { name: "IU", image: "https://picsum.photos/100?3" },
    { name: "Zico", image: "https://picsum.photos/100?4" },
  ];

  const dummyLive = [
    {
      name: "Live: You sound like Taeyeon",
      image: "https://picsum.photos/100?5",
    },
    { name: "Live: G-Dragon vibe", image: "https://picsum.photos/100?6" },
  ];

  return (
    <div className="min-h-screen bg-[#fef8f3] text-black font-sans overflow-auto">
      {/* TODO: 사용자 정보 연동 (현재는 하드코딩된 "User") */}
      <h1 className="text-2xl font-bold mb-6">🎧 Welcome, User!</h1>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <FeatureCard
          navigate={navigate}
          title="Record"
          to="/record"
          icon={<Mic size={24} />}
        />
        <FeatureCard
          navigate={navigate}
          title="Match"
          to="/match"
          icon={<User size={24} />}
        />
        <FeatureCard
          navigate={navigate}
          title="Convert"
          to="/conversion"
          icon={<Repeat size={24} />}
        />
        <FeatureCard
          navigate={navigate}
          title="Library"
          to="/library"
          icon={<Folder size={24} />}
        />
      </div>

      <RecentActivity audios={dummyAudios} onSelect={setSelectedAudio} />
      <MiniRecorderPlayer audio={selectedAudio} />

      <DummySection
        title="🎤 Try Voice-to-Artist Conversion"
        items={dummyLive}
      />
      <DummySection
        title="🔥 Real-Time Conversions Happening"
        items={dummyLive}
      />
      <DummySection title="🎶 Playlists You May Like" items={dummyPlaylist} />
      <DummySection title="⭐ Your Favorite Artists" items={dummyFavorites} />
    </div>
  );
};

export default HomePage;
