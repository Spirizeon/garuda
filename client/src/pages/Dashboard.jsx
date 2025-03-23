import React, { useState } from "react";
import Topbar from "@/components/Topbar";
import { Outlet } from "react-router-dom";
import { TypewriterEffectSmooth } from "@/components/ui/typewriter-effect";
import { FlipWords } from "@/components/ui/flip-words";
import { Button } from "@/components/ui/button";

const words = ["Stronger", "Better", "Higher"];

const Dashboard = () => {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState("");

  const handleSubmit = () => {
    // Handle the feedback submission here
    console.log("Feedback submitted:", feedback);
    setFeedback("");
    setShowFeedback(false);
  };

  return (
    <>
      <div className="flex flex-col min-h-screen bg-black">
        {/* Fixed Topbar */}
        <div className="sticky top-0 left-0 w-full z-50 shadow-md ">
          <Topbar />
        </div>
        
        {/* Scrollable Content */}
        <div className="ml-[40%] mt-[20%]">
          <span className="text-5xl text-yellow-500">Build<FlipWords words={words}/> </span>
        </div>
        
        {/* Feedback Button */}
        <div className="fixed bottom-8 right-8">
          <Button 
            onClick={() => setShowFeedback(true)}
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-4 rounded-full shadow-lg"
          >
            Give Feedback
          </Button>
        </div>
      </div>

      {/* Feedback Modal (custom implementation) */}
      {showFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Share Your Feedback</h2>
              <button 
                onClick={() => setShowFeedback(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-4">
              <label htmlFor="feedback" className="block text-sm font-medium mb-2">
                Your feedback
              </label>
              <textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Tell us what you think..."
                className="w-full border border-gray-300 rounded-md p-2 min-h-[120px]"
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowFeedback(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-yellow-500 text-black rounded-md hover:bg-yellow-600"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Dashboard;
