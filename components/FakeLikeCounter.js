"use client";
import { useState, useEffect } from "react";
import { fakeEngagement } from "@/lib/config";

export default function FakeLikeCounter({ postId }) {
  const [likeCount, setLikeCount] = useState(0);

  // Generate a random like count on component mount
  useEffect(() => {
    if (fakeEngagement.enableFakeLikes) {
      const min = fakeEngagement.likesMin;
      const max = fakeEngagement.likesMax;
      // Generate a random number between min and max (inclusive)
      const randomLikes = Math.floor(Math.random() * (max - min + 1)) + min;
      setLikeCount(randomLikes);
    }
  }, [postId]); // Depend on postId to ensure consistent value for the same post

  if (!fakeEngagement.enableFakeLikes) {
    return null;
  }

  return (
    <span className="text-sm text-gray-500 font-medium">
      {likeCount.toLocaleString()} likes
    </span>
  );
}