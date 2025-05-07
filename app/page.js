"use client";
import { useEffect, useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";

export default function Home() {
  const { data: session } = useSession();
  const [caption, setCaption] = useState("");
  const [image, setImage] = useState(null);
  const [posts, setPosts] = useState([]);

  const fetchPosts = async () => {
    const res = await fetch("/api/posts");
    const data = await res.json();
    setPosts(data);
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

  return (
    <div>
      <div>
        {session ? (
          <>
            <p>Welcome, {session.user.name}</p>
            <button onClick={() => signOut()}>Logout</button>
          </>
        ) : (
          <button onClick={() => signIn("google")}>Login with Google</button>
        )}
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

      <div>
      {posts.length === 0 && <p>No posts yet.</p>}
      {posts.map((post) => (
        <div key={post._id} className="mb-6">
          <img src={post.imageUrl} alt={post.caption} className="w-full max-w-sm" />
          <p>{post.caption}</p>
        </div>
      </div>
    
    </div>
  );
}

