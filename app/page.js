"use client";
import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Header from "@/components/Header";
import Image from "next/image";
import LayoutToggle from "@/components/LayoutToggle";

export default function Home() {
  const { data: session } = useSession();
  const [caption, setCaption] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef(null);

  // Fetch users who posted in the last 24 hours
  const fetchRecentUsers = async () => {
    setIsLoading(true);
    try {
      // Get all posts
      const res = await fetch("/api/posts");
      const data = await res.json();
      
      // Filter posts from the last 24 hours
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const recentPosts = data.filter(post => new Date(post.createdAt) > yesterday);
      
      // Extract unique users from recent posts
      const uniqueUsers = Array.from(new Set(recentPosts.map(post => post.username)))
        .map(username => {
          const userPosts = recentPosts.filter(post => post.username === username);
          return {
            username,
            postCount: userPosts.length,
            latestPost: userPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0],
            // Get the most recent post image for the user
            latestImage: userPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]?.imageUrl
          };
        })
        .sort((a, b) => b.postCount - a.postCount); // Sort by post count
      
      setRecentUsers(uniqueUsers);
    } catch (error) {
      console.error("Error fetching recent users:", error);
      setRecentUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentUsers();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!session) return alert("Please log in first");
    if (!image) return alert("Please select an image");

    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append("caption", caption);
      formData.append("image", image);

      await fetch("/api/posts", {
        method: "POST",
        body: formData,
      });

      setCaption("");
      setImage(null);
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      fetchRecentUsers(); // Refresh the list after posting
    } catch (error) {
      console.error("Error uploading post:", error);
      alert("Failed to upload post. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const timeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    let interval = Math.floor(seconds / 3600);
    if (interval >= 24) {
      return "yesterday";
    }
    if (interval >= 1) {
      return `${interval} ${interval === 1 ? 'hour' : 'hours'} ago`;
    }
    
    interval = Math.floor(seconds / 60);
    if (interval >= 1) {
      return `${interval} ${interval === 1 ? 'minute' : 'minutes'} ago`;
    }
    
    return 'just now';
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <Header />
      
      <main className="max-w-4xl mx-auto pt-6 pb-16 px-4">
        {session && (
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Create Post</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Write a caption..."
                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  rows="3"
                />
              </div>
              
              <div className="mb-4">
                {imagePreview ? (
                  <div className="relative">
                    <div className="relative w-full h-64">
                      <Image 
                        src={imagePreview} 
                        alt="Preview" 
                        fill
                        className="object-cover rounded-md" 
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setImage(null);
                        setImagePreview(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = "";
                        }
                      }}
                      className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-md p-8 text-center cursor-pointer hover:bg-gray-50"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 mx-auto text-gray-400 mb-2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                    <p className="text-gray-500">Click to upload an image</p>
                  </div>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleImageChange} 
                  accept="image/*"
                  className="hidden" 
                />
              </div>
              
              <button 
                type="submit" 
                disabled={isUploading || !image}
                className={`w-full py-2 px-4 rounded-md font-medium ${
                  isUploading || !image
                    ? "bg-blue-300 cursor-not-allowed"
                    : "bg-blue-500 hover:bg-blue-600"
                } text-white transition duration-200`}
              >
                {isUploading ? "Uploading..." : "Share"}
              </button>
            </form>
          </div>
        )}

        {/* Recent Active Users Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800">Recent Activity</h2>
            <div className="text-sm text-gray-500">Last 24 hours</div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : recentUsers.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto text-gray-400 mb-3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
              <h3 className="text-xl font-light mb-1">No Recent Activity</h3>
              <p className="text-gray-500">No users have posted in the last 24 hours.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentUsers.map((user) => (
                <Link 
                  href={`/user/${user.username}`} 
                  key={user.username}
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="relative h-40 bg-gray-100">
                    {user.latestImage && (
                      <Image
                        src={user.latestImage}
                        alt={`${user.username}'s latest post`}
                        fill
                        sizes="(max-width: 768px) 100vw, 400px"
                        className="object-cover"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                      <div className="p-4 text-white">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-gray-200 mr-3 flex-shrink-0 border-2 border-white overflow-hidden">
                            <div className="w-full h-full flex items-center justify-center bg-blue-500 text-white font-bold">
                              {user.username.charAt(0).toUpperCase()}
                            </div>
                          </div>
                          <div>
                            <h3 className="font-bold">{user.username}</h3>
                            <p className="text-sm opacity-90">
                              {user.postCount} {user.postCount === 1 ? 'post' : 'posts'} today
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      Latest post: {timeAgo(user.latestPost?.createdAt)}
                    </div>
                    <div className="text-blue-500 text-sm font-medium">
                      View Profile
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}