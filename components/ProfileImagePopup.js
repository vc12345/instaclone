"use client";
import { useRouter } from "next/navigation";
import ImagePopup from "./ImagePopup";

export default function ProfileImagePopup({ posts, initialIndex, username, layout, currentPage }) {
  const router = useRouter();
  
  const handleClose = () => {
    router.push(`/user/${username}?layout=${layout}&page=${currentPage}`);
  };
  
  return (
    <ImagePopup 
      posts={posts} 
      initialIndex={initialIndex} 
      onClose={handleClose} 
    />
  );
}