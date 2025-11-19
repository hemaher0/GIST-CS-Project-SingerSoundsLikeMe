import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Tab from "../components/ui/Tab";
import ArtistItem from "../components/widgets/ArtistItem";
import ArtistDetail from "../components/widgets/ArtistDetail";
import TrackItem from "../components/widgets/TrackItem";
import TrackDetail from "../components/widgets/TrackDetail";
import UserItem from "../components/widgets/UserItem";
import UserDetail from "../components/widgets/UserDetail";
import CoverItem from "../components/widgets/CoverItem";
import CoverDetail from "../components/widgets/CoverDetail";
import YouTubeModal from "../components/widgets/YouTubeModal";
import apiClient from "../../utils/apiClient";

const tabConfig = {
  trending: {
    label: "Trending",
    endpoint: "/list/tracks/",
    mapper: (item) => ({
      id: item.id,
      type: "song",
      title: item.track_name,
      artistName: item.artist_name,
      popularity: item.popularity,
      albumName: item.album_name,
      releaseDate: item.release_date,
      image: item.image_url,
      youtubeUrl: item.youtube_url,
    }),
  },
  mostMatched: {
    label: "Most Matched",
    endpoint: "/list/covers/?order_by=likes",
    mapper: (item) => ({
      id: item.id,
      type: "cover",
      audioUrl: item.audio_path,
      likes: item.likes,
      coveredBy: item.covered_by.name,
      image: item.covered_by.image,
      coveredArtist: item.covered_artist,
      coveredTrack: item.covered_track,
    }),
  },
  mostConverted: {
    label: "Most Converted",
    endpoint: "/list/artists/",
    mapper: (item) => ({
      id: item.id,
      type: "artist",
      name: item.artist_name,
      image: item.image_url,
      popularity: item.popularity,
    }),
  },
};

const TrendingPage = () => {
  const [tab, setTab] = useState("trending");
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [youtubeId, setYoutubeId] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Fetch data whenever tab changes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setSelected(null);
      setYoutubeId(null);
      try {
        const { endpoint, mapper } = tabConfig[tab];
        const res = await apiClient.get(endpoint);
        const data = Array.isArray(res.data.data) ? res.data.data : [];
        setItems(data.map(mapper));
      } catch (err) {
        console.error("Error fetching trending data:", err);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [tab]);

  const handleConvert = () => navigate("/conversion");
  const handleMatch = () => navigate("/match");
  const closeYouTube = () => setYoutubeId(null);

  return (
    <div className="min-h-screen bg-[#fef8f3] text-black font-sans px-4 pt-6 pb-16">
      {/* Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {Object.entries(tabConfig).map(([key, { label }]) => (
          <Tab
            key={key}
            label={label}
            active={tab === key}
            onClick={() => setTab(key)}
          />
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <p className="text-center text-gray-500">Loading...</p>
      ) : (
        <div className="space-y-2 pb-16">
          {items.map((item, idx) => (
            <div key={idx}>
              {item.type === "user" && (
                <>
                  <UserItem
                    item={item}
                    onSelect={() => setSelected(item)}
                    isSelected={selected?.id === item.id}
                  />
                  {selected?.id === item.id && <UserDetail item={item} />}
                </>
              )}
              {item.type === "artist" && (
                <>
                  <ArtistItem
                    item={item}
                    onSelect={() => setSelected(item)}
                    isSelected={selected?.id === item.id}
                  />
                  {selected?.id === item.id && (
                    <ArtistDetail
                      item={item}
                      onConvert={handleConvert}
                      onMatch={handleMatch}
                    />
                  )}
                </>
              )}
              {item.type === "song" && (
                <>
                  <TrackItem
                    item={item}
                    onSelect={() => setSelected(item)}
                    isSelected={selected?.title === item.title}
                    onYouTubeClick={setYoutubeId}
                  />
                  {selected?.title === item.title && (
                    <TrackDetail item={item} onYouTubeClick={setYoutubeId} />
                  )}
                </>
              )}
              {item.type === "cover" && (
                <>
                  <CoverItem
                    item={item}
                    onSelect={() => setSelected(item)}
                    isSelected={selected?.id === item.id}
                  />
                  {selected?.id === item.id && <CoverDetail item={item} />}
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* YouTube Modal */}
      <YouTubeModal youtubeId={youtubeId} onClose={closeYouTube} />
    </div>
  );
};

export default TrendingPage;
