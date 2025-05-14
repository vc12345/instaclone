"use client";
import { useState, useEffect, useMemo } from "react";
import { fakeEngagement } from "@/lib/config";
import { getRandomInRange } from "@/lib/utils";

export default function FakeLikeCounter({ postId }) {
  // Use useMemo to generate a stable random like count based on postId
  const likeCount = useMemo(() => {
    if (!fakeEngagement.enableFakeLikes) return 0;
    
    // Use postId as seed for consistent random number
    const seed = postId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const random = Math.sin(seed) * 10000;
    const min = fakeEngagement.likesMin;
    const max = fakeEngagement.likesMax;
    
    // Generate a random number between min and max (inclusive)
    return Math.floor(Math.abs(random) % (max - min + 1)) + min;
  }, [postId]);

  if (!fakeEngagement.enableFakeLikes) {
    return null;
  }

  return (
    <span className="text-sm text-gray-500 font-medium">
      {likeCount.toLocaleString()} likes
    </span>
  );
}