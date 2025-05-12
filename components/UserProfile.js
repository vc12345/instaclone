import { useSession } from "next-auth/react";
import { useState } from "react";

function FavoriteButton({ username }) {
  const { data: session } = useSession();
  const [favorited, setFavorited] = useState(false);

  const toggleFavorite = async () => {
    const res = await fetch("/api/favorites", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username }),
    });

    if (res.ok) {
      setFavorited(true);
    }
  };

  if (!session || session.user.username === username) return null;

  return (
    <button onClick={toggleFavorite} className="text-blue-500 underline mt-2">
      {favorited ? "Favorited" : "Add to Favorites"}
    </button>
  );
}
