"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Header from "@/components/Header";

export default function MyPostsPage() {
  const { data: session, status } = useSession();
  const [posts, setPosts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const POSTS_PER_PAGE = 3;

  const fetchPosts = async () => {
    const res = await fetch("/api/posts");
    const allPosts = await res.json();
    const myPosts = allPosts.filter(
      (post) => post.userEmail === session?.user?.email
    );
    setPosts(myPosts);
  };

  useEffect(() => {
    if (session) {
      fetchPosts();
    }
  }, [session]);

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

  if (status === "loading") return <p>Loading...</p>;
  if (!session) return <p>You must be logged in to see your posts.</p>;

  return (
    <>
      <Header />
      <div>
        <h1 className="text-xl font-bold mb-4">My Posts</h1>
        {posts.length === 0 && <p>No posts yet.</p>}

        {paginatedPosts.map((post) => (
          <div key={post._id} className="mb-6">
            <img src={post.imageUrl} alt={post.caption} className="w-full max-w-sm" />
            <p>{post.caption}</p>
            <button
              onClick={() => handleDelete(post._id)}
              className="text-red-500 mt-2 underline"
            >
              Delete
            </button>
          </div>
        ))}

        {posts.length > POSTS_PER_PAGE && (
          <div className="flex gap-4 mt-4">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </>
  );
}

