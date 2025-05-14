"use client";
import { memo } from "react";
import Link from "next/link";
import OptimizedImage from "./OptimizedImage";
import FakeLikeCounter from "./FakeLikeCounter";
import LikeButton from "./LikeButton";
import { formatDate, timeAgo } from "@/lib/utils";

// Memoized component for better performance
const PostCard = memo(function PostCard({ 
  post, 
  isOwnProfile = false, 
  showLikeButton = true,
  onDelete = null
}) {
  const isScheduledPost = (post) => {
    if (!post.publicReleaseTime) return false;
    return new Date(post.publicReleaseTime) > new Date();
  };

  const scheduled = isScheduledPost(post);

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      <div className="flex items-center p-3">
        <Link href={`/user/${post.username}`} className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-gray-200 mr-2 flex-shrink-0">
            <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-500 font-bold">
              {post.username?.charAt(0).toUpperCase() || "U"}
            </div>
          </div>
          <span className="font-medium">{post.username}</span>
        </Link>
        <span className="ml-auto text-xs text-gray-500">{formatDate(post.createdAt, { hour: undefined, minute: undefined })}</span>
      </div>
      
      <div className="relative w-full h-[500px]">
        <OptimizedImage 
          src={post.imageUrl} 
          alt={post.caption || "Post image"} 
          fill
          sizes="(max-width: 768px) 100vw, 800px"
          className={`object-cover ${isOwnProfile && scheduled ? 'opacity-60' : ''}`}
        />
        {isOwnProfile && scheduled && (
          <div className="absolute top-4 right-4 bg-yellow-500 text-white px-3 py-1 rounded-full font-medium">
            Scheduled for {new Date(post.publicReleaseTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </div>
        )}
      </div>
      
      <div className="p-3">
        <div className="flex items-center mb-2">
          {showLikeButton && <LikeButton postId={post._id.toString()} />}
          <div className="ml-2">
            <FakeLikeCounter postId={post._id.toString()} />
          </div>
          {onDelete && (
            <button
              onClick={() => onDelete(post._id)}
              className="ml-auto text-red-500 text-sm font-medium hover:text-red-600 transition-colors"
            >
              Delete
            </button>
          )}
        </div>
        <p className="mb-2">
          <Link href={`/user/${post.username}`} className="font-medium mr-2">
            {post.username}
          </Link>
          {post.caption}
        </p>
        <p className="text-xs text-gray-500">{timeAgo(post.createdAt)}</p>
      </div>
    </div>
  );
});

export default PostCard;