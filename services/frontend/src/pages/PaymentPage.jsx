import React, { useState } from "react";
import XIcon from "../components/icons/XIcon";

const RadioOption = ({ label, price, name, value, checked, onChange }) => (
  <label className="flex items-center gap-4 rounded-xl border border-solid border-border-medium p-[15px] flex-row-reverse">
    {" "}
    {/* [cite: 50] */}
    <input
      type="radio"
      className="h-5 w-5 border-2 border-border-medium bg-transparent text-transparent checked:border-text-primary checked:bg-[image:var(--radio-dot-svg)] focus:outline-none focus:ring-0 focus:ring-offset-0 checked:focus:border-text-primary"
      name={name}
      value={value}
      checked={checked}
      onChange={onChange}
    />{" "}
    {/* [cite: 50] */}
    <div className="flex grow flex-col">
      {" "}
      {/* [cite: 51] */}
      <p className="text-text-primary text-sm font-medium leading-normal">
        {label}
      </p>
      <p className="text-text-secondary text-sm font-normal leading-normal">
        {price}
      </p>{" "}
      {/* [cite: 51] */}
    </div>
  </label>
);

const PaymentPage = () => {
  const [duration, setDuration] = useState("1day");
  const [singerSelection, setSingerSelection] = useState("1extra");

  return (
    <div className="relative flex size-full min-h-screen flex-col dark justify-between group/design-root overflow-x-hidden">
      {" "}
      {/* [cite: 48] */}
      <div>
        {/* Header */}
        <div className="flex items-center p-4 pb-2 justify-between">
          {" "}
          {/* [cite: 48] */}
          <button
            className="text-text-primary flex size-12 shrink-0 items-center"
            aria-label="Close"
          >
            <XIcon /> {/* [cite: 49] */}
          </button>
          <h2 className="text-text-primary text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-12">
            Payment
          </h2>{" "}
          {/* [cite: 49] */}
        </div>
        <h2 className="text-text-primary text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">
          Conversion Duration
        </h2>{" "}
        {/* [cite: 49] */}
        <div className="flex flex-col gap-3 p-4">
          <RadioOption
            label="1 Day"
            price="$2"
            name="conversion-duration"
            value="1day"
            checked={duration === "1day"}
            onChange={(e) => setDuration(e.target.value)}
          />{" "}
          {/* [cite: 51] */}
          <RadioOption
            label="Realtime"
            price="$10"
            name="conversion-duration"
            value="realtime"
            checked={duration === "realtime"}
            onChange={(e) => setDuration(e.target.value)}
          />{" "}
          {/* [cite: 53] */}
        </div>
        <h2 className="text-text-primary text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">
          Singer Selection
        </h2>{" "}
        {/* [cite: 53] */}
        <div className="flex flex-col gap-3 p-4">
          <RadioOption
            label="1 Extra"
            price="$2"
            name="singer-selection"
            value="1extra"
            checked={singerSelection === "1extra"}
            onChange={(e) => setSingerSelection(e.target.value)}
          />{" "}
          {/* [cite: 55] */}
          <RadioOption
            label="Unlimited"
            price="$10"
            name="singer-selection"
            value="unlimited"
            checked={singerSelection === "unlimited"}
            onChange={(e) => setSingerSelection(e.target.value)}
          />{" "}
          {/* [cite: 57] */}
        </div>
      </div>
      {/* Footer Button */}
      <div>
        <div className="flex px-4 py-3">
          <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-12 px-5 flex-1 text-text-primary text-base font-bold leading-normal tracking-[-0.015em]">
            <span className="truncate">Continue</span> {/* [cite: 58] */}
          </button>
        </div>
        <div className="h-5"></div> {/* bg-dark-bg는 전역에서 처리 */}{" "}
        {/* [cite: 58] */}
      </div>
    </div>
  );
};

export default PaymentPage;
