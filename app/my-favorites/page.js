"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Header from "@/components/Header";
import Image from "next/image";

export default function MyFavoritesPage() {
  const { data: session, status } = useSession();
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!session?.user?.email) return;
      
      try {
        setIsLoading(true);
        
        // Fetch favorites
        const res = await fetch("/api/favorites");
        const favoritesData = await res.json();
        
        // Fetch user details for each favorited username
        const userPromises = favoritesData.map(async (fav) => {
          const userRes = await fetch(`/api/search-users?query=${fav.favoritedUsername}`);
          const users = await userRes.json();
          const user = users.find(u => u.username === fav.favoritedUsername);
          return {
            ...fav,
            user: user || { username: fav.favoritedUsername }
          };
        });
        
        const favoritesWithUserDetails = await Promise.all(userPromises);
        setFavorites(favoritesWithUserDetails);
      } catch (error) {
        console.error("Error fetching favorites:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFavorites();
  }, [session]);

  const handleUnfollow = async (username) => {
    try {
      await fetch("/api/favorites", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      
      // Update state to remove the unfollowed user
      setFavorites(favorites.filter(fav => fav.favoritedUsername !== username));
    } catch (error) {
      console.error("Error unfollowing user:", error);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <Header />
        <div className="max-w-4xl mx-auto pt-8 px-4 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <Header />
        <div className="max-w-4xl mx-auto pt-8 px-4 text-center">
          <p className="text-lg mb-4">You must be logged in to view your favorites.</p>
          <Link href="/login" className="text-blue-500 font-medium">
            Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <Header />
      <div className="max-w-4xl mx-auto pt-8 px-4">
        <h1 className="text-2xl font-bold mb-6">People You Follow</h1>
        
        {favorites.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto text-gray-400 mb-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
            <h3 className="text-xl font-light mb-1">No Followed Users</h3>
            <p className="text-gray-500">When you follow users, they&apos;ll appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {favorites.map((favorite) => (
              <div key={favorite.favoritedUsername} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                <div className="p-4 flex items-center">
                  <div className="w-16 h-16 rounded-full bg-gray-200 mr-4 flex-shrink-0 overflow-hidden">
                    {favorite.user?.image ? (
                      <div className="relative w-full h-full">
                        <Image 
                          src={favorite.user.image} 
                          alt={favorite.favoritedUsername}
                          fill
                          sizes="64px"
                          className="object-cover" 
                        />
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-500 text-2xl font-bold">
                        {favorite.favoritedUsername.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-grow">
                    <Link 
                      href={`/user/${favorite.favoritedUsername}`}
                      className="font-medium text-lg hover:underline"
                    >
                      {favorite.favoritedUsername}
                    </Link>
                    {favorite.user?.name && (
                      <p className="text-gray-500">{favorite.user.name}</p>
                    )}
                  </div>
                </div>
                
                <div className="px-4 pb-4 flex justify-between items-center">
                  <Link 
                    href={`/user/${favorite.favoritedUsername}`}
                    className="text-blue-500 font-medium"
                  >
                    View Profile
                  </Link>
                  
                  <button
                    onClick={() => handleUnfollow(favorite.favoritedUsername)}
                    className="text-red-500 text-sm hover:text-red-600"
                  >
                    Unfollow
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}