"use client";
import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Header from "@/components/Header";
import Image from "next/image";

export default function Home() {
  const { data: session } = useSession();
  const [caption, setCaption] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [posts, setPosts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const POSTS_PER_PAGE = 5;

  const fetchPosts = async () => {
    const res = await fetch("/api/posts");
    const data = await res.json();

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const recentPosts = data.filter(post => new Date(post.createdAt) > yesterday);
    setPosts(recentPosts);
  };

  useEffect(() => {
    fetchPosts();
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
      fetchPosts();
    } catch (error) {
      console.error("Error uploading post:", error);
      alert("Failed to upload post. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE);
  const start = (currentPage - 1) * POSTS_PER_PAGE;
  const paginatedPosts = posts.slice(start, start + POSTS_PER_PAGE);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <Header />
      
      <main className="max-w-xl mx-auto pt-6 pb-16 px-4">
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

        {/* Posts Feed */}
        <div className="space-y-4">
          {paginatedPosts.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto text-gray-400 mb-3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
              </svg>
              <h3 className="text-xl font-light mb-1">No Recent Posts</h3>
              <p className="text-gray-500">Recent posts will appear here.</p>
            </div>
          ) : (
            paginatedPosts.map((post) => (
              <div key={post._id} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                {/* Post Header */}
                <div className="flex items-center p-3">
                  <Link href={`/user/${post.username}`} className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-gray-200 mr-2 flex-shrink-0">
                      {/* User avatar could go here */}
                      <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-500 font-bold">
                        {post.username?.charAt(0).toUpperCase() || "U"}
                      </div>
                    </div>
                    <span className="font-medium">{post.username}</span>
                  </Link>
                  <span className="ml-auto text-xs text-gray-500">{formatDate(post.createdAt)}</span>
                </div>
                
                {/* Post Image */}
                <div className="relative w-full h-[500px]">
                  <Image 
                    src={post.imageUrl} 
                    alt={post.caption || "Post image"} 
                    fill
                    sizes="(max-width: 768px) 100vw, 600px"
                    className="object-cover" 
                  />
                </div>
                
                {/* Post Content */}
                <div className="p-3">
                  <p className="mb-2">
                    <Link href={`/user/${post.username}`} className="font-medium mr-2">
                      {post.username}
                    </Link>
                    {post.caption}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded ${
                  currentPage === 1
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-blue-500 hover:bg-blue-50"
                }`}
              >
                Previous
              </button>
              <span className="text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded ${
                  currentPage === totalPages
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-blue-500 hover:bg-blue-50"
                }`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}