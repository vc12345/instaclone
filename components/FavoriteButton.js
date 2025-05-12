"use client";
import { useSession } from "next-auth/react";
import { useState } from "react";

export default function FavoriteButton({ username }) {
  const { data: session } = useSession();
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFavorite = async () => {
    if (!session) return alert("Please log in to favorite users.");
    if (session.user.username === username) return alert("You can't favorite yourself.");
    setLoading(true);

    const res = await fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });

    if (res.ok) {
      setIsFavorited(true);
    } else {
      const err = await res.json();
      alert(err.message || "Error adding favorite.");
    }

    setLoading(false);
  };

  return (
    <button
      onClick={handleFavorite}
      disabled={loading || isFavorited}
      className={`underline ${isFavorited ? "text-gray-400" : "text-green-600"}`}
    >
      {isFavorited ? "Favorited" : "Add to Favorites"}
    </button>
  );
}