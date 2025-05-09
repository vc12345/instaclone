"use client";
import { useEffect, useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import UserSearchBar from "@/components/UserSearchBar";
import Header from "@/components/Header";

export default function Page() {
  return (
    <>
      <Header />
      {/* Your page content below */}
    </>
  );
}

export default function Home() {
  const { data: session } = useSession();
  const [caption, setCaption] = useState("");
  const [image, setImage] = useState(null);
  const [posts, setPosts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  const POSTS_PER_PAGE = 3;

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!session) return alert("Please log in first");

    const formData = new FormData();
    formData.append("caption", caption);
    formData.append("image", image);

    await fetch("/api/posts", {
      method: "POST",
      body: formData,
    });

    setCaption("");
    setImage(null);
    fetchPosts();
  };

  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE);
  const start = (currentPage - 1) * POSTS_PER_PAGE;
  const paginatedPosts = posts.slice(start, start + POSTS_PER_PAGE);

  return (
    <div>
      <div>
        {session ? (
          <>
            <p>Welcome, {session.user.name}</p>
            <button onClick={() => signOut()}>Logout</button>
          </>
        ) : (
          <div>
            <Link href="/login">Login</Link>
            <Link href="/signup">Sign Up</Link>
            <button onClick={() => signIn("google")}>Login with Google</button>
          </div>
        )}
      </div>

      <div className="my-6">
        <UserSearchBar />
      </div>

      {session && (
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Write a caption..."
          />
          <input type="file" onChange={(e) => setImage(e.target.files[0])} />
          <button type="submit">Upload</button>
          <div className="mt-8">
            <Link href="/my-posts" className="text-blue-500 underline">
              My Posts
            </Link>
          </div>
        </form>
      )}

      <div className="my-6">
        {paginatedPosts.map((post) => (
          <div key={post._id}>
            <img src={post.imageUrl} alt="post" width="300" />
            <p>{post.caption}</p>
          </div>
        ))}

        {/* Pagination controls */}
        <div className="flex gap-4 mt-4">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span>Page {currentPage} of {totalPages}</span>
          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}


