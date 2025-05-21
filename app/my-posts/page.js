"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import Header from "@/components/Header";
import Image from "next/image";
import LayoutToggle from "@/components/LayoutToggle";
import PostCard from "@/components/PostCard";
import OptimizedImage from "@/components/OptimizedImage";
import ImagePopup from "@/components/ImagePopup";
import FakeLikeCounter from "@/components/FakeLikeCounter";
import { formatDate } from "@/lib/utils";
import { layoutSettings, uploadLimits } from "@/lib/config";

export default function MyPostsPage() {
  const { data: session, status } = useSession();
  const [posts, setPosts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [layout, setLayout] = useState(layoutSettings.defaultLayout);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [totalPostCount, setTotalPostCount] = useState(0);
  
  const POSTS_PER_PAGE = useMemo(() => layout === 'grid' ? 9 : 3, [layout]);

  const fetchPosts = useCallback(async (page = 1) => {
    if (!session?.user?.email) return;
    
    setIsLoading(true);
    try {
      // Pass viewingOwnProfile=true to get all posts regardless of release time
      const res = await fetch(
        `/api/posts?username=${session.user.username}&viewingOwnProfile=true&page=${page}&limit=${POSTS_PER_PAGE}`
      );
      const data = await res.json();
      setPosts(data.posts);
      setTotalPages(data.pagination.pages);
      setCurrentPage(data.pagination.page);
      setTotalPostCount(data.pagination.total);
    } catch (error) {
      console.error("Error fetching posts:", error);
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  }, [session, POSTS_PER_PAGE]);

  useEffect(() => {
    if (session) {
      fetchPosts(currentPage);
    }
  }, [session, fetchPosts, currentPage]);

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    await fetch("/api/posts", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    });

    fetchPosts(currentPage);
  };

  // Handle layout change - reset to page 1
  const handleLayoutChange = () => {
    setCurrentPage(1);
  };

  // Check if a post is scheduled for future release
  const isScheduledPost = useCallback((post) => {
    if (!post.publicReleaseTime) return false;
    return new Date(post.publicReleaseTime) > new Date();
  }, []);

  // Format release date in GMT
  const formatReleaseDate = (dateString) => {
    const date = new Date(dateString);
    return date.toUTCString();
  };

  const handleImageClick = (index) => {
    setSelectedImageIndex(index);
  };

  const renderGridLayout = () => (
    <div className="grid grid-cols-3 gap-1 md:gap-4">
      {paginatedPosts.map((post, index) => (
        <div 
          key={post._id} 
          className="aspect-square relative overflow-hidden bg-gray-100 group cursor-pointer"
          onClick={() => handleImageClick(index)}
        >
          <OptimizedImage 
            src={post.imageUrl} 
            alt={post.caption || "My post"} 
            fill
            sizes="(max-width: 768px) 33vw, 300px"
            className="object-cover"
          />
          <div className="absolute top-2 left-2">
            {isScheduledPost(post) ? (
              <div className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full inline-flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 mr-1">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Scheduled
              </div>
            ) : (
              <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full inline-flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 mr-1">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Released
              </div>
            )}
          </div>
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex flex-col justify-between p-3 opacity-0 group-hover:opacity-100">
            <div className="text-white text-xs truncate">{post.caption}</div>
            <div className="flex flex-col items-start w-full">
              <span className="text-white text-xs mb-1">
                {isScheduledPost(post) 
                  ? `Scheduled: ${formatReleaseDate(post.publicReleaseTime)}` 
                  : `Released: ${formatReleaseDate(post.publicReleaseTime)}`}
              </span>
              <div className="flex justify-between w-full">
                <span className="text-white text-xs">Created: {formatDate(post.createdAt)}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(post._id);
                  }}
                  className="text-red-400 hover:text-red-300 text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderSingleLayout = () => (
    <div className="space-y-6">
      {paginatedPosts.map((post, index) => (
        <div key={post._id} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          <div 
            className="relative w-full h-[400px] cursor-pointer"
            onClick={() => handleImageClick(index)}
          >
            <OptimizedImage 
              src={post.imageUrl} 
              alt={post.caption || "My post"} 
              fill
              sizes="(max-width: 768px) 100vw, 800px"
              className="object-cover"
            />
            <div className="absolute top-4 right-4">
              {isScheduledPost(post) ? (
                <div className="bg-yellow-500 text-white px-3 py-1 rounded-full font-medium inline-flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Scheduled: {formatReleaseDate(post.publicReleaseTime)}
                </div>
              ) : (
                <div className="bg-green-500 text-white px-3 py-1 rounded-full font-medium inline-flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Released: {formatReleaseDate(post.publicReleaseTime)}
                </div>
              )}
            </div>
          </div>
          <div className="p-4">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm text-gray-500">Created: {formatDate(post.createdAt)}</span>
              <button
                onClick={() => handleDelete(post._id)}
                className="text-red-500 text-sm font-medium hover:text-red-600 transition-colors"
              >
                Delete Post
              </button>
            </div>
            <div className="mb-2">
              <FakeLikeCounter postId={post._id} />
            </div>
            <p>{post.caption}</p>
          </div>
        </div>
      ))}
    </div>
  );

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
          <p className="text-lg">You must be logged in to see your posts.</p>
        </div>
      </div>
    );
  }

  // Apply pagination
  const paginatedPosts = posts;

  return (
    <div className="bg-gray-50 min-h-screen">
      <Header />
      <div className="max-w-4xl mx-auto pt-8 px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">My Posts</h1>
            <p className="text-sm text-gray-500 mt-1">
              {totalPostCount} of {uploadLimits.maxTotalPosts} maximum posts
            </p>
          </div>
          <div className="flex items-center space-x-4 mt-2 md:mt-0">
            {posts.length > 0 && (
              <LayoutToggle 
                layout={layout} 
                setLayout={setLayout} 
                onLayoutChange={handleLayoutChange}
              />
            )}
          </div>
        </div>
        
        {totalPostCount >= uploadLimits.maxTotalPosts && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-yellow-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Post limit reached</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  You&apos;ve reached the maximum of {uploadLimits.maxTotalPosts} posts. To upload new posts, you&apos;ll need to delete some existing ones.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {posts.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto text-gray-400 mb-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175a2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
            </svg>
            <h3 className="text-xl font-light mb-1">No Posts Yet</h3>
            <p className="text-gray-500">When you share photos, they&apos;ll appear here.</p>
          </div>
        ) : (
          layout === 'grid' ? renderGridLayout() : renderSingleLayout()
        )}

        {totalPages > 1 && (
          <div className="flex justify-center mt-8 pb-8">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
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
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
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
      </div>

      {selectedImageIndex !== null && (
        <ImagePopup 
          posts={paginatedPosts} 
          initialIndex={selectedImageIndex} 
          onClose={() => setSelectedImageIndex(null)} 
        />
      )}
    </div>
  );
}