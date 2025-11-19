import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import micImage from "../assets/microphone.png";
import { useSelector } from "react-redux";

const LandingPage = () => {
  const navigate = useNavigate();
  const token = useSelector((state) => state.auth.token);

  useEffect(() => {
    if (token) {
      navigate("/home");
    }
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fef8f3] text-black font-sans px-6">
      <div className="flex flex-col items-center text-center">
        <h1 className="text-4xl font-extrabold leading-tight tracking-tight mb-8">
          Who is the Singer
          <br />
          sounds like you?
        </h1>

        <img
          src={micImage}
          alt="Microphone"
          className="w-60 h-60 object-contain mb-8"
        />

        <button
          className="p-3 bg-brand-purple text-red-100 text-3xl font-bold rounded-full shadow-md transition active:scale-95"
          onClick={navigate.bind(null, "/login")}
        >
          Get Started
        </button>
      </div>
    </div>
  );
};

export default LandingPage;
