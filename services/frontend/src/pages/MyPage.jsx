// src/components/pages/MyPage.jsx
import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import TabsWithContent from "../components/widgets/TabsWithContent.jsx";
import HistoryItem from "../components/widgets/HistoryItem.jsx";
import {
  addHistoryItem,
  deleteHistoryItem,
  fetchHistory,
} from "../store/historySlice.jsx";

export default function MyPage() {
  const history = useSelector((s) => s.history.uploaded);
  const status = useSelector((s) => s.history.status);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchHistory("uploaded"));
  }, [dispatch]);

  const historyComponent = (
    <>
      <h2 className="text-xl font-bold px-4 pt-5 pb-3">Your Uploads</h2>
      <ul className="divide-y divide-gray-200">
        {history.map((item, i) => (
          <HistoryItem
            key={i}
            item={item}
            index={i}
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
          />
        ))}
      </ul>

      {status === "loading" && (
        <div className="px-4 pt-5 text-text-secondary">Loading…</div>
      )}

      {status === "succeeded" && history.length > 0 && (
        <ul className="divide-y divide-gray-200">
          {history.map((item, i) => (
            <HistoryItem key={i} /* … */ />
          ))}
        </ul>
      )}

      {status === "succeeded" && history.length === 0 && (
        <div className="px-4 pt-5 text-text-secondary">
          You haven’t uploaded anything yet.
        </div>
      )}

      {status === "failed" && (
        <div className="px-4 pt-5 text-red-500">
          Failed to load history. Please try again later.
        </div>
      )}
    </>
  );

  const recentComponent = (
    <div className="px-4 pt-5 text-text-secondary">
      You haven’t liked anything yet.
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col pt-16">
      <TabsWithContent
        tabs={[
          { key: "history", label: "History", component: historyComponent },
          { key: "recent", label: "Recent", component: recentComponent },
        ]}
      />
    </div>
  );
}
