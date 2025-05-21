"use client";
import { useState, useEffect } from "react";

export default function Clock() {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    // Clean up on unmount
    return () => clearInterval(timer);
  }, []);
  
  return (
    <div className="bg-gradient-to-r from-orange-600 via-pink-600 to-blue-700 bg-clip-text text-transparent font-medium">
      {currentTime.toUTCString()}
    </div>
  );
}