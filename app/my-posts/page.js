"use client";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import Header from "@/components/Header";
import Image from "next/image";
import LayoutToggle from "@/components/LayoutToggle";

export default function MyPostsPage() {
  const { data: session, status } = useSession();
  const [posts, setPosts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [layout, setLayout] = useState('single');
  const [isLoading, setIsLoading] = useState(true);
  
  const POSTS_PER_PAGE = layout === 'grid' ? 9 : 3;

  const fetchPosts = useCallback(async () => {
    if (!session?.user?.email) return;
    
    setIsLoading(true);
    try {
      const res = await fetch("/api/posts");
      const allPosts = await res.json();
      const myPosts = allPosts.filter(
        (post) => post.userEmail === session.user.email
      );
      setPosts(myPosts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (session) {
      fetchPosts();
    }
  }, [session, fetchPosts]);

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    await fetch("/api/posts", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    });

    fetchPosts();
  };

  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE);
  const start = (currentPage - 1) * POSTS_PER_PAGE;
  const paginatedPosts = posts.slice(start, start + POSTS_PER_PAGE);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderGridLayout = () => (
    <div className="grid grid-cols-3 gap-1 md:gap-4">
      {paginatedPosts.map((post) => (
        <div key={post._id} className="aspect-square relative overflow-hidden bg-gray-100 group">
          <Image 
            src={post.imageUrl} 
            alt={post.caption || "My post"} 
            fill
            sizes="(max-width: 768px) 33vw, 300px"
            className="object-cover" 
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex flex-col justify-between p-3 opacity-0 group-hover:opacity-100">
            <div className="text-white text-xs truncate">{post.caption}</div>
            <div className="flex justify-between items-end w-full">
              <span className="text-white text-xs">{formatDate(post.createdAt)}</span>
              <button
                onClick={() => handleDelete(post._id)}
                className="text-red-400 hover:text-red-300 text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderSingleLayout = () => (
    <div className="space-y-6">
      {paginatedPosts.map((post) => (
        <div key={post._id} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          <div className="relative w-full h-[400px]">
            <Image 
              src={post.imageUrl} 
              alt={post.caption || "My post"} 
              fill
              sizes="(max-width: 768px) 100vw, 800px"
              className="object-cover" 
            />
          </div>
          <div className="p-4">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm text-gray-500">{formatDate(post.createdAt)}</span>
              <button
                onClick={() => handleDelete(post._id)}
                className="text-red-500 text-sm font-medium hover:text-red-600 transition-colors"
              >
                Delete Post
              </button>
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

  return (
    <div className="bg-gray-50 min-h-screen">
      <Header />
      <div className="max-w-4xl mx-auto pt-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">My Posts</h1>
          {posts.length > 0 && (
            <LayoutToggle layout={layout} setLayout={setLayout} />
          )}
        </div>
        
        {posts.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto text-gray-400 mb-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
            </svg>
            <h3 className="text-xl font-light mb-1">No Posts Yet</h3>
            <p className="text-gray-500">When you share photos, they&apos;ll appear here.</p>
          </div>
        ) : (
          layout === 'grid' ? renderGridLayout() : renderSingleLayout()
        )}

        {posts.length > POSTS_PER_PAGE && (
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
    </div>
  );
}