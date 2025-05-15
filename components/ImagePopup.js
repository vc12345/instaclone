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
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="relative w-full max-w-4xl h-[80vh]" onClick={(e) => e.stopPropagation()}>
        <button 
          className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-50 rounded-full p-2 z-10 hover:bg-opacity-70"
          onClick={handlePrev}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        
        <div className="relative h-full w-full">
          <Image 
            src={currentPost.imageUrl} 
            alt={currentPost.caption || "Post image"} 
            fill
            className="object-contain"
          />
        </div>
        
        <button 
          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-50 rounded-full p-2 z-10 hover:bg-opacity-70"
          onClick={handleNext}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
        
        <button 
          className="absolute top-4 right-4 bg-white bg-opacity-50 rounded-full p-2 hover:bg-opacity-70"
          onClick={onClose}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div className="absolute bottom-4 left-0 right-0 bg-black bg-opacity-50 text-white p-4">
          <p className="font-medium">{currentPost.username}</p>
          <p className="text-sm">{currentPost.caption}</p>
        </div>
      </div>
    </div>
  );
}