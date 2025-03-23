import React from "react";
import Topbar from "@/components/Topbar";
import { Outlet } from "react-router-dom";
import { TypewriterEffectSmooth } from "@/components/ui/typewriter-effect";
import { FlipWords } from "@/components/ui/flip-words";

const words = ["Stronger", "Better", "Higher"];

const Dashboard = () => {
  return (
    <div className="flex flex-col min-h-screen bg-black">
      {/* Fixed Topbar */}
      <div className="sticky top-0 left-0 w-full z-50 shadow-md ">
        <Topbar />
      </div>

      {/* Scrollable Content */}
      <div className=" ml-[40%] mt-[20%]">
        <span className="text-5xl text-yellow-500">Build<FlipWords words={words}/> </span>
      </div>
    </div>
  );
};

export default Dashboard;
