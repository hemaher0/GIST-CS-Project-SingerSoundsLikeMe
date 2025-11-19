import React, { useState } from "react";

const TabsWithContent = ({ tabs }) => {
  const [activeTab, setActiveTab] = useState(tabs[0].key);

  return (
    <div className="flex flex-col">
      {/* 탭 버튼 */}
      <div className="flex border-b border-border-medium px-4 gap-8">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`flex flex-col items-center justify-center border-b-[3px] pb-[13px] pt-4 ${
              activeTab === tab.key
                ? "border-b-brand-purple-dark text-brand-purple"
                : "border-b-transparent text-brand-purple-light"
            }`}
            onClick={() => setActiveTab(tab.key)}
          >
            <p className="text-sm font-bold tracking-[0.015em]">{tab.label}</p>
          </button>
        ))}
      </div>

      {/* 탭 콘텐츠 */}
      <div className="flex-grow">
        {tabs.map((tab) =>
          activeTab === tab.key ? (
            <div key={tab.key} className="p-4">
              {tab.component}
            </div>
          ) : null
        )}
      </div>
    </div>
  );
};

export default TabsWithContent;
