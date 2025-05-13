"use client";

import { useState } from "react";

export default function FavoriteButton({ username, initialIsFavorited }) {
  const [isFavorited, setIsFavorited] = useState(initialIsFavorited);

  const handleToggleFavorite = async () => {
    try {
      await fetch("/api/favorites", {
        method: isFavorited ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      setIsFavorited(!isFavorited);
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  return (
    <button 
      onClick={handleToggleFavorite} 
      className="text-blue-500 underline"
    >
      {isFavorited ? "Remove from Favorites" : "Add to Favorites"}
    </button>
  );
}