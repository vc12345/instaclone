"use client";
import { useEffect, useState, useCallback } from "react";
import Image from "next/image";

export default function ImagePopup({ posts, initialIndex, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const currentPost = posts[currentIndex];

  // Memoize handlers to avoid recreating them on each render
  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % posts.length);
  }, [posts.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + posts.length) % posts.length);
  }, [posts.length]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, handlePrev, handleNext]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative w-full max-w-4xl bg-white rounded-lg shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Navigation buttons */}
        <button 
          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 z-10 shadow-lg hover:bg-gray-100"
          onClick={handlePrev}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-gray-800">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        
        <button 
          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 z-10 shadow-lg hover:bg-gray-100"
          onClick={handleNext}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-gray-800">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
        
        {/* Close button */}
        <button 
          className="absolute top-4 left-4 bg-white rounded-full p-2 z-10 shadow-lg hover:bg-gray-100"
          onClick={onClose}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-gray-800">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        {/* Image container */}
        <div className="h-[70vh] w-full bg-gray-100">
          <div className="relative h-full w-full">
            <Image 
              src={currentPost.imageUrl} 
              alt={currentPost.caption || "Post image"} 
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 1200px"
            />
          </div>
        </div>
        
        {/* Caption area */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center mb-2">
            <div className="w-8 h-8 rounded-full bg-gray-200 mr-2 flex-shrink-0 flex items-center justify-center">
              <span className="font-bold text-blue-500">{currentPost.username?.charAt(0).toUpperCase()}</span>
            </div>
            <p className="font-medium">{currentPost.username}</p>
          </div>
          {currentPost.caption && (
            <p className="text-gray-700">{currentPost.caption}</p>
          )}
        </div>
      </div>
    </div>
  );
}